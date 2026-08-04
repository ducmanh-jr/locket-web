"use client";

import React from 'react';
import { Moment } from '@/lib/types';
import { Camera } from 'lucide-react';

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
  return (
    <div className="relative w-full flex-1 flex flex-col justify-between px-2 pt-2 pb-24 overflow-y-auto custom-scrollbar">
      {/* 3-Column Square Grid */}
      {moments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <p className="text-zinc-500 text-xs">Chưa có khoảnh khắc nào trong lịch sử.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {moments.map((moment) => (
            <div
              key={moment.id}
              onClick={() => onSelectMoment(moment)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-[#18181C] border border-zinc-800 cursor-pointer hover:scale-102 transition-transform active:scale-95 group"
            >
              <img
                src={moment.media_url}
                alt={moment.caption || 'Moment thumbnail'}
                className="w-full h-full object-cover"
              />
              {/* Optional reaction badge indicator */}
              {moment.reactions && moment.reactions.length > 0 && (
                <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] text-white">
                  {moment.reactions[0].emoji}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Yellow Shutter Ring Button over Grid */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <button
          onClick={onOpenCamera}
          className="w-16 h-16 rounded-full border-4 border-[#FFC700] p-1 flex items-center justify-center shadow-locket-glow active:scale-90 transition-transform bg-black/40 backdrop-blur-md"
          title="Chụp ảnh mới"
        >
          <div className="w-full h-full bg-white rounded-full" />
        </button>
      </div>
    </div>
  );
};
