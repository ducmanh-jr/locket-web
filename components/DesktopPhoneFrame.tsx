"use client";

import React from 'react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#000000] text-zinc-100 flex items-center justify-center p-0 sm:p-4 font-sans selection:bg-[#FFC700] selection:text-black overflow-hidden">
      {/* Desktop Container Wrapper */}
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[840px] bg-black sm:rounded-[3.25rem] sm:border-[8px] sm:border-[#1A1A1E] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between">
        {/* Dynamic Island Notch (Desktop preview only) */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 border border-white/5 shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
          <div className="w-2 h-2 rounded-full bg-blue-900/60" />
        </div>

        {/* Inner Content Area */}
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
