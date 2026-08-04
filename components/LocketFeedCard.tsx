"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Moment, Profile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, MoreVertical, Volume2, VolumeX, Music } from 'lucide-react';

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
  activeReaction?: { emoji: string; timestamp: number } | null;
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
  activeReaction,
}) => {
  const touchStartY = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const wheelCooldown = useRef<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; x: number; rotation: number }[]
  >([]);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto Play & Manage Audio snippet for Moment Music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingAudio(false);
    }

    if (moment.music?.preview_url) {
      const audio = new Audio(moment.music.preview_url);
      audio.volume = 0.65;
      audio.loop = true;
      audioRef.current = audio;

      audio
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));

      return () => {
        audio.pause();
        audioRef.current = null;
        setIsPlayingAudio(false);
      };
    }
  }, [moment.id, moment.music?.preview_url]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current && moment.music?.preview_url) {
      const audio = new Audio(moment.music.preview_url);
      audio.volume = 0.65;
      audio.loop = true;
      audioRef.current = audio;
    }
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {});
    }
  };

  // Trigger Floating Emoji Fountain Effect when user clicks quick reaction emojis
  useEffect(() => {
    if (activeReaction?.emoji) {
      const now = Date.now();
      const newParticles = Array.from({ length: 5 }).map((_, i) => ({
        id: now + i + Math.random(),
        emoji: activeReaction.emoji,
        x: Math.floor(Math.random() * 140) - 70,
        rotation: Math.floor(Math.random() * 40) - 20,
      }));
      setFloatingEmojis((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setFloatingEmojis((prev) =>
          prev.filter((item) => !newParticles.some((p) => p.id === item.id))
        );
      }, 1400);
    }
  }, [activeReaction]);

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

  // Keyboard Shortcuts (ArrowUp / ArrowDown for PC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (hasNext && onNext) {
          setDirection('up');
          onNext();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (hasPrev && onPrev) {
          setDirection('down');
          onPrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev]);

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
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const isDraggingRef = useRef<boolean>(false);

  // Touch Swipe Vertical Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffY) > 15) {
      isDraggingRef.current = true;
    }

    if (diffY > 50 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -50 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }

    touchStartY.current = null;
  };

  // Mouse Drag Vertical Handlers (PC Mouse Click & Drag like phone swipe)
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartY.current = e.clientY;
    setIsMouseDown(true);
    isDraggingRef.current = false;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartY.current === null || !isMouseDown) return;
    const diffY = mouseStartY.current - e.clientY;

    if (Math.abs(diffY) > 15) {
      isDraggingRef.current = true;
    }

    if (diffY > 50 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -50 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }

    mouseStartY.current = null;
    setIsMouseDown(false);
  };

  const handleMouseLeave = () => {
    mouseStartY.current = null;
    setIsMouseDown(false);
  };

  // Mouse Wheel Vertical Scroll Handler (with throttle to prevent rapid-fire)
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldown.current) return;
    if (e.deltaY > 35 && hasNext && onNext) {
      setDirection('up');
      onNext();
      wheelCooldown.current = true;
      setTimeout(() => { wheelCooldown.current = false; }, 300);
    } else if (e.deltaY < -35 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
      wheelCooldown.current = true;
      setTimeout(() => { wheelCooldown.current = false; }, 300);
    }
  };

  const handleDoubleTap = () => {
    const newId = Date.now();
    const randomX = Math.floor(Math.random() * 80) - 40;
    const randomRot = Math.floor(Math.random() * 30) - 15;
    setFloatingEmojis((prev) => [
      ...prev,
      { id: newId, emoji: '💛', x: randomX, rotation: randomRot },
    ]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 1300);
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('form') || target.closest('input')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const halfHeight = rect.height / 2;

    if (clickY > halfHeight) {
      if (hasNext && onNext) {
        setDirection('up');
        onNext();
      }
    } else {
      if (hasPrev && onPrev) {
        setDirection('down');
        onPrev();
      }
    }
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`w-full flex-1 flex flex-col items-center justify-center select-none p-2 my-auto overflow-hidden relative ${
        isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1:1 Square Photo Card Container Touching Near Screen Edges */}
      <div
        onClick={handleCardClick}
        onDoubleClick={handleDoubleTap}
        className="w-[calc(100%-1rem)] max-w-[385px] aspect-square bg-[#18181C] border border-zinc-800/80 shadow-2xl flex-shrink-0 my-auto relative overflow-hidden rounded-[2.5rem] cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={moment.id}
            initial={{
              opacity: 0,
              y: direction === 'up' ? 70 : -70,
              scale: 0.94,
              filter: 'blur(4px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              y: direction === 'up' ? -70 : 70,
              scale: 0.94,
              filter: 'blur(4px)',
            }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="w-full h-full absolute inset-0 overflow-hidden rounded-[2.5rem] transform-gpu will-change-[transform,opacity]"
          >
            <img
              src={moment.media_url}
              alt={moment.caption || 'Khoảnh khắc Locket'}
              className="w-full h-full object-cover rounded-[2.5rem] select-none pointer-events-none"
            />

            {/* Floating Emoji Reaction Particles */}
            {floatingEmojis.map((item) => (
              <motion.div
                key={item.id}
                initial={{
                  opacity: 1,
                  y: 150,
                  scale: 0.5,
                  x: item.x,
                  rotate: item.rotation,
                }}
                animate={{
                  opacity: 0,
                  y: -110,
                  scale: [0.5, 1.4, 1.8],
                  rotate: item.rotation * 2,
                }}
                transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-10 left-1/2 text-4xl pointer-events-none z-30 drop-shadow-lg"
              >
                {item.emoji}
              </motion.div>
            ))}

            {/* Music Badge Sticker on Photo */}
            {moment.music && (
              <button
                onClick={toggleAudio}
                className="absolute top-3.5 left-3.5 bg-black/75 backdrop-blur-md border border-[#FFC700]/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-2 z-20 shadow-lg active:scale-95 transition-all max-w-[70%]"
                title="Bật/Tắt nhạc"
              >
                <div
                  className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-[#FFC700] ${
                    isPlayingAudio ? 'animate-spin' : ''
                  }`}
                >
                  <img src={moment.music.cover_url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="font-semibold text-xs truncate">
                  {moment.music.title} • {moment.music.artist}
                </span>
                {isPlayingAudio ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#FFC700] flex-shrink-0 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                )}
              </button>
            )}

            {/* Options button on top right of photo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsModal(true);
              }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 opacity-80 hover:opacity-100 transition-all active:scale-90 z-20"
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
      <motion.div
        key={`sender-${moment.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.05 }}
        className="w-full h-8 flex items-center justify-center space-x-2 my-2 text-center flex-shrink-0 z-10"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
          <img
            src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
            alt={sender.display_name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-white text-xs font-bold truncate max-w-[160px]">
          {isMyMoment ? `${sender.display_name} (Bạn)` : sender.display_name}
        </span>
        <span className="text-zinc-500 text-xs font-medium flex-shrink-0">{formatLocketTime(moment.created_at)}</span>
      </motion.div>

      {/* Options Modal Sheet */}
      <AnimatePresence>
        {showOptionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOptionsModal(false)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 text-left space-y-2"
            >
              <h4 className="text-white text-xs font-bold text-center pb-2 border-b border-zinc-800">
                Tùy chọn Khoảnh khắc
              </h4>

              <button
                onClick={handleDownload}
                className="w-full p-3 bg-[#262626] hover:bg-[#333333] rounded-2xl text-white text-xs font-semibold flex items-center space-x-3 transition-all active:scale-98"
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
                  className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center space-x-3 transition-all active:scale-98"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Xóa khoảnh khắc này</span>
                </button>
              )}

              <button
                onClick={() => setShowOptionsModal(false)}
                className="w-full py-2.5 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-2xl text-center active:scale-98"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
