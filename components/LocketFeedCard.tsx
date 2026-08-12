"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Moment, Profile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { killGlobalAudio, playGlobalAudio } from '@/lib/audioPlayer';
import { getSafeMediaUrl } from '@/lib/media';

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
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentMomentIdRef = useRef<string>(moment.id);

  const isVideo =
    moment.media_type === 'video' ||
    moment.id?.includes('video') ||
    moment.media_url?.startsWith('data:video/') ||
    moment.media_url?.endsWith('.mp4') ||
    moment.media_url?.endsWith('.webm');

  currentMomentIdRef.current = moment.id;

  useEffect(() => {
    setIsMuted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [moment.id, moment.media_url]);

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    killGlobalAudio();
    setIsPlayingAudio(false);

    if (moment.music?.preview_url) {
      setIsPlayingAudio(true);
      playGlobalAudio(moment.music.preview_url, () => {
        if (currentMomentIdRef.current === moment.id) {
          setIsPlayingAudio(false);
        }
      });
    }

    return () => {
      killGlobalAudio();
      setIsPlayingAudio(false);
    };
  }, [moment.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        killGlobalAudio();
        setIsPlayingAudio(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleAudio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) {
      killGlobalAudio();
      setIsPlayingAudio(false);
    } else if (moment.music?.preview_url) {
      setIsPlayingAudio(true);
      playGlobalAudio(moment.music.preview_url, () => {
        if (currentMomentIdRef.current === moment.id) {
          setIsPlayingAudio(false);
        }
      });
    }
  }, [isPlayingAudio, moment.id, moment.music?.preview_url]);

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

  const ADMIN_EMAIL = 'nguyenducmanh.ovaltine@gmail.com';
  const isAdmin = currentUser.isAdmin || currentUser.email?.toLowerCase().trim() === ADMIN_EMAIL;
  const isMyMoment = sender.id === currentUser.id;
  const canDeleteMoment = isMyMoment || isAdmin;

  const formatLocketTime = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const isDraggingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const touchCurrentY = e.touches[0].clientY;
      const diffY = touchStartY.current - touchCurrentY;
      if (Math.abs(diffY) > 5 && e.cancelable) {
        e.preventDefault();
      }
    }
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
      { id: newId, emoji: '💖', x: randomX, rotation: randomRot },
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
    if (
      target.closest('button') ||
      target.closest('form') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.closest('.no-card-click')
    ) {
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className={`w-full flex-1 flex flex-col items-center justify-between select-none overflow-hidden relative ${
        isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Centered Photo & Sender Section */}
      <div className="w-full flex flex-col items-center my-auto">
        {/* 1:1 Square Photo Card Container */}
        <div
          onClick={handleCardClick}
          onDoubleClick={handleDoubleTap}
          className="w-full aspect-square bg-black/20 flex-shrink-0 relative overflow-hidden rounded-[2.2rem] cursor-pointer"
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
              className="w-full h-full absolute inset-0 overflow-hidden rounded-[2.2rem] transform-gpu will-change-[transform,opacity]"
            >
              {isVideo ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={getSafeMediaUrl(moment.media_url)}
                    poster={getSafeMediaUrl(moment.thumbnail_url)}
                    autoPlay
                    loop
                    playsInline
                    muted={moment.music ? true : isMuted}
                    controls={false}
                    preload="auto"
                    onLoadedData={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="w-full h-full object-cover rounded-[2.2rem] select-none pointer-events-none"
                  />
                  {!moment.music && (
                    <button
                      onClick={toggleVideoMute}
                      className="absolute bottom-3.5 right-3.5 bg-black/70 backdrop-blur-md border border-[#FF2A85]/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1.5 z-20 shadow-xl active:scale-95 transition-all no-card-click"
                      title="Bật/Tắt âm thanh video"
                    >
                      {!isMuted ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#FF2A85] animate-pulse" />
                          <span className="font-bold text-xs text-[#FF2A85]">Bật 🎙️</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-semibold text-xs text-zinc-300">Tắt 🔇</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <img
                  src={moment.media_url || moment.thumbnail_url}
                  alt={moment.caption || 'Khoảnh khắc Locket'}
                  className="w-full h-full object-cover rounded-[2.2rem] select-none pointer-events-none"
                />
              )}

              {/* Floating Emoji Particles */}
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

              {/* Music Badge at Top-Left of Photo */}
              {moment.music && (
                <button
                  onClick={toggleAudio}
                  className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md border border-[#FF2A85]/40 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-2 z-20 shadow-lg active:scale-95 transition-all max-w-[70%] no-card-click"
                  title="Bật/Tắt nhạc"
                >
                  <div
                    className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-[#FF2A85] ${
                      isPlayingAudio ? 'animate-spin' : ''
                    }`}
                  >
                    <img src={moment.music.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-xs truncate">
                    {moment.music.title} • {moment.music.artist}
                  </span>
                  {isPlayingAudio ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#FF2A85] flex-shrink-0 animate-pulse" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  )}
                </button>
              )}

              {/* Options button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsModal(true);
                }}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/15 opacity-90 hover:opacity-100 transition-all active:scale-90 z-20 shadow-md"
                title="Tùy chọn ảnh"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Caption Pill Overlay at Bottom Inside Photo (Exact Screenshot) */}
              {moment.caption && (
                <div className="absolute bottom-3 left-4 right-4 flex justify-center pointer-events-none z-20">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg max-w-[85%] text-center truncate">
                    {moment.caption}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sender Avatar, Name & Time — right below photo */}
        <div className="w-full flex justify-center mt-2.5 pointer-events-none">
          <div className="flex items-center space-x-2">
            {(sender.isAdmin || sender.email === 'nguyenducmanh.ovaltine@gmail.com') ? (
              <div className="relative flex-shrink-0">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] z-10 drop-shadow-[0_0_4px_rgba(255,215,0,0.9)] select-none">
                  👑
                </span>
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    padding: '1.5px',
                    background: 'linear-gradient(135deg, #f5c842, #e6a817, #f5d442)',
                    boxShadow: '0 0 10px rgba(255,215,0,0.5)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      padding: '1.5px',
                      background: 'linear-gradient(135deg, #FF2A85, #FF69B4)',
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                      <img
                        src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
                        alt={sender.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  padding: '1.5px',
                  background: 'linear-gradient(135deg, #FF2A85, #FF69B4)',
                  boxShadow: '0 0 8px rgba(255, 42, 133, 0.5)',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                  <img
                    src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
                    alt={sender.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <span className="text-white text-sm font-bold truncate max-w-[160px]">
              {sender.display_name}
            </span>
            <span className="text-white/50 text-xs font-medium">{formatLocketTime(moment.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Message Input Bar + Emoji Reactions at Bottom (Exact Screenshot) */}
      <div className="w-full px-3 pb-2.5 pointer-events-auto flex-shrink-0">
        <div
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {/* Text input placeholder */}
          <span className="flex-1 text-white/40 text-sm select-none">Gửi tin nhắn...</span>
          {/* Emoji reaction buttons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {['❤️', '😂', '💕', '😊'].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoubleTap();
                }}
                className="text-xl active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

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
              className="w-full max-w-xs bg-[#1a0b16] border border-[#FF2A85]/30 rounded-t-3xl sm:rounded-3xl p-4 text-left space-y-2"
            >
              <h4 className="text-white text-xs font-bold text-center pb-2 border-b border-zinc-800">
                Tùy chọn Khoảnh khắc
              </h4>

              <button
                onClick={handleDownload}
                className="w-full p-3 bg-[#261221] hover:bg-[#34182d] rounded-2xl text-white text-xs font-semibold flex items-center space-x-3 transition-all active:scale-98"
              >
                <Download className="w-4 h-4 text-[#FF2A85]" />
                <span>Tải ảnh về máy</span>
              </button>

              {canDeleteMoment && onDeleteMoment && (
                <button
                  onClick={() => {
                    onDeleteMoment(moment.id);
                    setShowOptionsModal(false);
                  }}
                  className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center space-x-3 transition-all active:scale-98"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>{isAdmin && !isMyMoment ? 'Xóa khoảnh khắc này (Quyền Admin 👑)' : 'Xóa khoảnh khắc này'}</span>
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
