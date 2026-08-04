"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Moment, Profile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, MoreVertical } from 'lucide-react';

interface LocketFeedCardProps {
  moment: Moment;
  currentUser: Profile;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onDeleteMoment?: (momentId: string) => void;
  nextMomentUrl?: string;
  prevMomentUrl?: string;
}

export const LocketFeedCard: React.FC<LocketFeedCardProps> = ({
  moment,
  currentUser,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
  onDeleteMoment,
  nextMomentUrl,
  prevMomentUrl,
}) => {
  const touchStartY = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);

  // Preload Next & Previous Photos into Browser Cache
  useEffect(() => {
    if (nextMomentUrl) {
      const img = new Image();
      img.src = nextMomentUrl;
    }
    if (prevMomentUrl) {
      const img = new Image();
      img.src = prevMomentUrl;
    }
  }, [nextMomentUrl, prevMomentUrl]);

  const sender = moment.sender || {
    id: 'unknown',
    username: 'ban_be',
    display_name: 'Bạn bè',
    avatar_url: '',
  };

  const isMyMoment = sender.id === currentUser.id;

  const formatLocketTime = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 86400)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (diffY > 35 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -35 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }

    touchStartY.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 25 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (e.deltaY < -25 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }
  };

  const handleDoubleTap = () => {
    const newId = Date.now();
    const randomX = Math.floor(Math.random() * 60) - 30;
    setFloatingEmojis((prev) => [...prev, { id: newId, emoji: '💛', x: randomX }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 1200);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(moment.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `locket-${moment.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(moment.media_url, '_blank');
    }
    setShowOptionsModal(false);
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full flex-1 flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing p-2 my-auto overflow-hidden relative"
    >
      {/* 1:1 Perfect Square Photo Card Container matching Locket Mobile App */}
      <div
        onDoubleClick={handleDoubleTap}
        className="relative w-full max-w-[310px] sm:max-w-[330px] aspect-square rounded-[2.5rem] overflow-hidden bg-[#18181C] border border-zinc-800 shadow-2xl flex-shrink-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: direction === 'up' ? 80 : -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? -80 : 80 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            className="w-full h-full overflow-hidden"
          >
            <img
              src={moment.media_url}
              alt={moment.caption || 'Khoảnh khắc Locket'}
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Floating Emoji Reaction Particles */}
            {floatingEmojis.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: 140, scale: 0.8, x: item.x }}
                animate={{ opacity: 0, y: -90, scale: 1.8 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute bottom-10 left-1/2 text-4xl pointer-events-none z-30"
              >
                {item.emoji}
              </motion.div>
            ))}

            {/* Options button on top right of photo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsModal(true);
              }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 opacity-80 hover:opacity-100 transition-opacity z-20"
              title="Tùy chọn ảnh"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Caption Overlay */}
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

      {/* Sender Avatar & Name Tag Centered DIRECTLY Below Card */}
      <div className="w-full flex items-center justify-center space-x-2 mt-2.5 mb-1 text-center flex-shrink-0 z-10">
        <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
          <img
            src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
            alt={sender.display_name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-white text-xs font-bold truncate max-w-[140px]">{sender.display_name}</span>
        <span className="text-zinc-500 text-xs font-medium flex-shrink-0">{formatLocketTime(moment.created_at)}</span>
      </div>

      {/* Options Modal Sheet */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-xs bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 text-left space-y-2">
            <h4 className="text-white text-xs font-bold text-center pb-2 border-b border-zinc-800">
              Tùy chọn Khoảnh khắc
            </h4>

            <button
              onClick={handleDownload}
              className="w-full p-3 bg-[#262626] hover:bg-[#333333] rounded-2xl text-white text-xs font-semibold flex items-center space-x-3 transition-colors"
            >
              <Download className="w-4 h-4 text-[#FFC700]" />
              <span>Tải ảnh về máy</span>
            </button>

            {isMyMoment && onDeleteMoment && (
              <button
                onClick={() => {
                  onDeleteMoment(moment.id);
                  setShowOptionsModal(false);
                }}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center space-x-3 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Xóa khoảnh khắc này</span>
              </button>
            )}

            <button
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-2.5 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-2xl text-center"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
