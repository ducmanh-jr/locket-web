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

        {/* Center: Locket Gold Dual-Ring Shutter Home Button */}
        <motion.button
          whileTap={{ scale: 0.90 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="relative group p-[2px] rounded-full bg-gradient-to-tr from-[#FFC700] via-[#FF2A85] to-[#D9266E] shadow-[0_0_20px_rgba(255,42,133,0.5),0_0_25px_rgba(255,199,0,0.3)] transition-all cursor-pointer flex-shrink-0"
          title="Chụp khoảnh khắc mới"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#BE185D] via-[#D9266E] to-[#FF2A85] flex items-center justify-center border border-white/30 relative overflow-hidden">
            {/* Ambient Top Light Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />

            <svg
              className="w-[22px] h-[22px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] relative z-10 transition-transform group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.235 2.686a1.2 1.2 0 0 1 1.53 0l8.1 6.75a1.2 1.2 0 0 1 .435.924V19.5a2.25 2.25 0 0 1-2.25 2.25H15a1.2 1.2 0 0 1-1.2-1.2v-4.5a.75.75 0 0 0-.75-.75h-2.1a.75.75 0 0 0-.75.75v4.5a1.2 1.2 0 0 1-1.2 1.2H6a2.25 2.25 0 0 1-2.25-2.25V10.36a1.2 1.2 0 0 1 .435-.924l8.1-6.75z" />
            </svg>
          </div>
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
