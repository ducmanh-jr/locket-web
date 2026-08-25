"use client";

import React from 'react';
import { Grid3x3, MessageCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocketDockProps {
  currentView: 'feed' | 'grid';
  isGuest?: boolean;
  onToggleView: (view: 'feed' | 'grid') => void;
  onOpenCamera: () => void;
  onOpenMenu: () => void;
  onSendDirectMessage?: (text: string) => void;
  onReactEmoji?: (emoji: string) => void;
  isMyMoment?: boolean;
  isDragging?: boolean;
}

export const LocketDock: React.FC<LocketDockProps> = ({
  currentView,
  isGuest = false,
  onToggleView,
  onOpenCamera,
  onOpenMenu,
  isDragging = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch (e) {}
    }
  };

  return (
    <div className="absolute bottom-2.5 sm:bottom-4 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,0px)] flex flex-col items-center bg-transparent pointer-events-none">
      {/* Translucent Compact Glassmorphism Pill Dock */}
      <div
        className="w-[88%] max-w-[320px] rounded-full py-1.5 px-4 sm:py-2 sm:px-5 flex items-center justify-between backdrop-blur-2xl pointer-events-auto"
        style={{
          background: 'rgba(20, 10, 18, 0.88)',
          border: '1px solid rgba(217, 38, 110, 0.30)',
          boxShadow: '0 12px 35px 0 rgba(0, 0, 0, 0.75), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
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

        {/* Center: Official Locket Camera Shutter Ring Button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-[50px] h-[50px] rounded-full border-[3.5px] border-white p-[3.5px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0 bg-transparent"
          title="Chụp khoảnh khắc mới"
        >
          {/* Inner Solid White Shutter Circle */}
          <div className="w-full h-full rounded-full bg-white transition-all shadow-sm" />
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
