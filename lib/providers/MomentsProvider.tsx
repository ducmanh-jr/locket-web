"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Moment, MusicTrack } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { addDeletedMomentId, getDeletedMomentIds, getDeletedMemberIds, addDeletedMemberId, getStoredDemoMoments } from '@/lib/demoStore';
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
  deleteMemberMoments: (memberId: string) => void;
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
  deleteMemberMoments: () => {},
  addReaction: async () => {},
  refreshMoments: async () => {},
});

const LOCAL_MOMENTS_KEY = 'locket_local_moments_v1';

function readLocalMoments(): Moment[] {
  if (typeof window === 'undefined') return [];
  try {
    const deletedMembers = new Set(getDeletedMemberIds());
    const stored = localStorage.getItem(LOCAL_MOMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return sanitizeMoments(
          parsed.filter(
            (m) =>
              m &&
              m.id &&
              !deletedMembers.has(m.sender_id) &&
              !deletedMembers.has(m.sender?.id)
          )
        );
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

function removeLocalMomentsByMember(memberId: string): string[] {
  if (typeof window === 'undefined' || !memberId) return [];
  const removedIds: string[] = [];
  try {
    const existing = readLocalMoments();
    const toRemove = existing.filter(
      (m) => m.sender_id === memberId || m.sender?.id === memberId
    );
    toRemove.forEach((m) => {
      addDeletedMomentId(m.id);
      removedIds.push(m.id);
    });
    const updated = existing.filter(
      (m) => m.sender_id !== memberId && m.sender?.id !== memberId
    );
    localStorage.setItem(LOCAL_MOMENTS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return removedIds;
}

export const MomentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, signOut } = useAuth();
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

  // Keep deleted IDs persistent across mounts (clearDeletedMomentIds disabled)

  // Pure Shared Room Fetch: All accounts fetch from the EXACT same DB source
  const loadMoments = useCallback(async () => {
    try {
      const deletedMembers = new Set(getDeletedMemberIds());

      // Auto-logout deleted user: If current logged-in user was deleted by Admin, sign them out immediately!
      if (userProfile?.id && deletedMembers.has(userProfile.id)) {
        console.log('[MomentsProvider] Current user was deleted by Admin. Executing auto-logout...');
        signOut();
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(LOCAL_MOMENTS_KEY);
          } catch (e) {}
          window.location.href = '/login';
        }
        return;
      }

      fetchGlobalCloudProfiles().then((profs) => {
        if (profs && Array.isArray(profs)) {
          setAllProfiles(profs.filter((p) => p && p.id && !deletedMembers.has(p.id)));
        }
      }).catch(() => {});

      const cloudMoments = await fetchGlobalCloudMoments();
      const sanitized = sanitizeMoments(cloudMoments);
      const cloudIds = new Set(sanitized.map((m) => m.id));

      // Auto-purge stale local deleted IDs if the server considers the moment active!
      try {
        const deletedIds = getDeletedMomentIds();
        if (deletedIds.length > 0) {
          const staleIds = deletedIds.filter((id) => cloudIds.has(id));
          if (staleIds.length > 0) {
            const activeDeleted = deletedIds.filter((id) => !cloudIds.has(id));
            if (typeof window !== 'undefined') {
              localStorage.setItem('locket_deleted_moments_v1', JSON.stringify(activeDeleted));
            }
          }
        }
      } catch (e) {}

      // Auto-save Cloud public URLs to localStorage so uploader's cache is updated with working HTTPS URLs
      sanitized.forEach((cloudM) => {
        if (cloudM.media_url?.startsWith('http://') || cloudM.media_url?.startsWith('https://')) {
          saveLocalMoment(cloudM);
        }
      });
      const deletedMomentsSet = new Set(getDeletedMomentIds());
      const localMoments = readLocalMoments();

      // AUTO-SYNC: Push any local moments not yet on the server up to global cloud so ALL accounts receive them
      localMoments.forEach((lm) => {
        if (deletedMomentsSet.has(lm.id) || String(lm.id).startsWith('del_moment_')) {
          removeLocalMoment(lm.id);
          return;
        }
        if (!cloudIds.has(lm.id) && lm.media_url && !lm.media_url.startsWith('blob:')) {
          pushMomentToGlobalCloud(lm)
            .then((success) => {
              if (!success) {
                removeLocalMoment(lm.id);
              }
            })
            .catch(() => {});
        }
      });

      setMoments((prevMoments) => {
        const freshDeletedSet = new Set(getDeletedMomentIds());
        const deletedMembers = new Set(getDeletedMemberIds());
        const now = Date.now();
        const pendingOptimistic = prevMoments.filter((m) => {
          if (freshDeletedSet.has(m.id) || String(m.id).startsWith('del_moment_')) return false;
          const createdAtTime = new Date(m.created_at || 0).getTime();
          const isRecent = now - createdAtTime < 180000;
          const existsInCloud = cloudIds.has(m.id);
          return !existsInCloud && isRecent;
        });

        const validLocalMoments = localMoments.filter(
          (m) =>
            m &&
            m.id &&
            !freshDeletedSet.has(m.id) &&
            !String(m.id).startsWith('del_moment_') &&
            !(m.sender_id && deletedMembers.has(m.sender_id)) &&
            !(m.sender?.id && deletedMembers.has(m.sender.id))
        );

        // Authoritative cloud moments must NOT be filtered out by stale local deleted IDs
        const merged = [...sanitized, ...validLocalMoments, ...pendingOptimistic]
          .filter(
            (m) =>
              m &&
              m.id &&
              !String(m.id).startsWith('del_moment_') &&
              m.caption !== '__DELETED_MOMENT__' &&
              !(m.sender_id && deletedMembers.has(m.sender_id)) &&
              !(m.sender?.id && deletedMembers.has(m.sender.id))
          );

        const sorted = sortMoments(merged) as Moment[];
        return sorted.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
      });
    } catch (e) {
      console.error('Error fetching room moments:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, signOut, userProfile?.id]);

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

  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalCloudProfiles().then((profs) => {
      if (profs && Array.isArray(profs) && profs.length > 0) {
        setAllProfiles(profs.filter((p) => p && p.id));
      }
    });
  }, []);

  const membersFilterOptions: MemberFilterOption[] = useMemo(() => {
    const deletedMembers = new Set(getDeletedMemberIds());
    const list: MemberFilterOption[] = [
      { id: 'all', name: 'Tất cả bạn bè', count: moments.length },
    ];
    
    // Key senders strictly by unique account ID
    const sendersMap = new Map<string, { id: string; name: string; avatar_url?: string; count: number }>();
    
    // First, populate registered profiles in the room
    allProfiles.forEach((p) => {
      if (p?.id && !deletedMembers.has(p.id)) {
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
      if (!sid || deletedMembers.has(sid)) return;

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

    const filtered = moments.filter(
      (m) =>
        m.sender_id === selectedFriendFilter ||
        m.sender?.id === selectedFriendFilter ||
        m.sender?.username === selectedFriendFilter
    );

    // SAFEGUARD: If a friend filter yields 0 moments, fallback to all room moments so no user/admin gets stuck on empty screen
    if (filtered.length === 0) return moments;
    return filtered;
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
        deleteMemberMoments: (memberId: string) => {
          addDeletedMemberId(memberId);
          removeLocalMomentsByMember(memberId);
          setAllProfiles((prev) => prev.filter((p) => p.id !== memberId));
          setMoments((prev) =>
            prev.filter(
              (m) => m.sender_id !== memberId && m.sender?.id !== memberId
            )
          );
          if (selectedFriendFilter === memberId) {
            setSelectedFriendFilter('all');
          }
        },
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
