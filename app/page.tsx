"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { WidgetCard } from '@/components/WidgetCard';
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
import { Moment } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Camera, Sparkles, RefreshCw } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';

export default function HomePage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
    }
  }, []);

  // Fetch moments (Live Supabase or Demo Store)
  const loadMoments = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('*, sender:profiles(*), reactions(*, user:profiles(*))')
          .order('created_at', { ascending: false });

        if (!error && data) {
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

    // Supabase Realtime Subscription (WebSocket)
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('public:moments-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'moments' },
          (payload) => {
            console.log('Realtime new moment received:', payload);
            loadMoments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Carousel controls
  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Reaction handler
  const handleReact = async (momentId: string, emoji: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('reactions').insert({
          moment_id: momentId,
          user_id: DEMO_CURRENT_USER.id,
          emoji: emoji,
        });
      } catch (e) {
        console.error('Error inserting reaction via Supabase:', e);
      }
    }
    // Always update UI state
    const updated = addDemoReaction(momentId, emoji, DEMO_CURRENT_USER);
    setMoments(updated);
  };

  // Send new moment handler
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
    setCurrentIndex(0); // Jump to top feed photo
  };

  const currentMoment = moments[currentIndex];

  return (
    <div className="min-h-full flex flex-col justify-between p-4 pb-28">
      {/* Top Section */}
      <div>
        <SupabaseConfigNotice />
        <PWAInstallBanner />

        {/* Header App Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-[#0E0E10] font-black text-lg flex items-center justify-center shadow-locket-glow">
              L
            </div>
            <h1 className="text-white text-xl font-extrabold tracking-tight flex items-center gap-1">
              Locket<span className="text-[#FFC700]">Web</span>
            </h1>
          </div>

          <button
            onClick={loadMoments}
            className="p-2 rounded-full bg-[#18181C] text-zinc-400 hover:text-white border border-[#2C2C34] active:scale-95 transition-all"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Widget Feed Container */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        {loading ? (
          <div className="w-full aspect-square rounded-[2.25rem] bg-[#18181C] border-2 border-[#2C2C34] flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
          </div>
        ) : moments.length > 0 && currentMoment ? (
          <WidgetCard
            moment={currentMoment}
            currentUser={DEMO_CURRENT_USER}
            onReact={handleReact}
            onNext={handleNext}
            onPrev={handlePrev}
            hasPrev={currentIndex > 0}
            hasNext={currentIndex < moments.length - 1}
          />
        ) : (
          <div className="w-full aspect-square rounded-[2.25rem] bg-[#18181C] border-2 border-[#2C2C34] p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center mb-4 border border-[#FFC700]/40">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-base mb-1">Chưa có khoảnh khắc nào</h3>
            <p className="text-zinc-400 text-xs mb-6 max-w-xs">
              Chụp tấm ảnh đầu tiên và gửi cho bạn bè để bắt đầu chuỗi khoảnh khắc!
            </p>
            <button
              onClick={() => setShowCamera(true)}
              className="py-3 px-6 bg-[#FFC700] text-[#0E0E10] font-bold rounded-2xl shadow-locket-glow active:scale-95 transition-transform"
            >
              Chụp ảnh ngay 📸
            </button>
          </div>
        )}

        {/* Carousel Indicator Dots */}
        {moments.length > 1 && (
          <div className="flex items-center space-x-1.5 mt-4">
            {moments.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[#FFC700]'
                    : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation */}
      <Navbar onOpenCamera={() => setShowCamera(true)} />

      {/* Camera View Modal */}
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
