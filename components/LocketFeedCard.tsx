"use client";

import React from 'react';
import { Moment, Profile } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className="w-full flex flex-col items-center max-w-sm mx-auto my-auto px-2">
      {/* 1:1 Authentic Locket Photo Card */}
      <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-[#18181C] border border-zinc-800 shadow-2xl group">
        <img
          src={moment.media_url}
          alt={moment.caption || 'Khoảnh khắc Locket'}
          className="w-full h-full object-cover select-none"
        />

        {/* Caption Overlay at bottom center inside photo */}
        {moment.caption && (
          <div className="absolute bottom-5 left-4 right-4 text-center pointer-events-none">
            <span className="inline-block bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg max-w-[85%] break-words border border-white/10">
              {moment.caption}
            </span>
          </div>
        )}

        {/* Carousel Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sender Avatar & Name Tag Below Photo Card */}
      <div className="flex items-center space-x-2 mt-4">
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
