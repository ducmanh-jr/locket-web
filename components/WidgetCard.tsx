"use client";

import React from 'react';
import Image from 'next/image';
import { Moment, Profile } from '@/lib/types';
import { ReactionPicker } from './ReactionPicker';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

interface WidgetCardProps {
  moment: Moment;
  currentUser: Profile;
  onReact: (momentId: string, emoji: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  moment,
  currentUser,
  onReact,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
}) => {
  const sender = moment.sender || {
    id: 'unknown',
    username: 'bạn_bè',
    display_name: 'Bạn bè',
    avatar_url: '',
  };

  // Format relative timestamp in Vietnamese
  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header: Sender Info & Time */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-[#FFC700]/40 flex-shrink-0">
            {sender.avatar_url ? (
              <img
                src={sender.avatar_url}
                alt={sender.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#FFC700] flex items-center justify-center font-bold text-[#0E0E10] text-sm">
                {sender.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold leading-none flex items-center gap-1">
              {sender.display_name}
            </h3>
            <p className="text-zinc-400 text-xs mt-1">@{sender.username}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-medium bg-[#18181C] px-2.5 py-1 rounded-full border border-[#2C2C34]">
          {formatTimeAgo(moment.created_at)}
        </span>
      </div>

      {/* Main Locket Widget 1:1 Photo Frame */}
      <div className="relative w-full aspect-square rounded-[2.25rem] overflow-hidden bg-[#18181C] border-2 border-[#2C2C34] shadow-2xl shadow-black group">
        <img
          src={moment.media_url}
          alt={moment.caption || 'Khoảnh khắc Locket'}
          className="w-full h-full object-cover"
        />

        {/* Caption Overlay */}
        {moment.caption && (
          <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
            <span className="inline-block bg-[#0E0E10]/80 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-2xl shadow-lg max-w-[90%] break-words">
              {moment.caption}
            </span>
          </div>
        )}

        {/* Carousel Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Emoji Reactions Section */}
      <div className="w-full mt-4">
        <ReactionPicker
          momentId={moment.id}
          reactions={moment.reactions}
          onReact={(emoji) => onReact(moment.id, emoji)}
        />
      </div>
    </div>
  );
};
