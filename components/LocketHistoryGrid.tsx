"use client";

import React from 'react';
import { Moment } from '@/lib/types';
import { Grid, Video, Sparkles } from 'lucide-react';
import { getSafeMediaUrl } from '@/lib/media';
import { motion } from 'framer-motion';

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
    <div className="w-full h-full bg-[#0c060a]/90 backdrop-blur-2xl text-white flex flex-col justify-between p-4 pt-3 pb-24 overflow-y-auto custom-scrollbar select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Grid className="w-4 h-4 text-[#D9266E]" />
          <h1 className="text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
            Lịch sử khoảnh khắc
            <span className="text-[10px] bg-[#D9266E] text-white px-2 py-0.5 rounded-full font-bold">
              {moments.length}
            </span>
          </h1>
        </div>

        <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#D9266E]" />
          Chạm ảnh để mở
        </span>
      </div>

      {/* Grid Content Area */}
      <div className="flex-1 my-3">
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 text-zinc-500 flex items-center justify-center mb-3 shadow-xl">
              <Grid className="w-7 h-7" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Chưa có khoảnh khắc nào</h3>
            <p className="text-zinc-400 text-xs">Chụp khoảnh khắc đầu tiên cùng bạn bè!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 transform-gpu">
            {moments.map((moment, idx) => {
              const isVideo =
                moment.media_type === 'video' ||
                moment.id?.includes('video') ||
                moment.media_url?.startsWith('data:video/') ||
                moment.media_url?.endsWith('.mp4') ||
                moment.media_url?.endsWith('.webm');

              const displayUrl = getSafeMediaUrl(
                isVideo
                  ? moment.thumbnail_url || moment.media_url
                  : moment.media_url
              );

              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: Math.min(idx * 0.03, 0.3),
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onSelectMoment(moment)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-[#180b15] border border-white/10 cursor-pointer group transform-gpu shadow-lg hover:border-[#D9266E]/50 transition-colors"
                >
                  {isVideo && !moment.thumbnail_url ? (
                    <video
                      src={getSafeMediaUrl(moment.media_url)}
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        try {
                          (e.target as HTMLVideoElement).currentTime = 0.05;
                        } catch (err) {}
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={displayUrl}
                      alt={moment.caption || 'Khoảnh khắc Locket'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Caption Tag Overlay at bottom */}
                  {moment.caption && (
                    <div className="absolute bottom-1 left-1 right-1 bg-black/75 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded-lg truncate font-semibold text-center border border-white/10">
                      {moment.caption}
                    </div>
                  )}

                  {/* Video Indicator Badge */}
                  {isVideo && (
                    <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 border border-white/15">
                      <Video className="w-3 h-3 text-[#D9266E]" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
