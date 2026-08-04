"use client";

import React, { useState } from 'react';
import { Moment, Profile } from '@/lib/types';
import { Grid, Calendar, X, Download, Heart } from 'lucide-react';

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
  const [selectedDetailMoment, setSelectedDetailMoment] = useState<Moment | null>(null);

  // Group moments by Date
  const formatDateHeader = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}`;
  };

  const handleDownload = async (mediaUrl: string, momentId: string) => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `locket-history-${momentId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(mediaUrl, '_blank');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white px-2 pt-2 pb-24 overflow-y-auto custom-scrollbar select-none relative">
      {/* Sticky Grid Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 mb-3 sticky top-0 bg-black/90 backdrop-blur-md z-30">
        <div className="flex items-center space-x-2">
          <Grid className="w-4 h-4 text-[#FFC700]" />
          <h2 className="text-white text-xs font-bold uppercase tracking-wider">
            Lịch sử Khoảnh khắc ({moments.length})
          </h2>
        </div>
        <span className="text-zinc-500 text-[10px]">Chạm ảnh để xem chi tiết</span>
      </div>

      {moments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
          <Calendar className="w-10 h-10 mb-2 opacity-50 text-[#FFC700]" />
          <p className="text-xs">Chưa có khoảnh khắc nào được lưu lại</p>
        </div>
      ) : (
        /* 3-Column Square Grid matching Locket Screenshot 4 & 5 */
        <div className="grid grid-cols-3 gap-1.5 px-1">
          {moments.map((moment) => (
            <div
              key={moment.id}
              onClick={() => setSelectedDetailMoment(moment)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer active:scale-95 transition-transform group"
            >
              <img
                src={moment.media_url}
                alt={moment.caption || 'Khoảnh khắc'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />

              {/* Caption Tag Overlay at bottom */}
              {moment.caption && (
                <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-[9px] text-zinc-200 px-1.5 py-0.5 rounded-lg truncate font-medium">
                  {moment.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal when tapping grid photo */}
      {selectedDetailMoment && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-3xl p-4 shadow-2xl relative flex flex-col items-center">
            <button
              onClick={() => setSelectedDetailMoment(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 1:1 Photo */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 mb-3 relative">
              <img
                src={selectedDetailMoment.media_url}
                alt={selectedDetailMoment.caption || 'Khoảnh khắc'}
                className="w-full h-full object-cover"
              />
              {selectedDetailMoment.caption && (
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="inline-block bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl border border-white/10">
                    {selectedDetailMoment.caption}
                  </span>
                </div>
              )}
            </div>

            {/* Sender Info & Download Action */}
            <div className="w-full flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <img
                  src={
                    selectedDetailMoment.sender?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDetailMoment.sender_id}`
                  }
                  className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <h4 className="text-white text-xs font-bold">
                    {selectedDetailMoment.sender?.display_name || 'Bạn bè'}
                  </h4>
                  <p className="text-zinc-500 text-[10px]">
                    {formatDateHeader(selectedDetailMoment.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  handleDownload(selectedDetailMoment.media_url, selectedDetailMoment.id)
                }
                className="p-2 rounded-xl bg-[#262626] text-[#FFC700] hover:bg-zinc-700 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Tải về</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Yellow Camera Shutter Button Fixed at Bottom Center (Matching Screenshot 4 & 5) */}
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
