"use client";

import React, { useState } from 'react';
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

      {/* Pill "518 Lịch sử ˅" Button (Exact Screenshot) */}
      <button
        onClick={() => {
          triggerHaptic();
          onToggleView(currentView === 'grid' ? 'feed' : 'grid');
        }}
        className="flex items-center space-x-2 bg-[#22101e]/90 hover:bg-[#2e1628] border border-[#FF2A85]/40 text-white px-4 py-1.5 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        title="Bấm để xem lịch sử khoảnh khắc"
      >
        <div className="w-6 h-6 rounded-lg bg-[#FF2A85]/20 border border-[#FF2A85]/40 flex items-center justify-center text-[10px] font-black text-[#FF2A85]">
          518
        </div>
        <span className="text-xs font-bold text-white tracking-tight">Lịch sử</span>
        <span className="text-xs text-zinc-400">˅</span>
      </button>

      {/* Translucent Floating Bottom Navbar Dock (3 Icons: Grid 🔳, Home 🏠, Chat 💬 with Badge) */}
      <div
        className="w-[82%] max-w-[280px] rounded-full py-2 px-5 flex items-center justify-around shadow-2xl backdrop-blur-xl border"
        style={{
          background: 'rgba(28, 12, 24, 0.75)',
          borderColor: 'rgba(255, 42, 133, 0.25)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 42, 133, 0.15)',
        }}
      >
        {/* Left: Grid Icon (🔳) */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleView(currentView === 'grid' ? 'feed' : 'grid');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            currentView === 'grid'
              ? 'text-[#FF2A85] bg-[#FF2A85]/20 border border-[#FF2A85]/50 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Lưới khoảnh khắc"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Home Icon (🏠) - Active Shutter Button */}
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

        {/* Right: Chat Icon (💬) with Unread Notification Badge '4' */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenMenu();
          }}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all"
          title="Trò chuyện Locket"
        >
          <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          {/* Unread Counter Badge '4' (Exact Screenshot) */}
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#FF2A85] text-white text-[9px] font-black flex items-center justify-center border-2 border-[#1c0c18] shadow-md">
            4
          </span>
        </button>
      </div>
    </div>
  );
};
