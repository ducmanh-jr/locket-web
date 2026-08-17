"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Moment, MusicTrack } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { addDeletedMomentId, getDeletedMomentIds, getStoredDemoMoments } from '@/lib/demoStore';
import {
  fetchGlobalCloudMoments,
  fetchGlobalCloudProfiles,
  pushMomentToGlobalCloud,
  deleteMomentFromGlobalCloud,
  compressImageForCloudSync,
  uploadBlobToPublicUrl,
  uploadMediaToPublicUrl,
} from '@/lib/cloudSync';
import { CapturedMedia, captureVideoThumbnail } from '@/lib/camera';
import { sanitizeMoments, sortMoments } from '@/lib/media';
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
  ) => Promise<Moment>;
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
  addMoment: async () => ({} as Moment),
  deleteMoment: async () => {},
  addReaction: async () => {},
  refreshMoments: async () => {},
});

const LOCAL_MOMENTS_KEY = 'locket_local_moments_v1';

function readLocalMoments(): Moment[] {
  if (typeof window === 'undefined') return [];
  try {
    const deletedSet = new Set(getDeletedMomentIds());
    const stored = localStorage.getItem(LOCAL_MOMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return sanitizeMoments(parsed.filter((m) => m && m.id && !deletedSet.has(m.id)));
      }
    }
  } catch (e) {}
  return [];
}

function sanitizeMomentForLocalStorage(m: Moment): Moment {
  if (!m || !m.id) return m;
  // Always preserve public HTTP/HTTPS URLs intact
  if (m.media_url?.startsWith('http://') || m.media_url?.startsWith('https://')) {
    return m;
  }
  // Strip huge base64 video payloads (>50KB) ONLY IF we have a valid fallback thumbnail_url
  if (m.media_url && m.media_url.startsWith('data:video/') && m.media_url.length > 50000) {
    if (m.thumbnail_url && m.thumbnail_url.length > 0) {
      return {
        ...m,
        media_url: m.thumbnail_url,
      };
    }
  }
  return m;
}

function saveLocalMoment(moment: Moment): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readLocalMoments();
    const cleanCurrent = sanitizeMomentForLocalStorage(moment);
    const updated = [cleanCurrent, ...existing.filter((m) => m.id !== moment.id)]
      .slice(0, 40)
      .map(sanitizeMomentForLocalStorage);
    localStorage.setItem(LOCAL_MOMENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[MomentsProvider] localStorage save skipped or quota exceeded:', e);
  }
}

function removeLocalMoment(momentId: string): void {
  if (typeof window === 'undefined' || !momentId) return;
  addDeletedMomentId(momentId);
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

  // Keep moments' sender objects in sync with currentUser's latest avatar & display name
  useEffect(() => {
    if (!currentUser?.id || !currentUser?.avatar_url) return;
    setMoments((prev) =>
      prev.map((m) => {
        const isMyMoment = m.sender_id === currentUser.id || m.sender?.id === currentUser.id;
        if (
          isMyMoment &&
          (m.sender?.avatar_url !== currentUser.avatar_url || m.sender?.display_name !== currentUser.display_name)
        ) {
          return {
            ...m,
            sender: {
              ...(m.sender || {}),
              ...currentUser,
            },
          };
        }
        return m;
      })
    );
  }, [currentUser]);

  // Pure Shared Room Fetch: All accounts fetch from the EXACT same DB source
  const loadMoments = useCallback(async () => {
    try {
      const deletedSet = new Set(getDeletedMomentIds());
      const cloudMoments = await fetchGlobalCloudMoments();
      const sanitized = sanitizeMoments(cloudMoments).filter((m) => !deletedSet.has(m.id));
      const cloudIds = new Set(sanitized.map((m) => m.id));

      // Auto-save Cloud public URLs to localStorage so uploader's cache is updated with working HTTPS URLs
      sanitized.forEach((cloudM) => {
        if (cloudM.media_url?.startsWith('http://') || cloudM.media_url?.startsWith('https://')) {
          saveLocalMoment(cloudM);
        }
      });

      const localMoments = readLocalMoments().filter((m) => !deletedSet.has(m.id));
      const validLocal = localMoments.filter(
        (lm) => !deletedSet.has(lm.id) && (cloudIds.has(lm.id) || lm.media_url?.startsWith('blob:') || lm.media_url?.startsWith('data:') || lm.media_url?.startsWith('http'))
      );

      setMoments((prevMoments) => {
        const now = Date.now();
        const pendingOptimistic = prevMoments.filter((m) => {
          if (deletedSet.has(m.id)) return false;
          const createdAtTime = new Date(m.created_at || 0).getTime();
          const isRecent = now - createdAtTime < 180000;
          const existsInCloud = cloudIds.has(m.id);
          return isRecent && !existsInCloud;
        });

        // PREFER CLOUD MOMENTS (sanitized) OVER LOCAL CACHE (validLocal)!
        // This guarantees that uploader always gets the public Supabase HTTPS URL over expired local blob/data URLs
        const merged = [...sanitized, ...pendingOptimistic, ...validLocal].map((m) => {
          const isMyMoment = m.sender_id === currentUser.id || m.sender?.id === currentUser.id;
          if (isMyMoment && currentUser.avatar_url) {
            return {
              ...m,
              sender: {
                ...(m.sender || {}),
                ...currentUser,
              },
            };
          }
          return m;
        });

        const sorted = sortMoments(merged) as Moment[];
        return sorted.filter((m, i, self) => !deletedSet.has(m.id) && i === self.findIndex((x) => x.id === m.id));
      });
    } catch (e) {
      console.error('Error fetching room moments:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadMoments();

    // 5-second background sync interval to guarantee live delete sync across all devices
    const pollInterval = setInterval(() => {
      loadMoments();
    }, 5000);

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
          removeLocalMoment(event.data.momentId);
          addDeletedMomentId(event.data.momentId);
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
              removeLocalMoment(payload.old.id);
              addDeletedMomentId(payload.old.id);
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
  }, [loadMoments, currentUser.id]);

  const addMoment = useCallback(
    async (
      media: CapturedMedia,
      caption: string,
      _recipientIds: string[],
      music?: MusicTrack,
      audioOption?: 'mute' | 'original' | 'music'
    ) => {
      const newMomentId = `m-${media.type}-v10-${Date.now()}`;
      let localMediaUrl = media.dataUrl;
      let initialThumbUrl: string | undefined = undefined;

      if (media.type === 'video') {
        try {
          initialThumbUrl = await captureVideoThumbnail(localMediaUrl || '');
        } catch (e) {}
      }

      // 1. Construct Optimistic Local Moment (Instant 0ms UI response)
      const optimisticMoment: Moment = {
        id: newMomentId,
        sender_id: currentUser.id,
        sender: currentUser,
        media_url: localMediaUrl,
        thumbnail_url: initialThumbUrl,
        media_type: media.type,
        audio_option: audioOption || (media.type === 'video' ? 'original' : undefined),
        caption: caption,
        created_at: new Date().toISOString(),
        reactions: [],
        music: music,
      };

      // 2. Immediate Local State Update & Local Persistence (Instant 0ms Feedback)
      saveLocalMoment(optimisticMoment);
      setSelectedFriendFilter('all');
      setMoments((prev) => sortMoments([optimisticMoment, ...prev]) as Moment[]);

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
        let thumbnailUrl: string | undefined = initialThumbUrl;

        if (media.type === 'photo') {
          try {
            if (media.blob && media.blob.size > 0) {
              const uploadedPhotoUrl = await uploadBlobToPublicUrl(media.blob, `photo_${newMomentId}`);
              if (uploadedPhotoUrl) {
                finalMediaUrl = uploadedPhotoUrl;
              } else {
                console.error('[MomentsProvider] Photo blob upload returned null for', newMomentId);
              }
            } else if (media.dataUrl.startsWith('data:image/')) {
              finalMediaUrl = await compressImageForCloudSync(media.dataUrl);
            }
          } catch (e) {
            console.error('[MomentsProvider] Photo upload error:', e);
          }
        } else if (media.type === 'video') {
          try {
            let uploadedVideoUrl: string | null = null;
            if (media.blob && media.blob.size > 0) {
              uploadedVideoUrl = await uploadBlobToPublicUrl(media.blob, `video_${newMomentId}`);
            }
            if (!uploadedVideoUrl && media.dataUrl) {
              uploadedVideoUrl = await uploadMediaToPublicUrl(media.dataUrl, `video_${newMomentId}`);
            }
            if (!thumbnailUrl && media.dataUrl) {
              thumbnailUrl = await captureVideoThumbnail(media.dataUrl || '');
            }

            if (uploadedVideoUrl) {
              finalMediaUrl = uploadedVideoUrl;
            } else {
              console.warn('[MomentsProvider] Video blob upload fallback to local URL for', newMomentId);
            }
          } catch (e) {
            console.error('[MomentsProvider] Video upload error:', e);
          }
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

        // Broadcast updated final moment to all open browser tabs
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const tabChannel = new BroadcastChannel('locket_tab_sync');
            tabChannel.postMessage({ type: 'NEW_MOMENT', moment: finalMoment });
            tabChannel.close();
          }
        } catch (e) {}

        // Save to Supabase Cloud DB (with retry)
        let pushOk = await pushMomentToGlobalCloud(finalMoment);
        if (!pushOk) {
          console.warn('[MomentsProvider] First push failed for', newMomentId, '- retrying in 3s...');
          await new Promise((r) => setTimeout(r, 3000));
          pushOk = await pushMomentToGlobalCloud(finalMoment);
          if (!pushOk) {
            console.error('[MomentsProvider] CRITICAL: Moment', newMomentId, 'could NOT be saved to cloud DB after retry!');
          }
        }
      })();

      return optimisticMoment;
    },
    [currentUser]
  );

  const deleteMoment = useCallback(async (momentId: string) => {
    addDeletedMomentId(momentId);
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

  const FAKE_USER_IDS = new Set(['user-dm', 'user-system32', 'user-admin']);
  const FAKE_USERNAMES = new Set(['dm', 'system32', 'admin']);

  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalCloudProfiles().then((profs) => {
      if (profs && Array.isArray(profs) && profs.length > 0) {
        const clean = profs.filter(
          (p) =>
            p &&
            !FAKE_USER_IDS.has(p.id) &&
            !FAKE_USERNAMES.has(p.username?.toLowerCase())
        );
        setAllProfiles(clean);
      }
    });
  }, []);

  const membersFilterOptions: MemberFilterOption[] = useMemo(() => {
    const list: MemberFilterOption[] = [
      { id: 'all', name: 'Tất cả bạn bè', count: moments.length },
    ];
    
    // Key senders strictly by unique account ID (different gmail/user = different account)
    const sendersMap = new Map<string, { id: string; name: string; avatar_url?: string; count: number }>();
    
    // First, populate registered profiles in the room
    allProfiles.forEach((p) => {
      if (p?.id && !FAKE_USER_IDS.has(p.id) && !FAKE_USERNAMES.has(p.username?.toLowerCase())) {
        sendersMap.set(p.id, {
          id: p.id,
          name: p.display_name || p.username || 'Thành viên Locket',
          avatar_url: p.avatar_url,
          count: 0,
        });
      }
    });

    // Accumulate moment count per unique user ID
    moments.forEach((m) => {
      const sid = m.sender?.id || m.sender_id;
      if (!sid) return;

      const sname =
        m.sender?.display_name ||
        (sid === currentUser.id ? currentUser.display_name : 'Thành viên Locket');
      const savatar =
        m.sender?.avatar_url ||
        (sid === currentUser.id ? currentUser.avatar_url : undefined);

      if (!sendersMap.has(sid)) {
        sendersMap.set(sid, {
          id: sid,
          name: sname,
          avatar_url: savatar,
          count: 1,
        });
      } else {
        const existing = sendersMap.get(sid)!;
        existing.count += 1;
        if (!existing.avatar_url && savatar) existing.avatar_url = savatar;
      }
    });

    sendersMap.forEach((val) => {
      list.push({
        id: val.id,
        name: val.name,
        avatar_url: val.avatar_url,
        count: val.count,
      });
    });

    return list;
  }, [moments, currentUser, allProfiles]);

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
