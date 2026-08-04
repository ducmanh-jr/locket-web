"use client";

import React, { useState } from 'react';
import { Moment } from '@/lib/types';
import { Grid, Video } from 'lucide-react';

interface LocketHistoryGridProps {
  moments: Moment[];
  onSelectMoment: (moment: Moment) => void;
  onOpenCamera: () => void;
}

export const LocketHistoryGrid: React.FC<LocketHistoryGridProps> = ({
  moments,
  onSelectMoment,
  onOpenCamera,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'recents'>('all');

  const formatDateHeader = (dateString: string) => {
    const d = new Date(dateString);
    return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}`;
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 pt-3 pb-24 overflow-y-auto custom-scrollbar select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Grid className="w-5 h-5 text-[#FFC700]" />
          <h1 className="text-white text-base font-extrabold tracking-wide uppercase">
            Lịch sử khoảnh khắc ({moments.length})
          </h1>
        </div>

        <span className="text-zinc-500 text-[11px]">Chạm ảnh để xem chi tiết</span>
      </div>

      {/* Grid Content Area */}
      <div className="flex-1 my-3">
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mb-3">
              <Grid className="w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Chưa có ảnh nào</h3>
            <p className="text-zinc-500 text-xs">Chụp khoảnh khắc đầu tiên cùng bạn bè!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 transform-gpu">
            {moments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => onSelectMoment(moment)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-[#18181C] border border-zinc-800/80 cursor-pointer active:scale-95 transition-transform group transform-gpu"
              >
                <img
                  src={moment.media_url}
                  alt={moment.caption || 'Khoảnh khắc Locket'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Caption Tag Overlay at bottom */}
                {moment.caption && (
                  <div className="absolute bottom-1 left-1 right-1 bg-black/85 text-[9px] text-zinc-200 px-1.5 py-0.5 rounded-lg truncate font-medium text-center border border-white/10">
                    {moment.caption}
                  </div>
                )}

                {/* Video Indicator Badge */}
                {moment.media_type === 'video' && (
                  <div className="absolute top-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 border border-white/10">
                    <Video className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Yellow Camera Shutter Button Fixed at Bottom Center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={onOpenCamera}
          className="w-16 h-16 rounded-full border-4 border-[#FFC700] p-1 bg-black flex items-center justify-center shadow-locket-glow active:scale-90 transition-transform"
          title="Chụp khoảnh khắc mới"
        >
          <div className="w-full h-full bg-white rounded-full shadow-inner" />
        </button>
      </div>
    </div>
  );
};
