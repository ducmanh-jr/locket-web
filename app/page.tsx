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

  const currentUser = userProfile || DEMO_CURRENT_USER;

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Fetch real friends and registered users from Supabase
  const loadFriends = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data && data.length > 0) {
          const realOthers = data.filter((p: Profile) => p.id !== currentUser.id);
          const combined = [...realOthers, ...DEFAULT_3_FRIENDS];
          const unique = combined.filter(
            (user, index, self) => index === self.findIndex((u) => u.username === user.username)
          );
          setFriendsList(unique);
          return;
        }
      } catch (e) {}
    }
    setFriendsList(DEFAULT_3_FRIENDS);
  };

  // Fetch moments
  const loadMoments = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('*, sender:profiles(*), reactions(*, user:profiles(*))')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setMoments(data as Moment[]);
        } else {
          setMoments(getStoredDemoMoments());
        }
      } catch (e) {
        setMoments(getStoredDemoMoments());
      }
    } else {
      setMoments(getStoredDemoMoments());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFriends();
    loadMoments();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('public:moments-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'moments' },
          () => {
            loadMoments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser.id]);

  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Filter moments by selected friend (dm, system32, admin)
  const filteredMoments = selectedFriendFilter
    ? moments.filter((m) => {
        const sender = m.sender;
        return (
          m.sender_id === selectedFriendFilter ||
          sender?.username === selectedFriendFilter ||
          sender?.id === selectedFriendFilter
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
    const newMomentId = `moment-${Date.now()}`;
    let mediaUrl = image.dataUrl;

    if (isSupabaseConfigured() && userProfile) {
      try {
        const filePath = `${userProfile.id}/${newMomentId}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('moments')
          .upload(filePath, image.blob, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('moments')
            .createSignedUrl(filePath, 3600 * 24 * 30);
          if (signedData?.signedUrl) {
            mediaUrl = signedData.signedUrl;
          }
        }

        const { data: momentData } = await supabase
          .from('moments')
          .insert({
            id: newMomentId,
            sender_id: userProfile.id,
            media_url: mediaUrl,
            caption: caption,
          })
          .select()
          .single();

        if (momentData) {
          const recipientInserts = recipientIds.map((rid) => ({
            moment_id: newMomentId,
            recipient_id: rid,
          }));
          await supabase.from('moment_recipients').insert(recipientInserts);
        }
      } catch (e) {}
    }

    const createdMoment: Moment = {
      id: newMomentId,
      sender_id: currentUser.id,
      sender: currentUser,
      media_url: mediaUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };

    const updatedMoments = addDemoMoment(createdMoment);
    setMoments(updatedMoments);
    setCurrentIndex(0);
    setCurrentView('feed');
  };

  return (
    <div className="min-h-full flex flex-col justify-between bg-black selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
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
                  const idx = filteredMoments.findIndex((m) => m.id === moment.id);
                  if (idx !== -1) setCurrentIndex(idx);
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
              className="w-full flex-1 flex flex-col justify-between items-center overflow-hidden p-1"
            >
              <div className="w-full px-2 pt-1">
                <SupabaseConfigNotice />
                <PWAInstallBanner />
              </div>

              {loading ? (
                <div className="w-[85vw] max-w-[310px] aspect-square my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 flex items-center justify-center animate-pulse">
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
                />
              ) : (
                <div className="w-[85vw] max-w-[310px] aspect-square my-auto rounded-[2.5rem] bg-[#18181C] border border-[#FFC700]/30 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center mb-3 border border-[#FFC700]/40">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào</h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    Bấm nút chụp bên dưới để gửi khoảnh khắc đầu tiên!
                  </p>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="py-2.5 px-5 bg-[#FFC700] text-black font-bold text-xs rounded-xl shadow-locket-glow active:scale-95 transition-transform"
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
            const idx = filteredMoments.findIndex((m) => m.id === moment.id);
            if (idx !== -1) setCurrentIndex(idx);
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
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
