"use client";

import React from 'react';
import { MousePointer, ArrowUpDown, Sparkles, ShieldCheck, Zap, Smartphone, ExternalLink } from 'lucide-react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#0A0A0C] text-zinc-100 flex items-center justify-center p-0 lg:p-8 font-sans selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Glowing Ambient Background Spotlights */}
      <div className="hidden lg:block absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FFC700]/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="hidden lg:block absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main Responsive Grid Layout: Left Decorative Dashboard on PC, Right Phone Frame */}
      <div className="w-full max-w-6xl h-full flex items-center justify-between z-10 px-0 lg:px-6">
        
        {/* Left Side: Premium Locket Web Desktop Branding & Control Suite (PC Only) */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 max-w-md pr-8 text-left z-10">
          
          {/* Locket Hero Logo */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FFC700]/10 border border-[#FFC700]/30 text-[#FFC700] text-xs font-bold shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-[#FFC700]" />
              <span>Locket Web Pro • Genuine Experience</span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Chia sẻ Khoảnh khắc <br />
              <span className="text-[#FFC700] bg-gradient-to-r from-[#FFC700] via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Thời Gian Thực ⚡
              </span>
            </h1>
            
            <p className="text-zinc-400 text-xs leading-relaxed">
              Trải nghiệm ứng dụng Locket trực tiếp trên máy tính và điện thoại. Vuốt trượt mượt mà, đồng bộ ảnh 1:1 sắc nét với bạn bè real-time.
            </p>
          </div>

          {/* System Status Badges */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[#141417]/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">Supabase DB</h4>
                <p className="text-zinc-500 text-[10px]">Realtime Active</p>
              </div>
            </div>

            <div className="bg-[#141417]/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center border border-[#FFC700]/30">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">PWA Widget</h4>
                <p className="text-zinc-500 text-[10px]">Mobile Ready</p>
              </div>
            </div>
          </div>

          {/* Interactive PC Controls Guide */}
          <div className="bg-[#141417]/90 border border-zinc-800 backdrop-blur-md rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC700]" />
              <span>Hướng dẫn Thao tác PC</span>
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start space-x-3 text-xs text-zinc-300">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[#FFC700] flex-shrink-0 mt-0.5">
                  <MousePointer className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white">Giữ chuột trái & Kéo trượt:</span>
                  <p className="text-zinc-400 text-[11px]">Kéo chuột lên/xuống để trượt chuyển ảnh y như lướt tay trên màn hình cảm ứng.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-zinc-300">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[#FFC700] flex-shrink-0 mt-0.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white">Phím mũi tên ↑ / ↓:</span>
                  <p className="text-zinc-400 text-[11px]">Sử dụng phím mũi tên bàn phím hoặc con lăn chuột để chuyển khoảnh khắc.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Share Link Badge */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/80">
            <span>Production URL</span>
            <a
              href="https://locket-web-three.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-[#FFC700] hover:underline flex items-center space-x-1 font-semibold text-[11px]"
            >
              <span>locket-web-three.vercel.app</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Side: Sleek Locket Phone Frame Mockup (Shifted right for PC) */}
        <div className="relative w-full max-w-md h-[100dvh] sm:h-[820px] bg-black sm:rounded-[3.25rem] sm:border-[9px] sm:border-[#1F1F23] sm:shadow-[0_30px_90px_-20px_rgba(255,199,0,0.18),0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between z-10 mx-auto lg:mx-0">
          {/* Dynamic Island Notch */}
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
    </div>
  );
};
