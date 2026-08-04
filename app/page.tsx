"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { LocketChatView } from '@/components/LocketChatView';
import { FriendProfileModal } from '@/components/FriendProfileModal';
import { CameraView } from '@/components/CameraView';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import {
  DEMO_CURRENT_USER,
  DEFAULT_3_FRIENDS,
  DEMO_SUGGESTED_USERS,
  getStoredDemoMoments,
  saveStoredDemoMoments,
  addDemoMoment,
  addDemoReaction,
} from '@/lib/demoStore';
import { Moment, Profile, MusicTrack } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { Camera, X, UserPlus } from 'lucide-react';
import { CapturedMedia } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pushMomentToGlobalCloud, fetchGlobalCloudMoments, pushProfileToGlobalCloud, fetchGlobalCloudProfiles, compressImageForCloudSync } from '@/lib/cloudSync';

export default function HomePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'grid' | 'chat'>('feed');
  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string | null>(null);
  const [selectedFriendForModal, setSelectedFriendForModal] = useState<Profile | null>(null);
  const [selectedChatFriend, setSelectedChatFriend] = useState<Profile | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);
  const broadcastChannelRef = useRef<any>(null);

  const currentUser = userProfile || DEMO_CURRENT_USER;

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Smart Data Diffing Helpers to prevent unnecessary React re-renders & flickering
  const areProfilesEqual = (a: Profile[], b: Profile[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id || a[i].display_name !== b[i].display_name || a[i].avatar_url !== b[i].avatar_url) {
        return false;
      }
    }
    return true;
  };

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
    setMoments((prev) => {
      const updated = prev.filter((m) => m.id !== momentId);
      saveStoredDemoMoments(updated);
      return updated;
    });
  };

  // Fetch real friends from Global Cloud + Supabase + push current user profile
  const loadFriends = async () => {
    try {
      await pushProfileToGlobalCloud({
        id: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url || '',
      });
    } catch (e) {}

    let cloudProfiles: Profile[] = [];
    try {
      const rawCloud = await fetchGlobalCloudProfiles();
      cloudProfiles = rawCloud.map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }));
    } catch (e) {}

    let supabaseProfiles: Profile[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data && data.length > 0) {
          supabaseProfiles = data as Profile[];
        }
      } catch (e) {}
    }

    const allProfiles = [...cloudProfiles, ...supabaseProfiles, ...DEFAULT_3_FRIENDS];

    const others = allProfiles.filter(
      (p) =>
        p.id !== currentUser.id &&
        p.username !== currentUser.username
    );

    const unique = others.filter(
      (user, index, self) => index === self.findIndex((u) => u.username === user.username)
    );

    const targetList = unique.length > 0 ? unique : DEFAULT_3_FRIENDS;
    setFriendsList((prev) => (areProfilesEqual(prev, targetList) ? prev : targetList));
  };

  // Fetch moments & guarantee 50 moments dataset + global multi-account moments are loaded
  const loadMoments = async () => {
    const demoMoments = getStoredDemoMoments();
    const cloudMoments = await fetchGlobalCloudMoments();

    let validSupabaseMoments: Moment[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('*, sender:profiles(*), reactions(*, user:profiles(*))')
          .order('created_at', { ascending: false });

        if (!error && data) {
          validSupabaseMoments = (data as Moment[]).filter(
            (m) => !m.media_url?.includes('1785829393992_')
          );
        }
      } catch (e) {}
    }

    const combined = [...cloudMoments, ...validSupabaseMoments, ...demoMoments];

    const sanitized = combined.map((m) => {
      if (!m.sender) {
        if (m.sender_id === currentUser.id || m.sender_id === 'user-me') {
          return { ...m, sender: currentUser };
        }
        const match = DEFAULT_3_FRIENDS.find((f) => f.id === m.sender_id);
        if (match) return { ...m, sender: match };
        return { ...m, sender: currentUser };
      }
      return m;
    });

    const unique = sanitized.filter(
      (m, i, self) => i === self.findIndex((x) => x.id === m.id)
    );

    unique.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const targetMoments = unique.length > 0 ? unique : demoMoments;
    setMoments((prev) => (areMomentsEqual(prev, targetMoments) ? prev : targetMoments));
    setLoading(false);
  };

  useEffect(() => {
    loadFriends();
    loadMoments();

    const syncTimer = setInterval(() => {
      if (document.hidden) return;
      loadFriends();
      loadMoments();
    }, 12000);

    if (isSupabaseConfigured()) {
      const dbChannel = supabase
        .channel('public:moments-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'moments' },
          () => {
            loadFriends();
            loadMoments();
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
              updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              addDemoMoment(payload);
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
        clearInterval(syncTimer);
        supabase.removeChannel(dbChannel);
        supabase.removeChannel(broadcastChannel);
      };
    }

    return () => {
      clearInterval(syncTimer);
    };
  }, [currentUser.id]);

  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Filter moments by selected friend dropdown
  const isFilteringCurrentUser =
    selectedFriendFilter === currentUser.id ||
    selectedFriendFilter === currentUser.username;

  const filteredMoments = selectedFriendFilter
    ? moments.filter((m) => {
        const sender = m.sender;
        if (isFilteringCurrentUser) {
          return (
            m.sender_id === currentUser.id ||
            sender?.id === currentUser.id ||
            sender?.username === currentUser.username
          );
        }
        return (
          m.sender_id === selectedFriendFilter ||
          sender?.username === selectedFriendFilter ||
          sender?.id === selectedFriendFilter
        );
      })
    : moments;

  // Derive Current Moment & Index 100% Purely from selectedMomentId!
  const currentMoment = selectedMomentId
    ? filteredMoments.find((m) => m.id === selectedMomentId) || filteredMoments[0]
    : filteredMoments[0];

  const currentIndex = currentMoment
    ? filteredMoments.findIndex((m) => m.id === currentMoment.id)
    : 0;

  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextMoment = filteredMoments[safeIndex + 1];
  const prevMoment = filteredMoments[safeIndex - 1];

  const handleNext = () => {
    if (safeIndex < filteredMoments.length - 1) {
      const nextM = filteredMoments[safeIndex + 1];
      if (nextM) setSelectedMomentId(nextM.id);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      const prevM = filteredMoments[safeIndex - 1];
      if (prevM) setSelectedMomentId(prevM.id);
    }
  };

  const handleSendDirectMessage = (text: string) => {
    if (currentMoment) {
      handleReact(currentMoment.id, '💬');
      const sender = currentMoment.sender;
      if (sender && sender.id !== currentUser.id) {
        try {
          const stored = localStorage.getItem('locket_chat_messages_v1');
          const msgs = stored ? JSON.parse(stored) : {};
          const senderId = sender.id;
          const newMsg = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: text,
            timestamp: 'Vừa xong',
          };
          msgs[senderId] = [...(msgs[senderId] || []), newMsg];
          localStorage.setItem('locket_chat_messages_v1', JSON.stringify(msgs));
        } catch (e) {}
      }
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
    const updated = addDemoReaction(momentId, emoji, currentUser);
    setMoments(updated);
  };

  const handleSendMoment = async (
    media: CapturedMedia,
    caption: string,
    recipientIds: string[],
    music?: MusicTrack,
    audioOption?: 'mute' | 'original' | 'music'
  ) => {
    const newMomentId = `m-${media.type}-v5-${Date.now()}`;
    const activeSender = userProfile || currentUser;

    const initialMoment: Moment = {
      id: newMomentId,
      sender_id: activeSender.id,
      sender: activeSender,
      media_url: media.dataUrl,
      media_type: media.type,
      audio_option: audioOption || (media.type === 'video' ? 'original' : undefined),
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
      music: music,
    };

    // ⚡ Optimistic UI: Close camera & update feed INSTANTLY (0ms latency!)
    const updatedMoments = addDemoMoment(initialMoment);
    setSelectedFriendFilter(null);
    setMoments(updatedMoments);
    setSelectedMomentId(newMomentId);
    setShowCamera(false);
    setCurrentView('feed');

    // 🚀 Background Sync: Compress media & sync via DB + WebSockets without blocking UI
    (async () => {
      let mediaUrl = media.dataUrl;
      // Only compress photos, not videos
      if (media.type === 'photo') {
        try {
          mediaUrl = await compressImageForCloudSync(media.dataUrl);
        } catch (e) {}
      }

      const createdMoment: Moment = {
        ...initialMoment,
        media_url: mediaUrl,
      };

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
        await pushMomentToGlobalCloud(createdMoment);
      } catch (e) {}

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'new_moment',
            payload: createdMoment,
          });
        } catch (e) {}
      } else if (isSupabaseConfigured()) {
        try {
          const ch = supabase.channel('locket-live-broadcast');
          ch.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              ch.send({
                type: 'broadcast',
                event: 'new_moment',
                payload: createdMoment,
              });
            }
          });
        } catch (e) {}
      }
    })();
  };

  return (
    <div className="h-full flex flex-col justify-between bg-black selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Header */}
      {currentView !== 'chat' && (
        <LocketHeader
          currentUser={currentUser}
          friends={friendsList}
          selectedFriendFilter={selectedFriendFilter}
          onSelectFilter={(friendId) => {
            setSelectedFriendFilter(friendId);
            setSelectedMomentId(null);
          }}
          onOpenChat={() => {
            setSelectedChatFriend(null);
            setCurrentView('chat');
          }}
          onOpenProfile={() => router.push('/profile')}
          onViewFriendProfile={(friend) => setSelectedFriendForModal(friend)}
        />
      )}

      {/* Main Views Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full">
        <AnimatePresence mode="wait">
          {currentView === 'chat' ? (
            <motion.div
              key="view-chat"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full absolute inset-0"
            >
              <LocketChatView
                friends={friendsList}
                currentUser={currentUser}
                onBack={() => setCurrentView('feed')}
                initialFriend={selectedChatFriend}
              />
            </motion.div>
          ) : currentView === 'grid' ? (
            <motion.div
              key="view-grid"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full absolute inset-0 bg-black z-30 transform-gpu will-change-transform"
            >
              <LocketHistoryGrid
                moments={filteredMoments}
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
              ) : filteredMoments.length > 0 && currentMoment ? (
                <LocketFeedCard
                  moment={currentMoment}
                  currentUser={currentUser}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  hasPrev={safeIndex > 0}
                  hasNext={safeIndex < filteredMoments.length - 1}
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
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để gửi khoảnh khắc đầu tiên!
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
      {currentView !== 'chat' && (
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
      )}

      {/* Friend Profile Modal */}
      {selectedFriendForModal && (
        <FriendProfileModal
          friend={selectedFriendForModal}
          friendMoments={moments.filter(
            (m) =>
              m.sender_id === selectedFriendForModal.id ||
              m.sender?.username === selectedFriendForModal.username
          )}
          onClose={() => setSelectedFriendForModal(null)}
          onOpenChatWithFriend={(friend) => {
            setSelectedChatFriend(friend);
            setCurrentView('chat');
          }}
          onSelectMoment={(moment) => {
            setSelectedMomentId(moment.id);
            setCurrentView('feed');
          }}
        />
      )}

      {/* Menu Modal */}
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

              <h3 className="text-white text-base font-bold mb-4">Tùy chọn & Bạn bè</h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    router.push('/friends');
                  }}
                  className="w-full p-3 bg-[#262626] hover:bg-[#333333] rounded-2xl text-white text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <UserPlus className="w-4 h-4 text-[#FFC700]" />
                    <span>Quản lý & Gợi ý kết bạn</span>
                  </div>
                  <span className="text-zinc-500">&gt;</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    router.push('/profile');
                  }}
                  className="w-full p-3 bg-[#262626] hover:bg-[#333333] rounded-2xl text-white text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-[#FFC700]" />
                    <span>Trang cá nhân của tôi</span>
                  </div>
                  <span className="text-zinc-500">&gt;</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera View */}
      {showCamera && (
        <CameraView
          friends={friendsList}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
