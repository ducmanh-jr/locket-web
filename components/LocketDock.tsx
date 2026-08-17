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
        className="w-[78%] max-w-[300px] rounded-full py-2 px-6 flex items-center justify-between backdrop-blur-2xl"
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
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            currentView === 'grid' ? 'text-[#D9266E] bg-[#D9266E]/15' : 'text-white/60 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <Grid3x3 className="w-5 h-5 stroke-[2]" />
        </motion.button>

        {/* Center: Static Dark Rose Button with Home Icon */}
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D9266E] via-[#BE185D] to-[#9F1239] text-white flex items-center justify-center shadow-[0_4px_18px_rgba(217,38,110,0.5)] cursor-pointer hover:brightness-105 transition-all"
          title="Chụp khoảnh khắc mới"
        >
          <Home className="w-6 h-6 text-white fill-white stroke-[2.2]" />
        </motion.button>

        {/* Right: MessageCircle with badge */}
        <motion.button
          whileTap={{ scale: 0.86 }}
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="relative w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full transition-colors"
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
