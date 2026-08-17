"use client";

import React from 'react';
import { Grid3x3, MessageCircle } from 'lucide-react';
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
          background: 'rgba(25, 20, 15, 0.75)',
          border: '1px solid rgba(229, 184, 73, 0.20)',
          boxShadow: '0 10px 30px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
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
            currentView === 'grid' ? 'text-[#E5B849] bg-[#E5B849]/15' : 'text-white/60 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <Grid3x3 className="w-5 h-5 stroke-[2]" />
        </motion.button>

        {/* Center: Gold Circle Button with Breathing Warm Gold Glow Pulse */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#E5B849] via-[#F59E0B] to-[#D4AF37] text-black flex items-center justify-center shadow-[0_0_22px_rgba(229,184,73,0.7)] cursor-pointer group"
          title="Chụp khoảnh khắc mới"
        >
          <div className="absolute inset-0 rounded-full bg-[#E5B849] animate-ping opacity-30 pointer-events-none" />
          <div className="w-6 h-6 rounded-full bg-white shadow-lg transition-transform group-hover:scale-105" />
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
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E5B849] text-black text-[9px] font-black flex items-center justify-center shadow-md">
            1
          </span>
        </motion.button>
      </div>
    </div>
  );
};
