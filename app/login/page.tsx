"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Camera, Sparkles, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [magicSent, setMagicSent] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    } else {
      // Demo Mode login fallback
      router.push('/');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (!error) setMagicSent(true);
    } else {
      setTimeout(() => {
        setMagicSent(true);
        setTimeout(() => router.push('/'), 1200);
      }, 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 py-10 bg-[#0E0E10]">
      {/* Brand Logo & Intro */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-[#FFC700] via-[#FFE680] to-[#FFC700] p-1 shadow-locket-glow mb-6 animate-pulse-slow">
          <div className="w-full h-full bg-[#0E0E10] rounded-[1.75rem] flex items-center justify-center text-[#FFC700]">
            <Camera className="w-10 h-10 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-white text-3xl font-black tracking-tight mb-2 flex items-center justify-center gap-1.5">
          Locket<span className="text-[#FFC700]">Web</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
          Ứng dụng chia sẻ ảnh tức thời giữa bạn bè chuẩn 100% như Locket.
        </p>
      </div>

      {/* Auth Actions Form */}
      <div className="w-full space-y-4 my-auto">
        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 bg-[#18181C] hover:bg-[#222228] text-white font-bold text-sm rounded-2xl border border-[#2C2C34] flex items-center justify-center space-x-3 transition-transform active:scale-98 shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <span>Đăng nhập với Google</span>
        </button>

        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-[#2C2C34]" />
          <span className="px-3 text-zinc-500 text-xs uppercase tracking-wider">hoặc Magic Link</span>
          <div className="flex-1 border-t border-[#2C2C34]" />
        </div>

        {/* Email Magic Link */}
        {!magicSent ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                required
                className="w-full bg-[#18181C] border border-[#2C2C34] text-white text-sm rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#FFC700] placeholder-zinc-500"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-4" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#FFC700] hover:bg-[#FFD633] text-[#0E0E10] font-bold text-sm rounded-2xl transition-transform active:scale-98 shadow-locket-glow disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Nhận Magic Link Email'}
            </button>
          </form>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl text-center">
            <p className="text-green-400 text-xs font-semibold">
              ✓ Đã gửi link đăng nhập vào email! Hãy kiểm tra hộp thư.
            </p>
          </div>
        )}

        {/* Quick Demo Mode Login Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 px-4 bg-[#222228] hover:bg-[#2C2C34] text-[#FFC700] font-bold text-xs rounded-2xl border border-[#FFC700]/30 flex items-center justify-center space-x-2 transition-all mt-4"
        >
          <Sparkles className="w-4 h-4" />
          <span>Vào ngay Chế độ Demo (Không cần đăng nhập)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-zinc-500 mt-6">
        <p className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          100% Miễn phí vĩnh viễn & Bảo mật với Supabase RLS
        </p>
      </div>
    </div>
  );
}
