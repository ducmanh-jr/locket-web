"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Camera, Sparkles, ShieldCheck, ArrowRight, Zap, Image as ImageIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
      } catch (e) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-full h-full flex flex-col justify-between p-6 py-8 bg-[#0A0A0C] text-white select-none relative overflow-hidden">
      {/* Background Yellow Glow Accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FFC700]/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Top Header Logo Branding */}
      <div className="flex items-center justify-between z-10 pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-black flex items-center justify-center font-black text-sm shadow-locket-glow">
            L
          </div>
          <span className="text-white text-base font-black tracking-tight">
            Locket<span className="text-[#FFC700]">Web</span>
          </span>
        </div>

        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
          v2.5 • Official
        </span>
      </div>

      {/* Main Content Area: Brand Hero & Google Login */}
      <div className="flex flex-col items-center text-center my-auto z-10 w-full max-w-sm mx-auto space-y-6">
        {/* Animated Camera Lens Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="relative group"
        >
          <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-[#FFC700] via-[#FFE580] to-[#FFC700] p-1 shadow-[0_0_50px_rgba(255,199,0,0.35)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#121215] rounded-[2.25rem] flex items-center justify-center text-[#FFC700] border border-[#FFC700]/40">
              <Camera className="w-11 h-11 stroke-[2.2]" />
            </div>
          </div>
        </motion.div>

        {/* Headlines */}
        <div className="space-y-2">
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Khoảnh khắc tức thời <br />
            cùng <span className="text-[#FFC700]">Bạn bè</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
            Chụp và chia sẻ khoảnh khắc trực tiếp lên màn hình của bạn bè 100% tự nhiên.
          </p>
        </div>

        {/* Single Primary Action: Google Login Button */}
        <div className="w-full space-y-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm rounded-2xl border-2 border-zinc-700/90 hover:border-[#FFC700]/70 flex items-center justify-between transition-all active:scale-95 shadow-xl group relative overflow-hidden"
          >
            <div className="flex items-center space-x-3">
              {/* Google G Logo SVG */}
              <div className="w-7 h-7 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <span className="text-left font-bold text-sm tracking-wide">
                {loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}
              </span>
            </div>

            <span className="text-[11px] font-extrabold text-[#FFC700] bg-[#FFC700]/15 px-2.5 py-1 rounded-full border border-[#FFC700]/30 group-hover:bg-[#FFC700] group-hover:text-black transition-colors">
              1-Click
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Feature Badges */}
      <div className="z-10 pt-4 border-t border-zinc-900/80">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center bg-[#141417] p-2 rounded-xl border border-zinc-800/60">
            <ShieldCheck className="w-4 h-4 text-green-400 mb-1" />
            <span className="text-[10px] text-zinc-400 font-semibold">Google OAuth</span>
          </div>

          <div className="flex flex-col items-center bg-[#141417] p-2 rounded-xl border border-zinc-800/60">
            <Users className="w-4 h-4 text-[#FFC700] mb-1" />
            <span className="text-[10px] text-zinc-400 font-semibold">Tự động kết bạn</span>
          </div>

          <div className="flex flex-col items-center bg-[#141417] p-2 rounded-xl border border-zinc-800/60">
            <Zap className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-[10px] text-zinc-400 font-semibold">Ảnh vuông 1:1 HD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
