"use client";

import React from 'react';
import { MousePointer, ArrowUpDown } from 'lucide-react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#000000] text-zinc-100 flex items-center justify-center p-0 sm:p-6 font-sans selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Ambient Yellow Locket Glow in Background */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#FFC700]/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Desktop PC Guide Badges on Left & Right Sides */}
      <div className="hidden lg:flex flex-col space-y-4 absolute left-12 top-1/2 -translate-y-1/2 z-10 max-w-[200px]">
        <div className="bg-[#18181C]/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-4 shadow-xl text-left">
          <div className="flex items-center space-x-2 text-[#FFC700] mb-1.5">
            <MousePointer className="w-4 h-4" />
            <span className="text-xs font-bold">Kéo Chuột Trái</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Giữ chuột trái & kéo lên/xuống để lướt ảnh y hệt như thao tác vuốt trên điện thoại!
          </p>
        </div>

        <div className="bg-[#18181C]/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-4 shadow-xl text-left">
          <div className="flex items-center space-x-2 text-[#FFC700] mb-1.5">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs font-bold">Phím Mũi Tên</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Sử dụng phím mũi tên <code className="text-white bg-zinc-800 px-1 py-0.5 rounded">↑</code> / <code className="text-white bg-zinc-800 px-1 py-0.5 rounded">↓</code> hoặc con lăn chuột để chuyển ảnh nhanh.
          </p>
        </div>
      </div>

      {/* Desktop Phone Frame Container */}
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[820px] bg-black sm:rounded-[3.25rem] sm:border-[9px] sm:border-[#1F1F23] sm:shadow-[0_30px_90px_-20px_rgba(255,199,0,0.15),0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between z-10">
        {/* Dynamic Island Notch (Desktop view only) */}
        <div className="hidden sm:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 border border-white/10 shadow-md">
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
