"use client";

import React, { useState, useEffect } from 'react';
import { LocketHeader } from '@/components/LocketHeader';
import { LocketDock } from '@/components/LocketDock';
import { LocketFeedCard } from '@/components/LocketFeedCard';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { LocketChatView } from '@/components/LocketChatView';
import { CameraView } from '@/components/CameraView';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice';
import {
  DEMO_CURRENT_USER,
  DEMO_FRIENDS,
  getStoredDemoMoments,
  addDemoMoment,
  addDemoReaction,
} from '@/lib/demoStore';
import { Moment, Profile } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Camera, RefreshCw, X, UserPlus } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'feed' | 'grid' | 'chat'>('feed');
  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
    }
  }, []);

  // Fetch moments (Cloud Supabase or Client Demo Store)
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
    loadMoments();

    // Supabase Realtime WebSocket Subscription
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
  }, []);

  // Filter moments by selected friend dropdown
  const filteredMoments = selectedFriendFilter
    ? moments.filter((m) => m.sender_id === selectedFriendFilter)
    : moments;

  const currentMoment = filteredMoments[currentIndex] || filteredMoments[0];

  // Carousel controls
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

  // Direct Message & Emoji Reaction Handler
  const handleSendDirectMessage = (text: string) => {
    if (currentMoment) {
      handleReact(currentMoment.id, '💬');
    }
  };

  const handleReact = async (momentId: string, emoji: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('reactions').insert({
          moment_id: momentId,
          user_id: DEMO_CURRENT_USER.id,
          emoji: emoji,
        });
      } catch (e) {
        console.error('Error inserting reaction:', e);
      }
    }
    const updated = addDemoReaction(momentId, emoji, DEMO_CURRENT_USER);
    setMoments(updated);
  };

  // Send newly captured moment
  const handleSendMoment = async (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => {
    const newMomentId = `moment-${Date.now()}`;
    let mediaUrl = image.dataUrl;

    if (isSupabaseConfigured()) {
      try {
        const filePath = `${DEMO_CURRENT_USER.id}/${newMomentId}.jpg`;
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
            sender_id: DEMO_CURRENT_USER.id,
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
      } catch (e) {
        console.error('Supabase send error:', e);
      }
    }

    const createdMoment: Moment = {
      id: newMomentId,
      sender_id: DEMO_CURRENT_USER.id,
      sender: DEMO_CURRENT_USER,
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
    <div className="min-h-full flex flex-col justify-between bg-black selection:bg-[#FFC700] selection:text-black">
      {/* Top Bar Header */}
      {currentView !== 'chat' && (
        <LocketHeader
          currentUser={DEMO_CURRENT_USER}
          friends={DEMO_FRIENDS}
          selectedFriendFilter={selectedFriendFilter}
          onSelectFilter={(friendId) => {
            setSelectedFriendFilter(friendId);
            setCurrentIndex(0);
          }}
          onOpenChat={() => setCurrentView('chat')}
          onOpenProfile={() => router.push('/profile')}
        />
      )}

      {/* Main Content Views */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {currentView === 'chat' ? (
          /* Direct Messages View (Matching Screenshot 2) */
          <LocketChatView
            friends={DEMO_FRIENDS}
            currentUser={DEMO_CURRENT_USER}
            onBack={() => setCurrentView('feed')}
          />
        ) : currentView === 'grid' ? (
          /* 3-Column History Grid (Matching Screenshot 4 & 5) */
          <LocketHistoryGrid
            moments={filteredMoments}
            onSelectMoment={(moment) => {
              const idx = filteredMoments.findIndex((m) => m.id === moment.id);
              if (idx !== -1) setCurrentIndex(idx);
              setCurrentView('feed');
            }}
            onOpenCamera={() => setShowCamera(true)}
          />
        ) : (
          /* Main Feed View (Matching Screenshot 1 & 3) */
          <div className="w-full flex-1 flex flex-col justify-between p-2">
            <div className="w-full px-2 pt-1">
              <SupabaseConfigNotice />
              <PWAInstallBanner />
            </div>

            {loading ? (
              <div className="w-full max-w-sm aspect-square my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
              </div>
            ) : filteredMoments.length > 0 && currentMoment ? (
              <LocketFeedCard
                moment={currentMoment}
                currentUser={DEMO_CURRENT_USER}
                onNext={handleNext}
                onPrev={handlePrev}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex < filteredMoments.length - 1}
              />
            ) : (
              <div className="w-full max-w-sm aspect-square my-auto rounded-[2.5rem] bg-[#18181C] border border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
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
          </div>
        )}
      </div>

      {/* Bottom Floating Locket Dock */}
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

      {/* Menu / Options Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-left relative">
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center"
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
                  <span>Quản lý & Kết bạn</span>
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
                  <span>Trang cá nhân & PWA</span>
                </div>
                <span className="text-zinc-500">&gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera View Modal */}
      {showCamera && (
        <CameraView
          friends={DEMO_FRIENDS}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
