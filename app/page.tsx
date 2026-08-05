"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LocketHeader, MemberFilterOption } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { CameraView } from '@/components/CameraView';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import {
  DEMO_CURRENT_USER,
  DEMO_50_MOMENTS,
  getStoredDemoMoments,
  saveStoredDemoMoments,
  addDemoMoment,
  addDemoReaction,
} from '@/lib/demoStore';
import { Moment, Profile, MusicTrack } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { Camera, X, User, LogOut } from 'lucide-react';
import { CapturedMedia, captureVideoThumbnail } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pushMomentToGlobalCloud, fetchGlobalCloudMoments, pushProfileToGlobalCloud, deleteMomentFromGlobalCloud, compressImageForCloudSync, uploadMediaToPublicUrl } from '@/lib/cloudSync';
import { sanitizeMoments } from '@/lib/media';

export default function HomePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'grid'>('feed');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);
  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string>('all');
  const broadcastChannelRef = useRef<any>(null);

  const currentUser = userProfile || DEMO_CURRENT_USER;

  // Enforce Google Login: Redirect unauthenticated sessions immediately to /login
  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [authLoading, userProfile, router]);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const areMomentsEqual = (a: Moment[], b: Moment[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].id !== b[i].id ||
        a[i].media_url !== b[i].media_url ||
        (a[i].reactions?.length || 0) !== (b[i].reactions?.length || 0)
      ) {
        return false;
      }
    }
    return true;
  };

  // Delete moment handler
  const handleDeleteMoment = (momentId: string) => {
    deleteMomentFromGlobalCloud(momentId).catch(() => {});
    setMoments((prev) => {
      const updated = prev.filter((m) => m.id !== momentId);
      saveStoredDemoMoments(updated, currentUser.id);
      return updated;
    });
  };

  // Sync profile to Global Cloud
  useEffect(() => {
    if (userProfile) {
      pushProfileToGlobalCloud({
        id: userProfile.id,
        username: userProfile.username,
        display_name: userProfile.display_name,
        avatar_url: userProfile.avatar_url || '',
      }).catch(() => {});
    }
  }, [userProfile]);

  // Fetch moments with full bidirectional cloud sync so ALL accounts see the SAME feed
  const loadMoments = async () => {
    let cloudMoments: Moment[] = [];
    try {
      cloudMoments = await fetchGlobalCloudMoments();
    } catch (e) {}

    const cachedMoments = getStoredDemoMoments(currentUser.id);
    const combined = sanitizeMoments([...cloudMoments, ...cachedMoments, ...DEMO_50_MOMENTS]);

    const sanitized = combined.map((m) => {
      let item = m;
      if (item.id.startsWith('m-photo-v5-') || item.caption?.includes('mèo cưng')) {
        item = { ...item, music: undefined };
      }
      if (!item.sender) {
        if (item.sender_id === currentUser.id || item.sender_id === 'user-me') {
          return { ...item, sender: currentUser };
        }
        return {
          ...item,
          sender: {
            id: item.sender_id || 'user-locket',
            username: item.sender_id || 'locket_user',
            display_name: 'Thành viên Locket',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sender_id || 'locket'}`,
          },
        };
      }
      return item;
    });

    const unique = sanitized.filter(
      (m, i, self) => i === self.findIndex((x) => x.id === m.id)
    );

    // Newest moments at the top of the stack (seq_id descending, then created_at)
    unique.sort((a: any, b: any) => {
      const seqA = Number(a.seq_id || 0);
      const seqB = Number(b.seq_id || 0);
      if (seqA && seqB && seqA !== seqB) return seqB - seqA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    saveStoredDemoMoments(unique, currentUser.id);

    const targetMoments = unique.length > 0 ? unique : DEMO_50_MOMENTS;
    setMoments((prev) => (areMomentsEqual(prev, targetMoments) ? prev : targetMoments));
    setLoading(false);
  };

  useEffect(() => {
    loadMoments();

    // Auto-polling interval: Sync cloud moments every 3.5s so all Google accounts stay 100% updated
    const pollInterval = setInterval(() => {
      loadMoments();
    }, 3500);

    // Native BroadcastChannel for instant cross-tab real-time sync
    let tabChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      tabChannel = new BroadcastChannel('locket_tab_sync');
      tabChannel.onmessage = (event) => {
        if (event.data?.type === 'NEW_MOMENT' && event.data?.moment) {
          setMoments((prev) => {
            const exists = prev.some((m) => m.id === event.data.moment.id);
            if (exists) return prev;
            return [event.data.moment, ...prev];
          });
        }
      };
    }

    if (isSupabaseConfigured()) {
      const dbChannel = supabase
        .channel('public:moments-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'moments' },
          (payload) => {
            if (payload?.new) {
              const newMoment = payload.new as Moment;
              setMoments((prev) => {
                const exists = prev.some((m) => m.id === newMoment.id);
                if (exists) return prev;
                return [newMoment, ...prev];
              });
            }
          }
        )
        .subscribe();

      const broadcastChannel = supabase.channel('locket-live-broadcast');
      broadcastChannel
        .on('broadcast', { event: 'new_moment' }, ({ payload }) => {
          if (payload && payload.id) {
            setMoments((prev) => {
              const exists = prev.some((m) => m.id === payload.id);
              if (exists) return prev;
              const updated = [payload, ...prev];
              addDemoMoment(payload, currentUser.id);
              return updated;
            });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            broadcastChannelRef.current = broadcastChannel;
          }
        });

      return () => {
        clearInterval(pollInterval);
        if (tabChannel) tabChannel.close();
        supabase.removeChannel(dbChannel);
        supabase.removeChannel(broadcastChannel);
      };
    }

    return () => {
      clearInterval(pollInterval);
      if (tabChannel) tabChannel.close();
    };
  }, [currentUser.id]);

  if (authLoading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-black text-white space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-zinc-400">Đang kiểm tra tài khoản Google...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-black text-white space-y-4 p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center mb-2 border border-[#FFC700]/40">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-white">Yêu cầu Đăng nhập Google</p>
        <p className="text-xs text-zinc-400 max-w-xs">Chuyển hướng đến màn hình đăng nhập...</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-4 py-2 bg-[#FFC700] text-black font-bold text-xs rounded-xl shadow-locket-glow"
        >
          Đăng nhập bằng Google 🚀
        </button>
      </div>
    );
  }

  // Members Filter Options for "Tất cả bạn bè" Selector Modal Sheet
  const membersFilterOptions: MemberFilterOption[] = React.useMemo(() => {
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

  // Filter moments according to selected friend option
  const filteredMoments = React.useMemo(() => {
    if (selectedFriendFilter === 'all') return moments;
    return moments.filter(
      (m) =>
        m.sender_id === selectedFriendFilter ||
        m.sender?.id === selectedFriendFilter ||
        m.sender?.username === selectedFriendFilter
    );
  }, [moments, selectedFriendFilter]);

  // Pure Shared Room Stack filtered by selection
  const roomMoments = filteredMoments.length > 0 ? filteredMoments : moments;

  const currentMoment = selectedMomentId
    ? roomMoments.find((m) => m.id === selectedMomentId) || roomMoments[0]
    : roomMoments[0];

  const currentIndex = currentMoment
    ? roomMoments.findIndex((m) => m.id === currentMoment.id)
    : 0;

  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextMoment = roomMoments[safeIndex + 1];
  const prevMoment = roomMoments[safeIndex - 1];

  const handleNext = () => {
    if (safeIndex < roomMoments.length - 1) {
      const nextM = roomMoments[safeIndex + 1];
      if (nextM) setSelectedMomentId(nextM.id);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      const prevM = roomMoments[safeIndex - 1];
      if (prevM) setSelectedMomentId(prevM.id);
    }
  };

  const handleSendDirectMessage = (text: string) => {
    if (currentMoment) {
      handleReact(currentMoment.id, '💬');
    }
  };

  const handleReact = async (momentId: string, emoji: string) => {
    setLastReaction({ emoji, timestamp: Date.now() });
    if (isSupabaseConfigured() && userProfile) {
      try {
        await supabase.from('reactions').insert({
          moment_id: momentId,
          user_id: userProfile.id,
          emoji: emoji,
        });
      } catch (e) {}
    }
    const updated = addDemoReaction(momentId, emoji, currentUser, currentUser.id);
    setMoments(updated);
  };

  const handleSendMoment = async (
    media: CapturedMedia,
    caption: string,
    recipientIds: string[],
    music?: MusicTrack,
    audioOption?: 'mute' | 'original' | 'music'
  ) => {
    const newMomentId = `m-${media.type}-v9-${Date.now()}`;
    const activeSender = userProfile || currentUser;

    let mediaUrl = media.dataUrl;
    let thumbnailUrl: string | undefined = undefined;

    if (media.type === 'photo' && media.dataUrl.startsWith('data:image/')) {
      try {
        mediaUrl = await compressImageForCloudSync(media.dataUrl);
        if (mediaUrl.length > 450000) {
          const uploadedPhotoUrl = await uploadMediaToPublicUrl(mediaUrl, `locket_${newMomentId}`);
          if (uploadedPhotoUrl) mediaUrl = uploadedPhotoUrl;
        }
      } catch (e) {}
    } else if (media.type === 'video') {
      try {
        thumbnailUrl = await captureVideoThumbnail(media.dataUrl);
        const uploadedVideoUrl = await uploadMediaToPublicUrl(media.dataUrl, `locket_${newMomentId}`);
        if (uploadedVideoUrl) {
          mediaUrl = uploadedVideoUrl;
        }
        if (thumbnailUrl?.startsWith('data:image/') && thumbnailUrl.length > 250000) {
          const uploadedThumbUrl = await uploadMediaToPublicUrl(thumbnailUrl, `locket_${newMomentId}_thumb`);
          if (uploadedThumbUrl) thumbnailUrl = uploadedThumbUrl;
        }
      } catch (e) {}
    }

    const newMoment: Moment = {
      id: newMomentId,
      sender_id: activeSender.id,
      sender: activeSender,
      media_url: mediaUrl,
      media_type: media.type,
      audio_option: audioOption || (media.type === 'video' ? 'original' : undefined),
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
      music: music,
      thumbnail_url: thumbnailUrl,
    };

    // 1. Optimistic Local Save - Put new photo on TOP of the room stack
    const updatedMoments = addDemoMoment(newMoment, currentUser.id);
    setMoments(updatedMoments);
    setSelectedMomentId(newMomentId);
    setShowCamera(false);
    setCurrentView('feed');

    // 2. Broadcast to all open tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const tabChannel = new BroadcastChannel('locket_tab_sync');
        tabChannel.postMessage({ type: 'NEW_MOMENT', moment: newMoment });
        tabChannel.close();
      }
    } catch (e) {}

    // 3. Background Cloud / DB Sync
    (async () => {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('profiles').upsert({
            id: activeSender.id,
            username: activeSender.username,
            display_name: activeSender.display_name,
            avatar_url: activeSender.avatar_url,
          });

          await supabase.from('moments').insert({
            sender_id: activeSender.id,
            media_url: mediaUrl,
            caption: caption,
          });
        } catch (e) {}
      }

      try {
        await pushMomentToGlobalCloud(newMoment);
      } catch (e) {}

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'new_moment',
            payload: newMoment,
          });
        } catch (e) {}
      }
    })();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('locket_google_user_v1');
      localStorage.removeItem('locket_device_profile');
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    router.push('/login');
  };

  return (
    <div className="h-full flex flex-col justify-between bg-black selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Shared Room Header */}
      <LocketHeader
        currentUser={currentUser}
        onOpenProfile={() => router.push('/profile')}
        selectedFilterId={selectedFriendFilter}
        onSelectFilter={setSelectedFriendFilter}
        members={membersFilterOptions}
      />

      {/* Main Views Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full">
        <AnimatePresence mode="wait">
          {currentView === 'grid' ? (
            <motion.div
              key="view-grid"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full absolute inset-0 bg-black z-30 transform-gpu will-change-transform"
            >
              <LocketHistoryGrid
                moments={roomMoments}
                onSelectMoment={(moment) => {
                  setSelectedMomentId(moment.id);
                  setCurrentView('feed');
                }}
                onOpenCamera={() => setShowCamera(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-feed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-center items-center overflow-hidden p-1"
            >
              <div className="w-full px-2 pt-1">
                <SupabaseConfigNotice />
                <PWAInstallBanner />
              </div>

              {loading ? (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
                </div>
              ) : roomMoments.length > 0 && currentMoment ? (
                <LocketFeedCard
                  moment={currentMoment}
                  currentUser={currentUser}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  hasPrev={safeIndex > 0}
                  hasNext={safeIndex < roomMoments.length - 1}
                  onDeleteMoment={handleDeleteMoment}
                  nextMomentUrl={nextMoment?.media_url}
                  prevMomentUrl={prevMoment?.media_url}
                  activeReaction={lastReaction}
                />
              ) : (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.5rem] bg-[#18181C] border border-[#FFC700]/30 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center mb-3 border border-[#FFC700]/40">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào trong phòng</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để đặt ảnh đầu tiên vào tệp ảnh chung!
                  </p>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="py-2.5 px-5 bg-[#FFC700] text-[#000000] font-bold text-xs rounded-xl shadow-locket-glow active:scale-95 transition-transform"
                  >
                    Chụp ảnh ngay 📸
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Dock */}
      <LocketDock
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
        onOpenCamera={() => setShowCamera(true)}
        onOpenMenu={() => setShowMenuModal(true)}
        onSendDirectMessage={handleSendDirectMessage}
        onReactEmoji={(emoji) => {
          if (currentMoment) handleReact(currentMoment.id, emoji);
        }}
        isMyMoment={
          currentMoment
            ? (currentMoment.sender_id === currentUser.id) ||
              (currentMoment.sender?.id === currentUser.id) ||
              (currentMoment.sender?.username === currentUser.username)
            : false
        }
      />

      {/* Options Menu Modal */}
      <AnimatePresence>
        {showMenuModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowMenuModal(false)}
          >
            <motion.div
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMenuModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-white text-base font-bold mb-4">Tùy chọn Căn phòng</h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    router.push('/profile');
                  }}
                  className="w-full p-3 bg-[#262626] hover:bg-[#333333] rounded-2xl text-white text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <User className="w-4 h-4 text-[#FFC700]" />
                    <span>Trang cá nhân của bạn</span>
                  </div>
                  <span className="text-zinc-500">&gt;</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    handleLogout();
                  }}
                  className="w-full p-3 bg-[#262626] hover:bg-red-950/40 rounded-2xl text-red-400 text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Đăng xuất Google</span>
                  </div>
                  <span className="text-zinc-500">&gt;</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera View Modal */}
      {showCamera && (
        <CameraView
          friends={[]}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}

