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
  nextMoment?: Moment;
  prevMoment?: Moment;
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
  nextMoment,
  prevMoment,
  nextMomentUrl,
  prevMomentUrl,
  activeReaction,
}) => {
  const touchStartY = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const wheelCooldown = useRef<boolean>(false);
  const [dragYOffset, setDragYOffset] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; x: number; rotation: number }[]
  >([]);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
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
    setHasVideoError(false);
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
      const diffY = touchCurrentY - touchStartY.current;
      if (Math.abs(diffY) > 5) {
        if (e.cancelable) e.preventDefault();
        setDragYOffset(diffY);
        if (Math.abs(diffY) > 15) isDraggingRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (diffY > 60 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -60 && hasPrev && onPrev) {
      setDirection('down');
      onPrev();
    }
    setDragYOffset(0);
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartY.current = e.clientY;
    setIsMouseDown(true);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleMouseMoveWindow = (e: MouseEvent) => {
      if (mouseStartY.current !== null && isMouseDown) {
        const diffY = e.clientY - mouseStartY.current;
        if (Math.abs(diffY) > 5) {
          setDragYOffset(diffY);
          if (Math.abs(diffY) > 15) isDraggingRef.current = true;
        }
      }
    };

    const handleMouseUpWindow = (e: MouseEvent) => {
      if (mouseStartY.current !== null && isMouseDown) {
        const diffY = mouseStartY.current - e.clientY;
        if (diffY > 60 && hasNext && onNext) {
          setDirection('up');
          onNext();
        } else if (diffY < -60 && hasPrev && onPrev) {
          setDirection('down');
          onPrev();
        }
        setDragYOffset(0);
        mouseStartY.current = null;
        setIsMouseDown(false);
      }
    };

    if (isMouseDown) {
      window.addEventListener('mousemove', handleMouseMoveWindow);
      window.addEventListener('mouseup', handleMouseUpWindow);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      window.removeEventListener('mouseup', handleMouseUpWindow);
    };
  }, [isMouseDown, hasNext, hasPrev, onNext, onPrev]);

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
    const now = Date.now();
    const emojisPool = ['💖', '✨', '🔥', '🥰', '💕', '⭐', '❤️'];
    const burst = Array.from({ length: 6 }).map((_, i) => ({
      id: now + i + Math.random(),
      emoji: emojisPool[Math.floor(Math.random() * emojisPool.length)],
      x: Math.floor(Math.random() * 160) - 80,
      rotation: Math.floor(Math.random() * 60) - 30,
    }));

    setFloatingEmojis((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => !burst.some((b) => b.id === item.id)));
    }, 1350);
  };

  const handleDownload = async () => {
    try {
      const isVideoMedia =
        moment.media_type === 'video' ||
        moment.id?.includes('video') ||
        moment.media_url?.startsWith('data:video/') ||
        moment.media_url?.endsWith('.mp4') ||
        moment.media_url?.endsWith('.webm');
      const ext = isVideoMedia
        ? moment.media_url?.includes('.webm') || moment.media_url?.includes('video/webm')
          ? 'webm'
          : 'mp4'
        : 'jpg';

      const response = await fetch(moment.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `locket-${moment.id}.${ext}`;
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
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className={`w-full h-full flex flex-col justify-between items-center select-none relative pt-14 pb-20 ${
        isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Mesmerizing Ambient Glowing Aura Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={moment.id + '_aura'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.55, scale: 1.25 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-[380px] h-[380px] rounded-full blur-[90px] transform-gpu will-change-transform"
            style={{
              backgroundImage: `url(${moment.thumbnail_url || moment.media_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </AnimatePresence>
      </div>

      {/* Centered Photo & Sender Section — Full Card Vertical Slide */}
      <div className="w-full flex flex-col items-center my-auto z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={moment.id}
            initial={{
              y: direction === 'down' ? '-100vh' : '100vh',
              opacity: 0,
              scale: 0.92,
            }}
            animate={{
              y: dragYOffset,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              y: direction === 'down' ? '100vh' : '-100vh',
              opacity: 0,
              scale: 0.92,
            }}
            transition={
              dragYOffset !== 0
                ? { type: 'just' }
                : {
                    type: 'spring',
                    stiffness: 170,
                    damping: 24,
                    mass: 0.95,
                  }
            }
            className="w-full flex flex-col items-center transform-gpu will-change-[transform,opacity] relative"
          >
            {/* Previous Card Live Preview during Drag Down */}
            {dragYOffset > 5 && hasPrev && (prevMoment || prevMomentUrl) && (
              <div className="w-full flex flex-col items-center absolute bottom-[calc(100%+24px)] left-0 right-0 pointer-events-none opacity-90">
                <div className="w-full aspect-square bg-black/40 backdrop-blur-sm flex-shrink-0 relative overflow-hidden rounded-[2.2rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
                  <img
                    src={prevMoment?.thumbnail_url || prevMoment?.media_url || prevMomentUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-[2.2rem]"
                  />
                  {prevMoment?.caption && (
                    <div className="absolute bottom-3 left-4 right-4 flex justify-center">
                      <div className="bg-black/55 backdrop-blur-xl border border-white/15 text-white text-xs font-semibold px-5 py-2 rounded-full truncate">
                        {prevMoment.caption}
                      </div>
                    </div>
                  )}
                </div>
                {prevMoment?.sender && (
                  <div className="w-full flex justify-center mt-2.5">
                    <span className="text-white text-sm font-bold truncate">
                      {prevMoment.sender.display_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Next Card Live Preview during Drag Up */}
            {dragYOffset < -5 && hasNext && (nextMoment || nextMomentUrl) && (
              <div className="w-full flex flex-col items-center absolute top-[calc(100%+24px)] left-0 right-0 pointer-events-none opacity-90">
                <div className="w-full aspect-square bg-black/40 backdrop-blur-sm flex-shrink-0 relative overflow-hidden rounded-[2.2rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
                  <img
                    src={nextMoment?.thumbnail_url || nextMoment?.media_url || nextMomentUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-[2.2rem]"
                  />
                  {nextMoment?.caption && (
                    <div className="absolute bottom-3 left-4 right-4 flex justify-center">
                      <div className="bg-black/55 backdrop-blur-xl border border-white/15 text-white text-xs font-semibold px-5 py-2 rounded-full truncate">
                        {nextMoment.caption}
                      </div>
                    </div>
                  )}
                </div>
                {nextMoment?.sender && (
                  <div className="w-full flex justify-center mt-2.5">
                    <span className="text-white text-sm font-bold truncate">
                      {nextMoment.sender.display_name}
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* 1:1 Square Photo Card Container */}
            <div
              onClick={handleCardClick}
              onDoubleClick={handleDoubleTap}
              className="w-full aspect-square bg-black/30 backdrop-blur-sm flex-shrink-0 relative overflow-hidden rounded-[2.2rem] cursor-pointer border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="w-full h-full absolute inset-0 overflow-hidden rounded-[2.2rem]">
                {isVideo && !hasVideoError ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={getSafeMediaUrl(moment.media_url)}
                    poster={getSafeMediaUrl(moment.thumbnail_url)}
                    autoPlay
                    loop
                    playsInline
                    muted={true}
                    controls={false}
                    preload="auto"
                    onLoadedData={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    onError={() => {
                      console.warn('[LocketFeedCard] Video playback error for moment', moment.id, '- switching to poster thumbnail fallback');
                      setHasVideoError(true);
                    }}
                    className="w-full h-full object-cover rounded-[2.2rem] select-none pointer-events-none"
                  />
                </div>
              ) : (
                <img
                  src={moment.thumbnail_url || moment.media_url}
                  alt={moment.caption || 'Khoảnh khắc Locket'}
                  className="w-full h-full object-cover rounded-[2.2rem] select-none pointer-events-none"
                />
              )}

              {/* Floating 3D Emoji Particle Burst */}
              {floatingEmojis.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{
                    opacity: 1,
                    y: 120,
                    scale: 0.3,
                    x: item.x,
                    rotate: item.rotation,
                    filter: 'blur(0px)',
                  }}
                  animate={{
                    opacity: [1, 1, 0.8, 0],
                    y: [-20, -80, -160],
                    scale: [0.3, 1.6, 2.0],
                    rotate: [item.rotation, item.rotation * 1.5, item.rotation * 3],
                    filter: ['blur(0px)', 'blur(0px)', 'blur(2px)'],
                  }}
                  transition={{
                    duration: 1.3,
                    ease: [0.22, 1, 0.36, 1],
                    times: [0, 0.4, 1],
                  }}
                  className="absolute bottom-10 left-1/2 text-4xl pointer-events-none z-30"
                  style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                >
                  {item.emoji}
                </motion.div>
              ))}

              {/* Music Badge at Top-Left of Photo */}
              {moment.music && (
                <button
                  onClick={toggleAudio}
                  className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md border border-[#D9266E]/40 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-2 z-20 shadow-lg active:scale-95 transition-all max-w-[70%] no-card-click"
                  title="Bật/Tắt nhạc"
                >
                  <div
                    className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-[#D9266E] ${
                      isPlayingAudio ? 'animate-spin' : ''
                    }`}
                  >
                    <img src={moment.music.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-xs truncate">
                    {moment.music.title} • {moment.music.artist}
                  </span>
                  {isPlayingAudio ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#D9266E] flex-shrink-0 animate-pulse" />
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

              {/* Caption Pill Overlay — Refined Glassmorphism */}
              {moment.caption && (
                <div className="absolute bottom-3 left-4 right-4 flex justify-center pointer-events-none z-20">
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-black/55 backdrop-blur-xl border border-white/15 text-white text-xs font-semibold px-5 py-2 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] max-w-[85%] text-center truncate"
                  >
                    {moment.caption}
                  </motion.div>
                </div>
              )}
              </div>
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
                          background: 'linear-gradient(135deg, #D9266E, #BE185D)',
                        }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                          <img
                            src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username || 'user'}`}
                            alt={sender.display_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username || 'user'}`;
                            }}
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
                      background: 'linear-gradient(135deg, #D9266E, #BE185D)',
                      boxShadow: '0 0 8px rgba(217, 38, 110, 0.5)',
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                      <img
                        src={sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username || 'user'}`}
                        alt={sender.display_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username || 'user'}`;
                        }}
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Message Input Bar + Emoji Reactions — Premium Glassmorphism */}
      <div className="w-full px-3 pb-2.5 pointer-events-auto flex-shrink-0 z-10">
        <div
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full backdrop-blur-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <span className="flex-1 text-white/35 text-sm select-none font-medium">Gửi tin nhắn...</span>
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {['❤️', '😂', '💕', '😊'].map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 1.35 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoubleTap();
                }}
                className="text-xl transition-transform hover:scale-110"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Options Modal Sheet — Spring Physics */}
      <AnimatePresence>
        {showOptionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowOptionsModal(false)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 100, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#160a12]/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 text-left space-y-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
            >
              <h4 className="text-white text-xs font-extrabold text-center pb-2.5 border-b border-zinc-800/80">
                Tùy chọn Khoảnh khắc
              </h4>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="w-full p-3.5 bg-[#25121f] hover:bg-[#33182b] rounded-2xl text-white text-xs font-semibold flex items-center space-x-3 transition-colors border border-white/5"
              >
                <Download className="w-4 h-4 text-[#D9266E]" />
                <span>Tải ảnh về máy</span>
              </motion.button>

              {canDeleteMoment && onDeleteMoment && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onDeleteMoment(moment.id);
                    setShowOptionsModal(false);
                  }}
                  className="w-full p-3.5 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center space-x-3 transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>{isAdmin && !isMyMoment ? 'Xóa khoảnh khắc này (Quyền Admin 👑)' : 'Xóa khoảnh khắc này'}</span>
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowOptionsModal(false)}
                className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 text-xs font-bold rounded-2xl text-center transition-colors"
              >
                Đóng
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
