"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { CameraView } from '@/components/CameraView';
import { LocketChatSheet } from '@/components/LocketChatSheet';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { Camera, Palette } from 'lucide-react';
import { CapturedMedia } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicTrack } from '@/lib/types';
import { LocketThemePickerModal } from '@/components/LocketThemePickerModal';

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

  // Locket Gold Theme Picker States
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const [isZoomedOut, setIsZoomedOut] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (e) {}
      }
      setIsZoomedOut(true);
      setShowThemePicker(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-black text-white space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
        <p className="text-xs font-semibold text-zinc-400">Đang kiểm tra tài khoản Google...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-black text-white space-y-4 p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-2 border border-zinc-800" style={{ color: 'var(--theme-primary)' }}>
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-white">Yêu cầu Đăng nhập Google</p>
        <p className="text-xs text-zinc-400 max-w-xs">Chuyển hướng đến màn hình đăng nhập...</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-4 py-2 text-black font-bold text-xs rounded-xl shadow-lg"
          style={{ background: 'var(--theme-primary)' }}
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
    <motion.div
      animate={{
        scale: isZoomedOut ? 0.85 : 1,
        borderRadius: isZoomedOut ? '2.5rem' : '0rem',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      className="h-full flex flex-col justify-between bg-black selection:bg-[#FFC700] selection:text-black overflow-hidden relative"
    >
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
              className="w-full flex-1 flex flex-col justify-center items-center overflow-hidden p-1 relative"
            >
              <div className="w-full px-2 pt-1">
                <SupabaseConfigNotice />
              </div>

              {momentsLoading ? (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
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
                <div className="w-[310px] h-[310px] my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mb-3 border border-zinc-800" style={{ color: 'var(--theme-primary)' }}>
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào trong phòng</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để đặt ảnh đầu tiên vào tệp ảnh chung!
                  </p>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="py-2.5 px-5 text-black font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-transform"
                    style={{ background: 'var(--theme-primary)' }}
                  >
                    Chụp ảnh ngay 📸
                  </button>
                </div>
              )}

              {/* Theme Picker Quick Floating Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomedOut(true);
                  setShowThemePicker(true);
                }}
                className="absolute top-2 right-3 z-30 bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-lg active:scale-90 transition-all hover:bg-black/80"
                style={{ color: 'var(--theme-primary)' }}
                title="Đổi Giao Diện Theme Locket Gold (Hoặc giữ màn hình 0.5s) 🎨"
              >
                <Palette className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Đổi Theme 🎨</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Dock */}
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

      {/* Locket Gold Theme Picker Modal */}
      <LocketThemePickerModal
        isOpen={showThemePicker}
        onClose={() => {
          setShowThemePicker(false);
          setIsZoomedOut(false);
        }}
      />
    </motion.div>
  );
}
