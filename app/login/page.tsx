"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Camera, Sparkles, ShieldCheck, Zap, Users, Info, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showChangelogModal, setShowChangelogModal] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          console.error('Google OAuth error:', error);
          setErrorMessage(error.message || 'Đăng nhập bằng Google không thành công');
          setLoading(false);
        }
      } catch (e: any) {
        console.error('Exception during Google OAuth:', e);
        setErrorMessage(e?.message || 'Không thể kết nối đến máy chủ đăng nhập');
        setLoading(false);
      }
    } else {
      setErrorMessage('Dịch vụ đăng nhập chưa sẵn sàng (Chưa cấu hình Supabase)');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full h-full flex flex-col justify-between p-6 pt-6 pb-10 sm:pb-12 bg-[#10091D] text-white select-none relative overflow-y-auto custom-scrollbar">
      {/* Background Ambient Pink Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#FF2A85]/15 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10 pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(255,105,180,0.4)] border border-white/20">
            <img src="/logo.png" alt="Locket Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <span className="text-white text-lg font-black tracking-tight">
            Locket<span className="text-[#FF2A85]">Web</span>
          </span>
        </div>

        {/* Interactive Version Badge */}
        <button
          onClick={() => setShowChangelogModal(true)}
          className="text-[11px] font-bold text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-800/80 flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
          title="Xem thông tin phiên bản"
        >
          <span>v2.5 • Official</span>
          <Info className="w-3.5 h-3.5 text-[#FF2A85]" />
        </button>
      </div>

      {/* Main Hero & Google Sign-In Area */}
      <div className="flex flex-col items-center text-center my-auto z-10 w-full max-w-sm mx-auto space-y-6 pt-4 pb-2">
        {/* Locket Photo Mockup Visual */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="relative"
        >
          {/* Outer Glowing Locket Photo Card Preview */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2.8rem] bg-gradient-to-tr from-[#FF2A85] via-[#FF69B4] to-[#FF2A85] p-1 shadow-[0_0_45px_rgba(255,42,133,0.4)] relative flex items-center justify-center">
            <div className="w-full h-full bg-[#140a17] rounded-[2.5rem] p-2 flex flex-col items-center justify-between border border-[#FF2A85]/30 relative overflow-hidden">
              {/* Top Mini Tag */}
              <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-full z-10">
                <div className="w-2 h-2 rounded-full bg-[#FF2A85] animate-ping" />
                <span className="text-[9px] text-white font-bold">Locket Live</span>
              </div>

              {/* Center Shutter 3D Heart Logo */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg my-auto border border-white/20">
                <img src="/logo.png" alt="Locket 3D Logo" className="w-full h-full object-contain" />
              </div>

              {/* Floating Heart Reaction Badge */}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md border border-white/20 p-1 rounded-full text-xs shadow-md">
                💖
              </div>
            </div>
          </div>
        </motion.div>

        {/* Headline Copywriting */}
        <div className="space-y-2">
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Khoảnh khắc tức thời <br />
            cùng <span className="text-[#FF2A85]">Bạn bè</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
            Chụp & chia sẻ khoảnh khắc trực tiếp lên màn hình của bạn bè 100% tự nhiên.
          </p>
        </div>

        {/* High Contrast Google Sign-In Button */}
        <div className="w-full space-y-3 pt-1">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-5 bg-white hover:bg-zinc-100 text-black font-extrabold text-sm rounded-2xl border-2 border-white flex items-center justify-between transition-all active:scale-95 shadow-[0_4px_25px_rgba(255,42,133,0.3)] group relative overflow-hidden"
          >
            <div className="flex items-center space-x-3">
              {/* Official Multicolored Google G Logo */}
              <div className="w-7 h-7 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm border border-zinc-200">
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

              <span className="text-left font-black text-sm tracking-wide text-black">
                {loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}
              </span>
            </div>

            <span className="text-[11px] font-extrabold text-white bg-[#FF2A85] px-3 py-1 rounded-full shadow-sm">
              1-Chạm
            </span>
          </button>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center animate-in fade-in">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Feature Badges with Lifted Safe Spacing */}
      <div className="z-10 pt-4 border-t border-zinc-900/80 mb-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center bg-[#141417] p-2.5 rounded-2xl border border-zinc-800/70 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-green-400 mb-1" />
            <span className="text-[10px] text-zinc-300 font-semibold">Google OAuth</span>
          </div>

          <div className="flex flex-col items-center bg-[#141417] p-2.5 rounded-2xl border border-zinc-800/70 shadow-sm">
            <Users className="w-4 h-4 text-[#FFC700] mb-1" />
            <span className="text-[10px] text-zinc-300 font-semibold">Kết nối 1-chạm</span>
          </div>

          <div className="flex flex-col items-center bg-[#141417] p-2.5 rounded-2xl border border-zinc-800/70 shadow-sm">
            <Zap className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-[10px] text-zinc-300 font-semibold">Ảnh vuông 1:1 HD</span>
          </div>
        </div>
      </div>

      {/* Interactive Version Changelog Modal */}
      <AnimatePresence>
        {showChangelogModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#FFC700]" />
                  <h3 className="text-white text-base font-extrabold">LocketWeb v2.5 Official</h3>
                </div>
                <button
                  onClick={() => setShowChangelogModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <p className="font-bold text-white">✨ Tính năng nổi bật trong bản cập nhật:</p>
                <ul className="space-y-2 text-zinc-400 list-disc pl-4">
                  <li>Khung ảnh chuẩn iOS Continuous Curve (Squircle bo mượt).</li>
                  <li>Nhắn tin trực tiếp kiểu Facebook Messenger / iMessage.</li>
                  <li>Thêm sticker âm nhạc và hiệu ứng thả tim bay sinh động.</li>
                  <li>Đồng bộ Cloud tức thời qua Supabase.</li>
                </ul>
              </div>

              <button
                onClick={() => setShowChangelogModal(false)}
                className="w-full py-3 bg-[#FFC700] hover:bg-[#FFE066] text-black font-extrabold text-xs rounded-2xl active:scale-95 transition-all shadow-[0_0_15px_rgba(255,199,0,0.3)]"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
