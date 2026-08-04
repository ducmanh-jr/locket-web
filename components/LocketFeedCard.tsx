"use client";

import React, { useRef, useState } from 'react';
import { Moment, Profile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LocketFeedCardProps {
  moment: Moment;
  currentUser: Profile;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const LocketFeedCard: React.FC<LocketFeedCardProps> = ({
  moment,
  currentUser,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
}) => {
  const touchStartY = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const sender = moment.sender || {
    id: 'unknown',
    username: 'ban_be',
    display_name: 'Bạn bè',
    avatar_url: '',
  };

  // Format relative time like Locket (e.g. "1d", "3h", "15m")
  const formatLocketTime = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // Touch Swipe Vertical Handlers (Lướt lên / Lướt xuống)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    // Swipe UP (diffY > 40) -> Go to next older photo
    if (diffY > 40 && hasNext && onNext) {
      setDirection('up');
      onNext();
    }
    // Swipe DOWN (diffY < -40) -> Go to previous newer photo
    else if (diffY < -40 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }

    touchStartY.current = null;
  };

  // Mouse Wheel Vertical Scroll Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 30 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (e.deltaY < -30 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full flex flex-col items-center max-w-sm mx-auto my-auto px-2 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Vertical Animated Locket Photo Card */}
      <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-[#18181C] border border-zinc-800 shadow-2xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: direction === 'up' ? 80 : -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? -80 : 80 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full relative"
          >
            <img
              src={moment.media_url}
              alt={moment.caption || 'Khoảnh khắc Locket'}
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Caption Overlay at bottom center inside photo */}
            {moment.caption && (
              <div className="absolute bottom-5 left-4 right-4 text-center pointer-events-none">
                <span className="inline-block bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg max-w-[85%] break-words border border-white/10">
                  {moment.caption}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sender Avatar & Name Tag Below Photo Card */}
      <div className="flex items-center space-x-2 mt-3">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
          <img
            src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
            alt={sender.display_name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-white text-xs font-bold">{sender.display_name}</span>
        <span className="text-zinc-500 text-xs font-semibold">{formatLocketTime(moment.created_at)}</span>
      </div>
    </div>
  );
};
