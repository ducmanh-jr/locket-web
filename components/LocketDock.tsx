"use client";

import React, { useState, useRef } from 'react';
import { LayoutGrid, MoreHorizontal, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocketDockProps {
  currentView: 'feed' | 'grid';
  onToggleView: (view: 'feed' | 'grid') => void;
  onOpenCamera: () => void;
  onOpenMenu: () => void;
  onSendDirectMessage?: (text: string) => void;
  onReactEmoji?: (emoji: string) => void;
  isMyMoment?: boolean;
}

export const LocketDock: React.FC<LocketDockProps> = ({
  currentView,
  onToggleView,
  onOpenCamera,
  onOpenMenu,
  onSendDirectMessage,
  onReactEmoji,
  isMyMoment = false,
}) => {
  const [messageText, setMessageText] = useState('');
  const [goldFlashes, setGoldFlashes] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const emojiBarRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    triggerHaptic();
    if (onSendDirectMessage) {
      onSendDirectMessage(messageText);
    }
    setMessageText('');
  };

  const handleQuickEmoji = (emoji: string, index: number) => {
    triggerHaptic();
    if (onReactEmoji) {
      onReactEmoji(emoji);
    }

    const newFlash = { id: Date.now() + index, emoji, x: index };
    setGoldFlashes((prev) => [...prev, newFlash]);
    setTimeout(() => {
      setGoldFlashes((prev) => prev.filter((f) => f.id !== newFlash.id));
    }, 700);
  };

  const REACTION_EMOJIS = ['💛', '😂', '💖', '🔥', '👍', '😍', '⭐', '🏆'];

  return (
    <div className="w-full flex flex-col items-center z-40 px-4 pb-5 pt-1 bg-black space-y-2.5 flex-shrink-0">

      {/* Feed View: Emoji Reaction Bar + Chat Input */}
      {currentView === 'feed' && (
        <div className="w-full max-w-xs flex flex-col items-center space-y-2">

          {/* Dynamic Themed Emoji Reaction Bar */}
          <div
            className="w-full rounded-full px-3 py-1.5 shadow-xl flex items-center justify-around relative overflow-hidden"
            ref={emojiBarRef}
            style={{
              background: 'rgba(24,24,28,0.95)',
              border: '1px solid var(--theme-glow)',
              boxShadow: '0 0 15px var(--theme-bg-tint)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, var(--theme-bg-tint) 50%, transparent 100%)',
              }}
            />

            {REACTION_EMOJIS.map((emoji, i) => {
              const isFlashing = goldFlashes.some((f) => f.x === i);
              return (
                <div key={emoji} className="relative flex items-center justify-center">
                  <button
                    onClick={() => handleQuickEmoji(emoji, i)}
                    className="text-xl p-1 cursor-pointer transition-all duration-150 relative z-10"
                    style={{
                      transform: isFlashing ? 'scale(1.5)' : 'scale(1)',
                      filter: isFlashing
                        ? 'drop-shadow(0 0 8px var(--theme-primary))'
                        : 'none',
                      transition: 'transform 0.15s ease, filter 0.15s ease',
                    }}
                    title={`Thả emoji ${emoji}`}
                  >
                    {emoji}
                  </button>

                  <AnimatePresence>
                    {isFlashing && (
                      <motion.div
                        key={`flash-${emoji}-${i}`}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, var(--theme-glow) 0%, transparent 70%)',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Chat Input Pill */}
          <form
            onSubmit={handleSendMessage}
            className="w-full flex items-center rounded-full px-4 py-2 shadow-lg"
            style={{
              background: '#18181C',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Gửi tin nhắn..."
              className="w-full bg-transparent text-white text-xs font-medium placeholder-zinc-500 focus:outline-none"
            />
            {messageText.trim() && (
              <button type="submit" className="p-1 flex-shrink-0 active:scale-90 transition-transform">
                <Send
                  className="w-4 h-4 stroke-[2.5]"
                  style={{ color: 'var(--theme-primary)' }}
                />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Bottom Main Dock Bar */}
      <div className="w-full max-w-xs flex items-center justify-between px-4 pt-1">

        {/* Left: Grid Icon */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md"
          style={
            currentView === 'grid'
              ? {
                  background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                  boxShadow: '0 0 15px var(--theme-glow)',
                  color: 'black',
                }
              : {
                  background: '#18181C',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                }
          }
          title="Lưới ảnh kỷ niệm"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Giant Themed Locket Camera Shutter Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-20 h-20 rounded-full p-1.5 flex items-center justify-center active:scale-90 transition-all cursor-pointer relative overflow-hidden"
          style={{
            border: '5px solid var(--theme-primary)',
            boxShadow: '0 0 25px var(--theme-glow)',
            background: 'black',
          }}
          title="Chụp ảnh mới"
        >
          <div
            className="w-full h-full rounded-full shadow-inner"
            style={{ background: 'white' }}
          />
        </button>

        {/* Right: 3 Dots Menu Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-md"
          style={{
            background: '#18181C',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
          }}
          title="Tùy chọn & Bạn bè"
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
