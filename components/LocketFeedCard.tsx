"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Moment, Profile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, MoreVertical, Volume2, VolumeX, Share2 } from 'lucide-react';
import { killGlobalAudio, playGlobalAudio } from '@/lib/audioPlayer';
import { getSafeMediaUrl } from '@/lib/media';
import { useRouter } from 'next/navigation';

interface LocketFeedCardProps {
  moment: Moment;
  currentUser: Profile;
  isGuest?: boolean;
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
  onDragChange?: (isDragging: boolean) => void;
}

export const LocketFeedCard: React.FC<LocketFeedCardProps> = ({
  moment,
  currentUser,
  isGuest = false,
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
  onDragChange,
}) => {
  const router = useRouter();
  const touchStartY = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const wheelCooldown = useRef<boolean>(false);
  const [dragYOffset, setDragYOffset] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  useEffect(() => {
    onDragChange?.(dragYOffset !== 0);
  }, [dragYOffset, onDragChange]);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; x: number; rotation: number }[]
  >([]);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



  useEffect(() => {
    if (showOptionsModal) {
      onDragChange?.(true);
    } else if (dragYOffset === 0) {
      onDragChange?.(false);
    }
  }, [showOptionsModal, dragYOffset, onDragChange]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentMomentIdRef = useRef<string>(moment.id);

  const safeMediaUrl = React.useMemo(() => getSafeMediaUrl(moment.media_url), [moment.media_url]);
  const safePosterUrl = React.useMemo(() => getSafeMediaUrl(moment.thumbnail_url), [moment.thumbnail_url]);

  const isVideo =
    moment.media_type === 'video' ||
    moment.id?.includes('video') ||
    moment.media_url?.startsWith('data:video/') ||
    moment.media_url?.endsWith('.mp4') ||
    moment.media_url?.endsWith('.webm');

  currentMomentIdRef.current = moment.id;

  // Background Preloader for Next and Previous Moments to eliminate swipe video lag
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlsToPreload: string[] = [];
    if (nextMoment?.media_url) urlsToPreload.push(getSafeMediaUrl(nextMoment.media_url));
    if (prevMoment?.media_url) urlsToPreload.push(getSafeMediaUrl(prevMoment.media_url));
    if (nextMomentUrl) urlsToPreload.push(nextMomentUrl);
    if (prevMomentUrl) urlsToPreload.push(prevMomentUrl);

    urlsToPreload.forEach((url) => {
      if (!url) return;
      if (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('data:video/')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        document.head.appendChild(link);
        setTimeout(() => {
          try { document.head.removeChild(link); } catch (e) {}
        }, 8000);
      } else {
        const img = new Image();
        img.src = url;
      }
    });
  }, [nextMoment?.media_url, prevMoment?.media_url, nextMomentUrl, prevMomentUrl]);

  useEffect(() => {
    setIsMuted(true);
    setHasVideoError(false);
    setDragYOffset(0);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.load();
      } catch (e) {}
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
    if (isGuest) {
      router.push('/login');
      return;
    }
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
  }, [isGuest, isPlayingAudio, moment.id, moment.music?.preview_url, router]);

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
      if (e.cancelable) e.preventDefault();
      setDragYOffset(diffY);
      if (Math.abs(diffY) > 10) isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    setDragYOffset(0);

    if (diffY > 60 && hasNext && onNext) {
      setDirection('up');
      onNext();
    } else if (diffY < -60 && hasPrev && onPrev) {
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

  useEffect(() => {
    const handleMouseMoveWindow = (e: MouseEvent) => {
      if (mouseStartY.current !== null && isMouseDown) {
        const diffY = e.clientY - mouseStartY.current;
        setDragYOffset(diffY);
        if (Math.abs(diffY) > 10) isDraggingRef.current = true;
      }
    };

    const handleMouseUpWindow = (e: MouseEvent) => {
      if (mouseStartY.current !== null && isMouseDown) {
        const diffY = mouseStartY.current - e.clientY;
        setDragYOffset(0);
        if (diffY > 60 && hasNext && onNext) {
          setDirection('up');
          onNext();
        } else if (diffY < -60 && hasPrev && onPrev) {
          setDirection('down');
          onPrev();
        }
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
    if (isGuest) {
      router.push('/login');
      return;
    }
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

  const handleShareMoment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}/?m=${moment.id}`;
    const shareTitle = `Khoảnh khắc Locket của ${sender.display_name}`;
    const shareText = moment.caption
      ? `Xem khoảnh khắc "${moment.caption}" trên LocketWeb!`
      : `Xem khoảnh khắc Locket của ${sender.display_name}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled native share or not supported, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch (err) {}
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

  const liveScale = dragYOffset !== 0 ? Math.max(0.93, 1 - Math.abs(dragYOffset) / 3000) : 1;
  const previewScale = dragYOffset !== 0 ? Math.min(1, 0.94 + Math.abs(dragYOffset) / 3000) : 0.94;

  if (
    !moment ||
    !moment.id ||
    moment.caption === '__DELETED_MOMENT__' ||
    String(moment.id).startsWith('del_moment_') ||
    String(moment.media_url || '').includes('deleted.invalid')
  ) {
    return null;
  }

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className={`w-full h-full flex flex-col justify-between items-center select-none relative pt-14 pb-24 sm:pb-20 ${
        isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >


      {/* Centered Photo & Sender Section — Seamless Parallel Slide */}
      <div className="w-full flex flex-col items-center my-auto z-10 overflow-visible">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={moment.id}
            initial={{ y: direction === 'down' ? '-100vh' : '100vh', scale: 1, opacity: 1 }}
            animate={{ y: dragYOffset, scale: 1, opacity: 1 }}
            exit={{ y: direction === 'down' ? '100vh' : '-100vh', scale: 1, opacity: 1 }}
            transition={
              dragYOffset !== 0
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 190,
                    damping: 26,
                    mass: 0.9,
                  }
            }
            className="w-full flex flex-col items-center transform-gpu will-change-transform relative"
          >
            {/* Previous Card (Screen 1 Center) during Drag Down — 100vh Spacing & 100% Sharp */}
            {dragYOffset > 2 && hasPrev && (prevMoment || prevMomentUrl) && (
              <div className="w-full flex flex-col items-center absolute bottom-[calc(100vh)] left-0 right-0 pointer-events-none opacity-100 scale-100">
                <div className="w-full aspect-square bg-black/40 flex-shrink-0 relative overflow-hidden rounded-[2.2rem] border border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
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
                  <div className="w-full flex justify-center mt-3">
                    <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-[#D9266E]">
                        <img
                          src={prevMoment.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prevMoment.sender.username || 'user'}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-white text-sm font-bold truncate">
                        {prevMoment.sender.display_name}
                      </span>
                      <span className="text-white/50 text-xs font-medium">{formatLocketTime(prevMoment.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Card (Screen 2 Center) during Drag Up — 100vh Spacing & 100% Sharp */}
            {dragYOffset < -2 && hasNext && (nextMoment || nextMomentUrl) && (
              <div className="w-full flex flex-col items-center absolute top-[calc(100vh)] left-0 right-0 pointer-events-none opacity-100 scale-100">
                <div className="w-full aspect-square bg-black/40 flex-shrink-0 relative overflow-hidden rounded-[2.2rem] border border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
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
                  <div className="w-full flex justify-center mt-3">
                    <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-[#D9266E]">
                        <img
                          src={nextMoment.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nextMoment.sender.username || 'user'}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-white text-sm font-bold truncate">
                        {nextMoment.sender.display_name}
                      </span>
                      <span className="text-white/50 text-xs font-medium">{formatLocketTime(nextMoment.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1:1 Square Photo Card Container */}
            <div
              onClick={handleCardClick}
              onDoubleClick={handleDoubleTap}
              className="w-full aspect-square bg-black/40 flex-shrink-0 relative overflow-hidden rounded-[2.2rem] cursor-pointer border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] transform-gpu"
            >
              <div className="w-full h-full absolute inset-0 overflow-hidden rounded-[2.2rem]">
                {isVideo && !hasVideoError ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={safeMediaUrl}
                    poster={safePosterUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={true}
                    controls={false}
                    preload="auto"
                    onCanPlay={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
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
                  if (isGuest) {
                    router.push('/login');
                    return;
                  }
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

            {/* Sender Avatar, Name & Time — BELOW photo */}
            <div className="w-full flex justify-center mt-3 pointer-events-none z-10">
              <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center space-x-2.5">
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
                <span className="text-white text-sm font-bold truncate max-w-[160px]">
                  {sender.display_name}
                </span>
                <span className="text-white/50 text-xs font-medium">{formatLocketTime(moment.created_at)}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Unified Message Input Bar + Emoji Reactions + Share Icon */}
      <div className="w-full px-3 pb-2.5 pointer-events-auto flex-shrink-0 z-10">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (isGuest) {
              router.push('/login');
            }
          }}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full backdrop-blur-2xl cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <span className="flex-1 text-white/35 text-xs sm:text-sm select-none font-medium truncate">Gửi tin nhắn...</span>
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {['❤️', '😂'].map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 1.35 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isGuest) {
                    router.push('/login');
                    return;
                  }
                  handleDoubleTap();
                }}
                className="text-lg transition-transform hover:scale-110"
              >
                {emoji}
              </motion.button>
            ))}

            {/* Clean Share Icon inside the unified pill */}
            <motion.button
              whileTap={{ scale: 1.25 }}
              onClick={handleShareMoment}
              className="text-white/70 hover:text-white p-1 transition-colors flex items-center justify-center cursor-pointer ml-0.5"
              title="Chia sẻ khoảnh khắc"
            >
              <Share2 className="w-4 h-4 stroke-[2.2] text-white/80 hover:text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Options Modal Sheet — Portaled directly to document.body at z-[999] */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {showOptionsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowOptionsModal(false)}
                className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 pb-8 sm:pb-4"
              >
                <motion.div
                  initial={{ y: 120, scale: 0.92, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 120, scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.8 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xs bg-[#160a12]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 text-left space-y-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative z-[1000]"
                >
                  <h4 className="text-white text-xs font-extrabold text-center pb-2.5 border-b border-zinc-800/80">
                    Tùy chọn Khoảnh khắc
                  </h4>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      setShowOptionsModal(false);
                      handleShareMoment(e);
                    }}
                    className="w-full p-3.5 bg-[#25121f] hover:bg-[#33182b] rounded-2xl text-white text-xs font-semibold flex items-center space-x-3 transition-colors border border-white/5"
                  >
                    <Share2 className="w-4 h-4 text-[#D9266E]" />
                    <span>Chia sẻ khoảnh khắc này</span>
                  </motion.button>

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
                        setShowOptionsModal(false);
                        const targetId = moment.id;
                        setTimeout(() => {
                          onDeleteMoment(targetId);
                        }, 40);
                      }}
                      className="w-full p-3.5 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center space-x-3 transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>{isAdmin && !isMyMoment ? 'Xóa khoảnh khắc này (Quyền Admin)' : 'Xóa khoảnh khắc này'}</span>
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
          </AnimatePresence>,
          document.body
        )}

      {/* Toast Notification for Link Copying */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] bg-[#1a0a14]/95 backdrop-blur-2xl border border-[#D9266E]/40 text-white px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(217,38,110,0.4)] flex items-center space-x-2 text-xs font-bold pointer-events-none"
          >
            <span className="text-[#D9266E] text-sm">✨</span>
            <span>Đã sao chép liên kết khoảnh khắc!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
