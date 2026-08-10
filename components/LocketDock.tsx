"use client";

import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, MoreHorizontal, Smile, Send, Sparkles } from 'lucide-react';

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
  const [showEmojiQuickBar, setShowEmojiQuickBar] = useState(false);
  const emojiBarRef = useRef<HTMLDivElement>(null);

  // Close emoji bar when clicking outside
  useEffect(() => {
    if (!showEmojiQuickBar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiBarRef.current && !emojiBarRef.current.contains(e.target as Node)) {
        setShowEmojiQuickBar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiQuickBar]);

  // Haptic Feedback Helper
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

  const handleQuickEmoji = (emoji: string) => {
    triggerHaptic();
    if (onReactEmoji) {
      onReactEmoji(emoji);
    }
  };

  return (
    <div className="w-full flex flex-col items-center z-40 px-4 pb-5 pt-1 bg-black space-y-2.5 flex-shrink-0">
      {/* Dedicated Floating Emoji Reaction Bar & Input Pill (Feed View) */}
      {currentView === 'feed' && (
        <div className="w-full max-w-xs flex flex-col items-center space-y-2">
          {/* Dedicated 1-Tap Floating Emoji Reaction Bar */}
          <div className="w-full bg-[#18181C]/90 backdrop-blur-md border border-zinc-800/80 rounded-full px-3 py-1.5 shadow-xl flex items-center justify-around">
            {['💛', '😂', '💖', '🔥', '👍', '😍', '☕'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickEmoji(emoji)}
                className="text-xl hover:scale-130 active:scale-90 transition-transform p-1 cursor-pointer"
                title={`Thả emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Standalone Chat Input Pill */}
          <form onSubmit={handleSendMessage} className="w-full flex items-center bg-[#18181C] border border-zinc-800/80 rounded-full px-4 py-2 shadow-lg">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Gửi tin nhắn..."
              className="w-full bg-transparent text-white text-xs font-medium placeholder-zinc-500 focus:outline-none"
            />
            {messageText.trim() && (
              <button type="submit" className="text-[#FFC700] hover:text-[#FFD633] p-1 flex-shrink-0">
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Bottom Main Locket Dock Bar */}
      <div className="w-full max-w-xs flex items-center justify-between px-4 pt-1">
        {/* Left: Grid Icon (Toggle Feed vs 3x3 Grid) */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${
            currentView === 'grid'
              ? 'bg-[#FFC700] text-black font-bold'
              : 'bg-[#18181C] text-white border border-zinc-800/80 hover:bg-zinc-800'
          }`}
          title="Lưới ảnh kỷ niệm"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Giant Golden Locket Camera Shutter Button with Glow */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-20 h-20 rounded-full border-[5px] border-[#FFC700] p-1.5 flex items-center justify-center shadow-[0_0_25px_rgba(255,199,0,0.4)] hover:shadow-[0_0_35px_rgba(255,199,0,0.6)] active:scale-90 transition-all cursor-pointer bg-black"
          title="Chụp ảnh mới"
        >
          <div className="w-full h-full bg-white rounded-full shadow-inner hover:bg-zinc-100 transition-colors" />
        </button>

        {/* Right: 3 Dots Menu Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="w-12 h-12 rounded-full bg-[#18181C] border border-zinc-800/80 text-white hover:bg-zinc-800 flex items-center justify-center active:scale-90 transition-all shadow-md"
          title="Tùy chọn & Bạn bè"
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
