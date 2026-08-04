"use client";

import React, { useState, useEffect } from 'react';
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
  addDemoMoment,
  addDemoReaction,
} from '@/lib/demoStore';
import { Moment, Profile } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { Camera, X, UserPlus } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pushMomentToGlobalCloud, fetchGlobalCloudMoments, pushProfileToGlobalCloud, fetchGlobalCloudProfiles, compressImageForCloudSync } from '@/lib/cloudSync';

export default function HomePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'feed' | 'grid' | 'chat'>('feed');
  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string | null>(null);
  const [selectedFriendForModal, setSelectedFriendForModal] = useState<Profile | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);
  const broadcastChannelRef = React.useRef<any>(null);

  const currentUser = userProfile || DEMO_CURRENT_USER;

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Fetch real friends from Global Cloud + Supabase + push current user profile
  const loadFriends = async () => {
    // 1. Push current user to Global Cloud so other accounts see them
    try {
      await pushProfileToGlobalCloud({
        id: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url || '',
      });
    } catch (e) {}

    // 2. Fetch all profiles from Global Cloud
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

    // 3. Fetch from Supabase (may return 0 due to RLS)
    let supabaseProfiles: Profile[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data && data.length > 0) {
          supabaseProfiles = data as Profile[];
        }
      } catch (e) {}
    }

    // 4. Merge all sources: Cloud + Supabase + Default 3 friends
    const allProfiles = [...cloudProfiles, ...supabaseProfiles, ...DEFAULT_3_FRIENDS];

    // Filter out current user strictly by ID and Username (never by display_name)
    const others = allProfiles.filter(
      (p) =>
        p.id !== currentUser.id &&
        p.username !== currentUser.username
    );

    // Deduplicate by username
    const unique = others.filter(
      (user, index, self) => index === self.findIndex((u) => u.username === user.username)
    );

    setFriendsList(unique.length > 0 ? unique : DEFAULT_3_FRIENDS);
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

    // Ensure every moment has a valid sender object
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

    // Deduplicate by moment id
    const unique = sanitized.filter(
      (m, i, self) => i === self.findIndex((x) => x.id === m.id)
    );

    // Sort strictly by newest date first
    unique.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setMoments(unique.length > 0 ? unique : demoMoments);
    setLoading(false);
  };

  useEffect(() => {
    loadFriends();
    loadMoments();

    // 4s polling timer so Account B automatically gets Account A's photos & profile without reloading
    const syncTimer = setInterval(() => {
      loadFriends();
      loadMoments();
    }, 4000);

    if (isSupabaseConfigured()) {
      // 1. Supabase Postgres DB Changes Channel
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

      // 2. Instant Realtime Broadcast Channel between accounts
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
    selectedFriendFilter === currentUser.username ||
    selectedFriendFilter === currentUser.display_name ||
    selectedFriendFilter === 'user-me' ||
    selectedFriendFilter === 'user-dm';

  const filteredMoments = selectedFriendFilter
    ? moments.filter((m) => {
        const sender = m.sender;
        if (isFilteringCurrentUser) {
          return (
            m.sender_id === currentUser.id ||
            m.sender_id === 'user-me' ||
            m.sender_id === 'user-dm' ||
            sender?.id === currentUser.id ||
            sender?.id === 'user-me' ||
            sender?.id === 'user-dm' ||
            sender?.username === currentUser.username ||
            sender?.username === 'dm' ||
            sender?.display_name === currentUser.display_name
          );
        }
        return (
          m.sender_id === selectedFriendFilter ||
          sender?.username === selectedFriendFilter ||
          sender?.id === selectedFriendFilter ||
          sender?.display_name === selectedFriendFilter
        );
      })
    : moments;

  const currentMoment = filteredMoments[currentIndex] || filteredMoments[0];
  const nextMoment = filteredMoments[currentIndex + 1];
  const prevMoment = filteredMoments[currentIndex - 1];

  const handleNext = () => {
    if (currentIndex < filteredMoments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
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
    const updated = addDemoReaction(momentId, emoji, currentUser);
    setMoments(updated);
  };

  const handleSendMoment = async (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => {
    const newMomentId = `m-photo-v5-${Date.now()}`;
    let mediaUrl = image.dataUrl;
    const activeSender = userProfile || currentUser;

    // Compress photo to ~12KB JPEG quality 0.50 so DB insert & WebSocket payload stay super light
    try {
      mediaUrl = await compressImageForCloudSync(image.dataUrl);
    } catch (e) {}

    if (isSupabaseConfigured()) {
      try {
        // Upsert sender profile first
        await supabase.from('profiles').upsert({
          id: activeSender.id,
          username: activeSender.username,
          display_name: activeSender.display_name,
          avatar_url: activeSender.avatar_url,
        });

        // Insert moment into Supabase database (now unlocked by SQL query!)
        await supabase.from('moments').insert({
          sender_id: activeSender.id,
          media_url: mediaUrl,
          caption: caption,
        });
      } catch (e) {
        console.error('Supabase DB insert error:', e);
      }
    }

    const createdMoment: Moment = {
      id: newMomentId,
      sender_id: activeSender.id,
      sender: activeSender,
      media_url: mediaUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };

    // 3. Push to Global Cloud Sync (CRITICAL - this is what enables Account A -> B sharing)
    try {
      await pushMomentToGlobalCloud(createdMoment);
    } catch (e) {}

    // 4. Instant Realtime WebSocket Broadcast to all other logged-in accounts (< 50ms)
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

    const updatedMoments = addDemoMoment(createdMoment);
    setSelectedFriendFilter(null);
    setMoments(updatedMoments);
    setCurrentIndex(0);
    setShowCamera(false);
    setCurrentView('feed');
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
            setCurrentIndex(0);
          }}
          onOpenChat={() => setCurrentView('chat')}
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
              />
            </motion.div>
          ) : currentView === 'grid' ? (
            <motion.div
              key="view-grid"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full absolute inset-0 bg-black z-30"
            >
              <LocketHistoryGrid
                moments={filteredMoments}
                onSelectMoment={(moment) => {
                  const filteredIdx = filteredMoments.findIndex((m) => m.id === moment.id);
                  if (filteredIdx !== -1) {
                    setCurrentIndex(filteredIdx);
                  } else {
                    setSelectedFriendFilter(null);
                    const globalIdx = moments.findIndex((m) => m.id === moment.id);
                    if (globalIdx !== -1) setCurrentIndex(globalIdx);
                  }
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
                  hasPrev={currentIndex > 0}
                  hasNext={currentIndex < filteredMoments.length - 1}
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
              ? currentMoment.sender_id === currentUser.id ||
                currentMoment.sender_id === 'user-me' ||
                currentMoment.sender_id === 'user-dm' ||
                currentMoment.sender?.id === currentUser.id ||
                currentMoment.sender?.username === currentUser.username ||
                currentMoment.sender?.username === 'dm'
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
          onOpenChatWithFriend={(friend) => setCurrentView('chat')}
          onSelectMoment={(moment) => {
            const filteredIdx = filteredMoments.findIndex((m) => m.id === moment.id);
            if (filteredIdx !== -1) {
              setCurrentIndex(filteredIdx);
            } else {
              setSelectedFriendFilter(null);
              const globalIdx = moments.findIndex((m) => m.id === moment.id);
              if (globalIdx !== -1) setCurrentIndex(globalIdx);
            }
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
          >
            <motion.div
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-left relative"
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
