"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Moment, MusicTrack } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthProvider';
import {
  fetchGlobalCloudMoments,
  pushMomentToGlobalCloud,
  deleteMomentFromGlobalCloud,
  compressImageForCloudSync,
  uploadBlobToPublicUrl,
} from '@/lib/cloudSync';
import { CapturedMedia, captureVideoThumbnail } from '@/lib/camera';
import { sanitizeMoments } from '@/lib/media';
import { MemberFilterOption } from '@/components/LocketHeader';

interface MomentsContextValue {
  moments: Moment[];
  filteredMoments: Moment[];
  loading: boolean;
  selectedFriendFilter: string;
  setSelectedFriendFilter: (filterId: string) => void;
  membersFilterOptions: MemberFilterOption[];
  addMoment: (
    media: CapturedMedia,
    caption: string,
    recipientIds: string[],
    music?: MusicTrack,
    audioOption?: 'mute' | 'original' | 'music'
  ) => Promise<void>;
  deleteMoment: (momentId: string) => Promise<void>;
  addReaction: (momentId: string, emoji: string) => Promise<void>;
  refreshMoments: () => Promise<void>;
}

const MomentsContext = createContext<MomentsContextValue>({
  moments: [],
  filteredMoments: [],
  loading: true,
  selectedFriendFilter: 'all',
  setSelectedFriendFilter: () => {},
  membersFilterOptions: [],
  addMoment: async () => {},
  deleteMoment: async () => {},
  addReaction: async () => {},
  refreshMoments: async () => {},
});

const LOCAL_MOMENTS_KEY = 'locket_local_moments_v1';

function readLocalMoments(): Moment[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_MOMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return sanitizeMoments(parsed);
    }
  } catch (e) {}
  return [];
}

function saveLocalMoment(moment: Moment): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readLocalMoments();
    const updated = [moment, ...existing.filter((m) => m.id !== moment.id)].slice(0, 50);
    localStorage.setItem(LOCAL_MOMENTS_KEY, JSON.stringify(updated));
  } catch (e) {}
}

function removeLocalMoment(momentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readLocalMoments();
    const updated = existing.filter((m) => m.id !== momentId);
    localStorage.setItem(LOCAL_MOMENTS_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export const MomentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [moments, setMoments] = useState<Moment[]>(() => readLocalMoments());
  const [loading, setLoading] = useState(true);
  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string>('all');

  const currentUser = userProfile || {
    id: 'user-me',
    username: 'locket_user',
    display_name: 'Thành viên Locket',
    avatar_url: '',
  };

  // Pure Shared Room Fetch: All accounts fetch from the EXACT same DB source
  const loadMoments = useCallback(async () => {
    try {
      const cloudMoments = await fetchGlobalCloudMoments();
      const sanitized = sanitizeMoments(cloudMoments);
      const localMoments = readLocalMoments();

      setMoments((prevMoments) => {
        // Merge cloud moments with local persistent moments & recent optimistic moments
        const now = Date.now();
        const pendingOptimistic = prevMoments.filter((m) => {
          const createdAtTime = new Date(m.created_at || 0).getTime();
          const isRecent = now - createdAtTime < 300000; // 5-minute optimistic grace period
          const existsInCloud = sanitized.some((c) => c.id === m.id);
          return isRecent && !existsInCloud;
        });

        const merged = [...pendingOptimistic, ...localMoments, ...sanitized];
        merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        return merged.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
      });
    } catch (e) {
      console.error('Error fetching room moments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMoments();

    // 15-second background sync interval to guarantee 100% identical room state across all devices
    const pollInterval = setInterval(() => {
      loadMoments();
    }, 15000);

    // Instant Cross-Tab Broadcast Channel Sync
    let tabChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      tabChannel = new BroadcastChannel('locket_tab_sync');
      tabChannel.onmessage = (event) => {
        if (event.data?.type === 'NEW_MOMENT' && event.data?.moment) {
          setMoments((prev) => {
            if (prev.some((m) => m.id === event.data.moment.id)) return prev;
            return [event.data.moment, ...prev];
          });
        } else if (event.data?.type === 'DELETE_MOMENT' && event.data?.momentId) {
          setMoments((prev) => prev.filter((m) => m.id !== event.data.momentId));
        }
      };
    }

    // Realtime PostgreSQL changes subscription across all devices
    let dbChannel: any = null;
    if (isSupabaseConfigured()) {
      dbChannel = supabase
        .channel('public:moments-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'moments' },
          async (payload) => {
            if (payload?.new) {
              const rawMoment = payload.new as Moment;
              if (rawMoment.sender_id === currentUser.id) return;

              let senderObj = rawMoment.sender;
              if (!senderObj && rawMoment.sender_id) {
                try {
                  const { data: prof } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', rawMoment.sender_id)
                    .single();
                  if (prof) senderObj = prof;
                } catch (err) {}
              }

              const fullMoment: Moment = {
                ...rawMoment,
                sender: senderObj || {
                  id: rawMoment.sender_id || 'locket-user',
                  username: 'locket_user',
                  display_name: 'Thành viên Locket',
                  avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawMoment.sender_id || 'user'}`,
                },
              };

              setMoments((prev) => {
                if (prev.some((m) => m.id === fullMoment.id)) return prev;
                return [fullMoment, ...prev];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'moments' },
          (payload) => {
            if (payload?.old?.id) {
              setMoments((prev) => prev.filter((m) => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      if (tabChannel) tabChannel.close();
      if (dbChannel) supabase.removeChannel(dbChannel);
    };
  }, [currentUser.id, loadMoments]);

  const addMoment = useCallback(
    async (
      media: CapturedMedia,
      caption: string,
      _recipientIds: string[],
      music?: MusicTrack,
      audioOption?: 'mute' | 'original' | 'music'
    ) => {
      const newMomentId = `m-${media.type}-v10-${Date.now()}`;
      const localMediaUrl = media.dataUrl;

      // 1. Construct Optimistic Local Moment (Instant 0ms UI response)
      const optimisticMoment: Moment = {
        id: newMomentId,
        sender_id: currentUser.id,
        sender: currentUser,
        media_url: localMediaUrl,
        media_type: media.type,
        audio_option: audioOption || (media.type === 'video' ? 'original' : undefined),
        caption: caption,
        created_at: new Date().toISOString(),
        reactions: [],
        music: music,
      };

      // 2. Immediate Local State Update & Local Persistence (Instant Feedback & Offline Protection)
      saveLocalMoment(optimisticMoment);
      setSelectedFriendFilter('all');
      setMoments((prev) => [optimisticMoment, ...prev]);

      // 3. Broadcast instantly to open tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const tabChannel = new BroadcastChannel('locket_tab_sync');
          tabChannel.postMessage({ type: 'NEW_MOMENT', moment: optimisticMoment });
          tabChannel.close();
        }
      } catch (e) {}

      // 4. Background Stream Upload & Cloud Sync
      (async () => {
        let finalMediaUrl = localMediaUrl;
        let thumbnailUrl: string | undefined = undefined;

        if (media.type === 'photo') {
          try {
            if (media.blob && media.blob.size > 0) {
              const uploadedPhotoUrl = await uploadBlobToPublicUrl(media.blob, `photo_${newMomentId}`);
              if (uploadedPhotoUrl) finalMediaUrl = uploadedPhotoUrl;
            } else if (media.dataUrl.startsWith('data:image/')) {
              finalMediaUrl = await compressImageForCloudSync(media.dataUrl);
            }
          } catch (e) {}
        } else if (media.type === 'video') {
          try {
            const [uploadedVideoUrl, thumb] = await Promise.all([
              uploadBlobToPublicUrl(media.blob, `video_${newMomentId}`),
              captureVideoThumbnail(media.dataUrl || ''),
            ]);
            if (uploadedVideoUrl) finalMediaUrl = uploadedVideoUrl;
            if (thumb) thumbnailUrl = thumb;
          } catch (e) {}
        }

        const finalMoment: Moment = {
          ...optimisticMoment,
          media_url: finalMediaUrl,
          thumbnail_url: thumbnailUrl,
        };

        // Save durable moment to localStorage & local state
        saveLocalMoment(finalMoment);
        setMoments((prev) =>
          prev.map((m) => (m.id === newMomentId ? finalMoment : m))
        );

        // Save to Supabase Cloud DB
        await pushMomentToGlobalCloud(finalMoment);
      })();
    },
    [currentUser]
  );

  const deleteMoment = useCallback(async (momentId: string) => {
    removeLocalMoment(momentId);
    setMoments((prev) => prev.filter((m) => m.id !== momentId));
    deleteMomentFromGlobalCloud(momentId).catch(() => {});

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const tabChannel = new BroadcastChannel('locket_tab_sync');
        tabChannel.postMessage({ type: 'DELETE_MOMENT', momentId });
        tabChannel.close();
      }
    } catch (e) {}
  }, []);

  const addReaction = useCallback(
    async (momentId: string, emoji: string) => {
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === momentId) {
            const existing = m.reactions || [];
            const newReaction = {
              id: `react-${Date.now()}`,
              moment_id: momentId,
              user_id: currentUser.id,
              user: currentUser,
              emoji: emoji,
              created_at: new Date().toISOString(),
            };
            return { ...m, reactions: [...existing, newReaction] };
          }
          return m;
        })
      );

      if (isSupabaseConfigured() && userProfile) {
        try {
          await supabase.from('reactions').insert({
            moment_id: momentId,
            user_id: userProfile.id,
            emoji: emoji,
          });
        } catch (e) {}
      }
    },
    [currentUser, userProfile]
  );

  const membersFilterOptions: MemberFilterOption[] = useMemo(() => {
    const list: MemberFilterOption[] = [
      { id: 'all', name: 'Tất cả bạn bè', count: moments.length },
    ];
    const sendersMap = new Map<string, { name: string; avatar_url?: string; count: number }>();
    moments.forEach((m) => {
      const sid = m.sender?.id || m.sender_id || 'unknown';
      const sname =
        m.sender?.display_name ||
        (sid === currentUser.id ? currentUser.display_name : 'Thành viên Locket');
      const savatar =
        m.sender?.avatar_url ||
        (sid === currentUser.id ? currentUser.avatar_url : undefined);
      if (!sendersMap.has(sid)) {
        sendersMap.set(sid, { name: sname, avatar_url: savatar, count: 1 });
      } else {
        const existing = sendersMap.get(sid)!;
        existing.count += 1;
      }
    });
    sendersMap.forEach((val, key) => {
      list.push({
        id: key,
        name: val.name,
        avatar_url: val.avatar_url,
        count: val.count,
      });
    });
    return list;
  }, [moments, currentUser]);

  const filteredMoments = useMemo(() => {
    if (selectedFriendFilter === 'all') return moments;
    return moments.filter(
      (m) =>
        m.sender_id === selectedFriendFilter ||
        m.sender?.id === selectedFriendFilter ||
        m.sender?.username === selectedFriendFilter
    );
  }, [moments, selectedFriendFilter]);

  return (
    <MomentsContext.Provider
      value={{
        moments,
        filteredMoments,
        loading,
        selectedFriendFilter,
        setSelectedFriendFilter,
        membersFilterOptions,
        addMoment,
        deleteMoment,
        addReaction,
        refreshMoments: loadMoments,
      }}
    >
      {children}
    </MomentsContext.Provider>
  );
};

export function useMoments() {
  return useContext(MomentsContext);
}
