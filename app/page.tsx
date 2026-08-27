"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { CameraView } from '@/components/CameraView';
import { LocketChatSheet, getUnreadMessagesCount } from '@/components/LocketChatSheet';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { Camera, LogOut } from 'lucide-react';
import { CapturedMedia } from '@/lib/camera';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LocketErrorBoundary } from '@/components/LocketErrorBoundary';
import { MusicTrack } from '@/lib/types';

function HomePage() {
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
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; timestamp: number } | null>(null);
  const [isFeedDragging, setIsFeedDragging] = useState<boolean>(false);
  const hasParsedDeepLinkRef = useRef<boolean>(false);

  const isGuest = !userProfile;

  const currentUser = userProfile || {
    id: 'guest',
    username: 'khach',
    display_name: 'Khách',
    avatar_url: '',
  };

  const openSubView = (action: () => void, name: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ modal: name }, '');
    }
    action();
  };

  // Public Guest View: Allow unauthenticated visitors to view shared moments & feed without being forced to /login

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      if (!window.history.state || !window.history.state.app) {
        window.history.replaceState({ app: 'locket_root' }, '');
      }
    }
  }, []);

  // Mobile edge swipe-back gesture & popstate backstack listener
  useEffect(() => {
    if (!userProfile) return;

    const handlePopState = () => {
      if (showCamera) {
        setShowCamera(false);
        return;
      }
      if (showChatSheet) {
        setShowChatSheet(false);
        return;
      }
      if (currentView === 'grid') {
        setCurrentView('feed');
        return;
      }

      // Root Feed back action: intercept & show Exit Confirmation Modal
      if (typeof window !== 'undefined') {
        window.history.pushState({ app: 'locket_root' }, '');
      }
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showCamera, showChatSheet, currentView, userProfile]);

  // Deep-linking: auto-select moment specified in ?m= or ?moment= query string ONCE on initial page load
  useEffect(() => {
    if (hasParsedDeepLinkRef.current) return;
    if (typeof window !== 'undefined' && filteredMoments.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('m') || params.get('moment');
      if (sharedId) {
        const matched = filteredMoments.find((m) => m.id === sharedId);
        if (matched) {
          setSelectedMomentId(matched.id);
          hasParsedDeepLinkRef.current = true;
        }
      }
    }
  }, [filteredMoments]);



  const roomMoments = React.useMemo(() => {
    return (filteredMoments || []).filter(
      (m) =>
        m &&
        m.id &&
        m.media_url &&
        m.caption !== '__DELETED_MOMENT__' &&
        !String(m.id).startsWith('del_moment_') &&
        !String(m.media_url || '').includes('deleted.invalid')
    );
  }, [filteredMoments]);

  const currentMoment = selectedMomentId
    ? roomMoments.find((m) => m?.id === selectedMomentId) || roomMoments[0]
    : roomMoments[0];

  const currentIndex = currentMoment
    ? roomMoments.findIndex((m) => m?.id === currentMoment.id)
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
    if (isGuest) {
      router.push('/login');
      return;
    }
    setLastReaction({ emoji, timestamp: Date.now() });
    addReaction(momentId, emoji);
  };

  const handleSendDirectMessage = (_text: string) => {
    if (isGuest) {
      router.push('/login');
      return;
    }
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
    if (isGuest) {
      router.push('/login');
      return;
    }
    const newMoment = await addMoment(media, caption, recipientIds, music, audioOption);
    if (newMoment?.id) {
      setSelectedMomentId(newMoment.id);
    } else {
      setSelectedMomentId(null);
    }
    setShowCamera(false);
    setCurrentView('feed');
  };



  const handleDeleteMomentInFeed = useCallback(
    (momentId: string) => {
      deleteMoment(momentId);
      setSelectedMomentId((prevId) => {
        if (prevId === momentId) {
          const remaining = roomMoments.filter((m) => m.id !== momentId);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return prevId;
      });
    },
    [deleteMoment, roomMoments]
  );

  if (authLoading) {
    return <LoadingScreen message="Đang kết nối khoảnh khắc..." />;
  }

  return (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-[#180e2d] via-[#10091D] to-[#0b0515] selection:bg-[#D9266E] selection:text-white overflow-hidden relative">
      {/* Shared Room Header */}
      <LocketHeader
        currentUser={currentUser}
        isGuest={isGuest}
        onOpenProfile={() => {
          if (isGuest) {
            router.push('/login');
          } else {
            router.push('/profile');
          }
        }}
        onOpenChat={() => {
          if (isGuest) {
            router.push('/login');
          } else {
            setShowChatSheet(true);
          }
        }}
        selectedFilterId={selectedFriendFilter}
        onSelectFilter={setSelectedFriendFilter}
        members={membersFilterOptions}
        isDragging={isFeedDragging}
      />

      {/* Main Views Container — Fullscreen Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <AnimatePresence mode="wait">
          {currentView === 'grid' ? (
            <motion.div
              key="view-grid"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full absolute inset-0 bg-gradient-to-b from-[#180e2d] via-[#10091D] to-[#0b0515] z-30 transform-gpu will-change-transform pt-16"
            >
              <LocketHistoryGrid
                moments={roomMoments}
                isGuest={isGuest}
                onSelectMoment={(moment) => {
                  setSelectedMomentId(moment.id);
                  setCurrentView('feed');
                }}
                onOpenCamera={() => {
                  if (isGuest) {
                    router.push('/login');
                  } else {
                    setShowCamera(true);
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-feed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full absolute inset-0 flex flex-col justify-center items-center"
            >
              <div className="w-full px-2 pt-1 absolute top-14 z-30 pointer-events-auto">
                <SupabaseConfigNotice />
              </div>

              {momentsLoading ? (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.8rem] bg-black/40 flex items-center justify-center animate-pulse border border-white/10">
                  <div className="w-10 h-10 rounded-full border-4 border-[#D9266E] border-t-transparent animate-spin" />
                </div>
              ) : roomMoments.length > 0 && currentMoment ? (
                <LocketFeedCard
                  moment={currentMoment}
                  currentUser={currentUser}
                  isGuest={isGuest}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  hasPrev={safeIndex > 0}
                  hasNext={safeIndex < roomMoments.length - 1}
                  onDeleteMoment={handleDeleteMomentInFeed}
                  nextMoment={nextMoment}
                  prevMoment={prevMoment}
                  nextMomentUrl={nextMoment?.media_url}
                  prevMomentUrl={prevMoment?.media_url}
                  activeReaction={lastReaction}
                  onDragChange={setIsFeedDragging}
                />
              ) : (
                <div className="w-[310px] h-[310px] my-auto rounded-[2.8rem] bg-black/40 p-8 flex flex-col items-center justify-center text-center border border-white/10">
                  <div className="w-14 h-14 rounded-full bg-[#D9266E]/20 text-[#D9266E] flex items-center justify-center mb-3 border border-[#D9266E]/40 shadow-lg">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào trong phòng</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để đặt ảnh đầu tiên vào tệp ảnh chung!
                  </p>
                  <button
                    onClick={() => {
                      if (isGuest) {
                        router.push('/login');
                      } else {
                        setShowCamera(true);
                      }
                    }}
                    className="py-2.5 px-5 bg-gradient-to-r from-[#D9266E] via-[#BE185D] to-[#9F1239] text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(217,38,110,0.5)] active:scale-95 transition-transform"
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
        isGuest={isGuest}
        unreadCount={isGuest ? 0 : getUnreadMessagesCount(currentUser.id)}
        onToggleView={(view) => {
          if (view === 'grid') {
            openSubView(() => setCurrentView('grid'), 'grid');
          } else {
            setCurrentView('feed');
          }
        }}
        onOpenCamera={() => {
          if (isGuest) {
            router.push('/login');
          } else {
            openSubView(() => setShowCamera(true), 'camera');
          }
        }}
        onOpenMenu={() => {
          if (isGuest) {
            router.push('/login');
          } else {
            openSubView(() => setShowChatSheet(true), 'chat');
          }
        }}
        onSendDirectMessage={handleSendDirectMessage}
        onReactEmoji={(emoji) => {
          if (currentMoment) handleReact(currentMoment.id, emoji);
        }}
        isMyMoment={
          currentMoment && !isGuest
            ? (currentMoment.sender_id === currentUser.id) ||
              (currentMoment.sender?.id === currentUser.id) ||
              (currentMoment.sender?.username === currentUser.username)
            : false
        }
        isDragging={isFeedDragging}
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

      {/* Exit App Confirmation Modal Sheet */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowExitModal(false)}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#160a12]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-[0_15px_50px_rgba(0,0,0,0.9)]"
            >
              <div className="w-14 h-14 rounded-full bg-[#D9266E]/20 text-[#D9266E] border border-[#D9266E]/40 flex items-center justify-center mx-auto shadow-lg">
                <LogOut className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-white text-base font-extrabold mb-1">Thoát ứng dụng?</h3>
                <p className="text-zinc-400 text-xs">
                  Bạn có chắc chắn muốn thoát khỏi LocketWeb không?
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-1">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-xs font-extrabold rounded-2xl active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    try {
                      window.history.go(-2);
                    } catch (e) {
                      window.close();
                    }
                  }}
                  className="flex-1 py-3 bg-[#D9266E] hover:bg-[#be185d] text-white text-xs font-extrabold rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(217,38,110,0.5)]"
                >
                  Thoát
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePageWithBoundary() {
  return (
    <LocketErrorBoundary>
      <HomePage />
    </LocketErrorBoundary>
  );
}
