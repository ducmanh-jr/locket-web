"use client";

import React from 'react';
import { Grid3x3, Home, MessageCircle } from 'lucide-react';

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

      {/* Translucent Compact Pill Dock */}
      <div
        className="rounded-full py-1.5 px-4 flex items-center justify-around gap-2 backdrop-blur-xl"
        style={{
          background: 'rgba(50, 35, 70, 0.65)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 6px 24px 0 rgba(0,0,0,0.4)',
        }}
      >
        {/* Left: Grid3x3 Icon */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${
            currentView === 'grid' ? 'text-[#FF2A85]' : 'text-white/55 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <Grid3x3 className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Home Pink Circle */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-12 h-12 rounded-full bg-[#FF2A85] text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_18px_rgba(255,42,133,0.55)] cursor-pointer"
          title="Chụp khoảnh khắc mới"
        >
          <Home className="w-5.5 h-5.5 fill-white stroke-[1.5]" />
        </button>

        {/* Right: MessageCircle with badge */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="relative w-10 h-10 flex items-center justify-center text-white/55 hover:text-white active:scale-90 transition-all rounded-full"
          title="Trò chuyện Locket"
        >
          <MessageCircle className="w-5 h-5 stroke-[2]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF2A85] text-white text-[9px] font-black flex items-center justify-center shadow-md">
            1
          </span>
        </button>
      </div>
    </div>
  );
};
