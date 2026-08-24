"use client";

import React from 'react';
import { Grid3x3, MessageCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

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
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch (e) {}
    }
  };

  return (
    <div className="w-full flex flex-col items-center z-40 px-4 pb-4 pt-1 space-y-2.5 flex-shrink-0 bg-transparent pointer-events-auto">
      {/* Translucent Compact Glassmorphism Pill Dock */}
      <div
        className="w-[88%] max-w-[320px] rounded-full py-2 px-5 flex items-center justify-between backdrop-blur-2xl"
        style={{
          background: 'rgba(20, 10, 18, 0.78)',
          border: '1px solid rgba(217, 38, 110, 0.20)',
          boxShadow: '0 10px 30px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Left: Grid3x3 Icon */}
        <motion.button
          whileTap={{ scale: 0.86 }}
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
            currentView === 'grid' ? 'text-[#D9266E] bg-[#D9266E]/15' : 'text-white/60 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <Grid3x3 className="w-5 h-5 stroke-[2]" />
        </motion.button>

        {/* Center: Solid Dark Pink Button with Large Solid White House Icon */}
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-12 h-12 rounded-full bg-[#C2185B] text-white flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
          title="Chụp khoảnh khắc mới"
        >
          <svg
            className="w-7 h-7 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.235 2.686a1.2 1.2 0 0 1 1.53 0l8.1 6.75a1.2 1.2 0 0 1 .435.924V19.5a2.25 2.25 0 0 1-2.25 2.25H4.95A2.25 2.25 0 0 1 2.7 19.5V10.36a1.2 1.2 0 0 1 .435-.924l8.1-6.75z" />
          </svg>
        </motion.button>

        {/* Right: MessageCircle with badge */}
        <motion.button
          whileTap={{ scale: 0.86 }}
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="relative w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full transition-colors flex-shrink-0"
          title="Trò chuyện Locket"
        >
          <MessageCircle className="w-5 h-5 stroke-[2]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D9266E] text-white text-[9px] font-black flex items-center justify-center shadow-md">
            1
          </span>
        </motion.button>
      </div>
    </div>
  );
};
