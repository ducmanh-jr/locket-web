"use client";

import React, { useState } from 'react';
import { LayoutGrid, MoreHorizontal, Smile, Send } from 'lucide-react';

interface LocketDockProps {
  currentView: 'feed' | 'grid' | 'chat';
  onToggleView: (view: 'feed' | 'grid' | 'chat') => void;
  onOpenCamera: () => void;
  onOpenMenu: () => void;
  onSendDirectMessage?: (text: string) => void;
  onReactEmoji?: (emoji: string) => void;
}

export const LocketDock: React.FC<LocketDockProps> = ({
  currentView,
  onToggleView,
  onOpenCamera,
  onOpenMenu,
  onSendDirectMessage,
  onReactEmoji,
}) => {
  const [messageText, setMessageText] = useState('');
  const [showEmojiQuickBar, setShowEmojiQuickBar] = useState(false);

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
    <div className="w-full flex flex-col items-center z-40 px-4 pb-6 pt-2 bg-black space-y-3">
      {/* Quick Message & Emoji Bar (Visible in Feed View - Matching Screenshot 3) */}
      {currentView === 'feed' && (
        <div className="w-full max-w-sm flex items-center space-x-2 bg-[#262626] border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
          <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Gửi tin nhắn..."
              className="w-full bg-transparent text-white text-xs font-medium placeholder-zinc-400 focus:outline-none"
            />
            {messageText.trim() && (
              <button type="submit" className="text-[#FFC700] hover:text-[#FFD633] p-1">
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </form>

          {/* Quick Reaction Emojis matching Screenshot 3: 💛 😂 💖 ☺ */}
          <div className="flex items-center space-x-1.5 border-l border-zinc-700/60 pl-2">
            <button
              onClick={() => handleQuickEmoji('💛')}
              className="text-base hover:scale-125 active:scale-90 transition-transform"
              title="Thả tim vàng Locket"
            >
              💛
            </button>
            <button
              onClick={() => handleQuickEmoji('😂')}
              className="text-base hover:scale-125 active:scale-90 transition-transform"
              title="Thả emoji cười"
            >
              😂
            </button>
            <button
              onClick={() => handleQuickEmoji('💖')}
              className="text-base hover:scale-125 active:scale-90 transition-transform"
              title="Thả tim lấp lánh"
            >
              💖
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setShowEmojiQuickBar(!showEmojiQuickBar);
              }}
              className="w-6 h-6 rounded-full bg-zinc-700/60 text-zinc-300 flex items-center justify-center hover:bg-zinc-600 transition-colors"
              title="Chọn emoji khác"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Quick Emoji Picker */}
      {showEmojiQuickBar && currentView === 'feed' && (
        <div className="w-full max-w-sm flex items-center justify-around bg-[#262626] border border-zinc-800 rounded-2xl p-2 animate-in fade-in duration-150">
          {['🔥', '🥺', '👍', '😍', '🎉', '💩'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                handleQuickEmoji(emoji);
                setShowEmojiQuickBar(false);
              }}
              className="text-2xl hover:scale-125 active:scale-90 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Main Locket Dock Bar */}
      <div className="w-full max-w-sm flex items-center justify-between px-6">
        {/* Left: Grid Icon (Toggle Feed vs 3x3 Grid) */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            currentView === 'grid'
              ? 'bg-[#FFC700] text-black'
              : 'bg-[#262626] text-white hover:bg-[#333333]'
          }`}
          title="Lưới ảnh kỷ niệm"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Giant Locket Camera Shutter Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-20 h-20 rounded-full border-4 border-[#FFC700] p-1.5 flex items-center justify-center shadow-locket-glow active:scale-90 transition-transform"
          title="Chụp ảnh mới"
        >
          <div className="w-full h-full bg-white rounded-full shadow-inner" />
        </button>

        {/* Right: 3 Dots Menu Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="w-12 h-12 rounded-full bg-[#262626] text-white hover:bg-[#333333] flex items-center justify-center active:scale-90 transition-transform"
          title="Tùy chọn & Bạn bè"
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
