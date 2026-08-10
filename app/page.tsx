"use client";

import React, { useState, useEffect } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { CameraView } from '@/components/CameraView';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { Camera, X, User, LogOut } from 'lucide-react';
import { CapturedMedia } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicTrack } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading, signOut } = useAuth();
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
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);

  const currentUser = userProfile || {
    id: 'user-me',
    username: 'manh_locket',
    display_name: 'Đức Mạnh',
    avatar_url: '/user-photos/1785829393992_567716528849713056_g276929852367586455_e887fb48d4d113fc528e29488435b6f7.jpg',
  };

  // Redirect unauthenticated sessions to /login
  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [authLoading, userProfile, router]);

  // Register PWA Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

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
    await addMoment(media, caption, recipientIds, music, audioOption);
    setShowCamera(false);
    setCurrentView('feed');
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
              </div>

              {momentsLoading ? (
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
                  onDeleteMoment={deleteMoment}
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

      {/* Bottom Dock — "..." button now goes directly to /profile settings */}
      <LocketDock
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
        onOpenCamera={() => setShowCamera(true)}
        onOpenMenu={() => router.push('/profile')}
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
    </div>
  );
}
