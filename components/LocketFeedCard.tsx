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

    if (diffY > 30 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -30 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }

    touchStartY.current = null;
  };

  // Mouse Wheel Vertical Scroll Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 20 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (e.deltaY < -20 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full flex-1 flex flex-col items-center justify-center max-w-[390px] mx-auto select-none cursor-grab active:cursor-grabbing px-2 py-1"
    >
      {/* 1:1 Large Authentic Locket Photo Card (Matching Screenshot 2) */}
      <div className="relative w-[92vw] sm:w-full aspect-square rounded-[2.75rem] overflow-hidden bg-[#18181C] border border-zinc-800/80 shadow-2xl flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: direction === 'up' ? 90 : -90 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? -90 : 90 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-full relative"
          >
            <img
              src={moment.media_url}
              alt={moment.caption || 'Khoảnh khắc Locket'}
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Caption Overlay at bottom center inside photo */}
            {moment.caption && (
              <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none z-10">
                <span className="inline-block bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg max-w-[85%] break-words border border-white/10">
                  {moment.caption}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sender Avatar & Name Tag Directly Below Photo Card (Matching Screenshot 2) */}
      <div className="flex items-center space-x-2 mt-2.5 mb-1 flex-shrink-0">
        <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
          <img
            src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
            alt={sender.display_name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-white text-xs font-bold">{sender.display_name}</span>
        <span className="text-zinc-500 text-xs font-medium">{formatLocketTime(moment.created_at)}</span>
      </div>
    </div>
  );
};
