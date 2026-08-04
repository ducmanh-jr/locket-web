"use client";

import React from 'react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-0 sm:p-6 sm:py-8 font-sans selection:bg-[#FFC700] selection:text-black">
      {/* Desktop Container Wrapper */}
      <div className="relative w-full max-w-md min-h-screen sm:min-h-[840px] sm:h-[840px] bg-[#0E0E10] sm:rounded-[3.25rem] sm:border-[10px] sm:border-[#1F1F24] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        {/* Dynamic Island Notch (Desktop preview only) */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 border border-white/5 shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
          <div className="w-2 h-2 rounded-full bg-blue-900/60" />
        </div>

        {/* Inner Content Area */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
};
