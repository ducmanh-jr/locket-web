"use client";

import React, { useState, useEffect } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { CameraView } from '@/components/CameraView';
import { LocketChatSheet } from '@/components/LocketChatSheet';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { Camera } from 'lucide-react';
import { CapturedMedia } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicTrack } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const {
    filteredMoments,
    loading: momentsLoading,
    selectedFriendFilter,
    setSelectedFriendFilter,
    membersFilterOptions,
    addMoment,
    deleteMoment,
    addReaction,
  } = useMoments();

  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'grid'>('feed');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showChatSheet, setShowChatSheet] = useState<boolean>(false);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);

  const currentUser = userProfile || {
    id: 'user-me',
    username: 'manh_locket',
    display_name: 'Đức Mạnh',
    avatar_url: '/user-photos/1785829393992_567716528849713056_g276929852367586455_e887fb48d4d113fc528e29488435b6f7.jpg',
  };

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-[#FFC2DC] text-white select-none relative overflow-hidden p-6">
        {/* Ambient Glowing Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/35 rounded-full blur-[90px] pointer-events-none z-0"
        />

        {/* Center Animated Logo & Orbit Rings */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-36 h-36 flex items-center justify-center"
          >
            {/* Spinning White Border Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full p-[3px] border-2 border-white/70 border-t-transparent shadow-[0_0_25px_rgba(255,255,255,0.7)]"
            />

            {/* Pulsing Inner Heartbeat Container */}
            <motion.div
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-28 h-28 flex items-center justify-center relative z-10"
            >
              <img
                src="/icon.svg"
                alt="Locket Logo"
                className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(255,42,133,0.3)]"
              />
            </motion.div>
          </motion.div>

          {/* Title & Animated Status Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center space-y-2"
          >
            <h2 className="text-xl font-black tracking-tight text-[#800A40]">
              Locket<span className="text-white">Web</span>
            </h2>

            <div className="flex items-center justify-center space-x-2 text-[#9E1453] text-xs font-extrabold">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#800A40] border-t-transparent animate-spin" />
              <span>Đang kết nối khoảnh khắc...</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-locket-purple text-white space-y-4 p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FF2A85]/20 text-[#FF2A85] flex items-center justify-center mb-2 border border-[#FF2A85]/40">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-white">Yêu cầu Đăng nhập Google</p>
        <p className="text-xs text-zinc-400 max-w-xs">Chuyển hướng đến màn hình đăng nhập...</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-4 py-2 bg-[#FF2A85] text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(255,42,133,0.5)]"
        >
          Đăng nhập bằng Google 🚀
        </button>
      </div>
    );
  }

  const roomMoments = filteredMoments;

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

  const handleReact = (momentId: string, emoji: string) => {
    setLastReaction({ emoji, timestamp: Date.now() });
    addReaction(momentId, emoji);
  };

  const handleSendDirectMessage = (_text: string) => {
    if (currentMoment) {
      handleReact(currentMoment.id, '💬');
    }
  };

  const handleSendMoment = async (
    media: CapturedMedia,
    caption: string,
    recipientIds: string[],
    music?: MusicTrack,
    audioOption?: 'mute' | 'original' | 'music'
  ) => {
    const newMoment = await addMoment(media, caption, recipientIds, music, audioOption);
    if (newMoment?.id) {
      setSelectedMomentId(newMoment.id);
    } else {
      setSelectedMomentId(null);
    }
    setShowCamera(false);
    setCurrentView('feed');
  };

  return (
    <div className="h-full flex flex-col justify-between bg-locket-purple selection:bg-[#FF2A85] selection:text-white overflow-hidden relative">
      {/* Shared Room Header */}
      <LocketHeader
        currentUser={currentUser}
        onOpenProfile={() => router.push('/profile')}
        onOpenChat={() => setShowChatSheet(true)}
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
              className="w-full h-full absolute inset-0 bg-locket-purple z-30 transform-gpu will-change-transform"
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
              className="w-full flex-1 flex flex-col justify-center items-center overflow-hidden relative"
            >
              <div className="w-full px-2 pt-1">
                <SupabaseConfigNotice />
              </div>

              {momentsLoading ? (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.8rem] bg-black/30 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 rounded-full border-4 border-[#FF2A85] border-t-transparent animate-spin" />
                </div>
              ) : roomMoments.length > 0 && currentMoment ? (
                <LocketFeedCard
                  moment={currentMoment}
                  currentUser={currentUser}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  hasPrev={safeIndex > 0}
                  hasNext={safeIndex < roomMoments.length - 1}
                  onDeleteMoment={deleteMoment}
                  nextMomentUrl={nextMoment?.media_url}
                  prevMomentUrl={prevMoment?.media_url}
                  activeReaction={lastReaction}
                />
              ) : (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.8rem] bg-black/30 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF2A85]/20 text-[#FF2A85] flex items-center justify-center mb-3 border border-[#FF2A85]/40">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào trong phòng</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để đặt ảnh đầu tiên vào tệp ảnh chung!
                  </p>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="py-2.5 px-5 bg-[#FF2A85] text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(255,42,133,0.5)] active:scale-95 transition-transform"
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
        onOpenMenu={() => setShowChatSheet(true)}
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

      {/* Camera View Modal */}
      {showCamera && (
        <CameraView
          friends={[]}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}

      {/* Locket Direct Messaging Chat Sheet */}
      <AnimatePresence>
        {showChatSheet && (
          <LocketChatSheet
            currentUser={currentUser}
            friends={membersFilterOptions}
            onClose={() => setShowChatSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
