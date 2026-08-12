"use client";

import React from 'react';
import { LayoutGrid, Home, MessageSquare } from 'lucide-react';

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
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
  };

  return (
    <div className="w-full flex flex-col items-center z-40 px-4 pb-4 pt-1 space-y-3 flex-shrink-0 bg-transparent pointer-events-auto">

      {/* Pill "Lịch sử ~" - Simple style (Exact Screenshot) */}
      <button
        onClick={() => {
          triggerHaptic();
          onToggleView(currentView === 'grid' ? 'feed' : 'grid');
        }}
        className="flex items-center space-x-2 text-white/80 hover:text-white px-3 py-1 rounded-full active:scale-95 transition-all cursor-pointer"
        title="Bấm để xem lịch sử khoảnh khắc"
      >
        {/* Small avatar thumbnail */}
        <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=locket"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-semibold tracking-tight">Lịch sử</span>
        <span className="text-sm text-white/60">~</span>
      </button>

      {/* Translucent Floating Bottom Navbar Dock (Gray muted - Exact Screenshot) */}
      <div
        className="w-[82%] max-w-[280px] rounded-full py-2 px-5 flex items-center justify-around shadow-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(60, 40, 80, 0.55)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Left: Grid Icon */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            currentView === 'grid'
              ? 'text-[#FF2A85]'
              : 'text-white/60 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Home Icon - Active Pink Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenCamera();
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2A85] to-[#FF69B4] text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_20px_rgba(255,42,133,0.6)] cursor-pointer"
          title="Chụp khoảnh khắc mới"
        >
          <Home className="w-6 h-6 fill-white stroke-[1.5]" />
        </button>

        {/* Right: Chat Icon with Unread Badge */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
          title="Trò chuyện Locket"
        >
          <MessageSquare className="w-5 h-5 stroke-[2]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF2A85] text-white text-[9px] font-black flex items-center justify-center shadow-md">
            1
          </span>
        </button>
      </div>
    </div>
  );
};
