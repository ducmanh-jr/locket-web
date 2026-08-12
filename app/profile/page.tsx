"use client";

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import {
  ArrowLeft,
  Users,
  Grid,
  Smartphone,
  ShieldCheck,
  LogOut,
  Edit3,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading, signOut, updateProfile } = useAuth();
  const [user, setUser] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showWidgetModal, setShowWidgetModal] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [authLoading, userProfile, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user) return;

    if (isSupabaseConfigured() && userProfile) {
      try {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', userProfile.id);
      } catch (e) {
        console.error('Failed to update profile:', e);
      }
    }

    const updatedUser = { ...user, display_name: displayName };
    setUser(updatedUser);
    updateProfile({ display_name: displayName });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#0c050a]">
        <div className="w-10 h-10 rounded-full border-4 border-[#FF2A85] border-t-transparent animate-spin" />
      </div>
    );
  }

  const avatarSrc = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="h-full flex flex-col justify-between bg-[#0c050a] text-white px-4 pt-3 pb-4 select-none overflow-y-auto custom-scrollbar">
      <div>
        <div className="flex items-center space-x-3 pb-4 border-b border-zinc-900">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 rounded-full text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-white text-lg font-extrabold">Cài đặt tài khoản</h1>
        </div>

        {/* Profile Header with Neon Pink Ring */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full p-[2.5px] pink-ring-pulse bg-gradient-to-tr from-[#FF2A85] to-[#FF69B4]">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                <img
                  src={avatarSrc}
                  alt={user.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="flex flex-col items-center">
              <h2 className="text-white text-lg font-black tracking-tight">{user.display_name}</h2>
              <p className="text-zinc-500 text-xs font-semibold mt-0.5">@{user.username}</p>

              <button
                onClick={() => {
                  setDisplayName(user.display_name);
                  setIsEditing(true);
                }}
                className="mt-3 px-4 py-1.5 bg-[#1a0c16] hover:bg-[#281423] border border-[#FF2A85]/30 text-zinc-200 hover:text-white font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all active:scale-95 shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF2A85]" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="w-full max-w-xs flex flex-col items-center space-y-2.5">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-white text-xs font-semibold rounded-2xl px-4 py-2.5 text-center focus:outline-none shadow-inner bg-[#1a0c16] border border-[#FF2A85]"
                placeholder="Nhập tên mới..."
              />
              <div className="flex items-center space-x-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#FF2A85] text-white text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          )}

          {savedSuccess && (
            <p className="text-xs font-semibold mt-2 text-[#FF2A85]">
              ✓ Đã cập nhật tên thành công!
            </p>
          )}
        </div>

        {/* Grouped Settings List */}
        <div className="space-y-2.5">
          <button
            onClick={() => router.push('/friends')}
            className="w-full bg-[#160b13] hover:bg-[#22121d] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FF2A85] flex items-center justify-center border border-zinc-700/50">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bạn bè & Gợi ý kết bạn</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Thêm bạn mới & gửi khoảnh khắc</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={() => router.push('/history')}
            className="w-full bg-[#160b13] hover:bg-[#22121d] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FF2A85] flex items-center justify-center border border-zinc-700/50">
                <Grid className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Lịch sử Khoảnh khắc</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Xem lại bộ sưu tập ảnh 3x3</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={() => setShowWidgetModal(true)}
            className="w-full bg-[#160b13] hover:bg-[#22121d] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FF2A85] flex items-center justify-center border border-zinc-700/50">
                <Smartphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Tiện ích Widget Màn hình</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Hướng dẫn đưa Locket ra Màn hình chính</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <div className="w-full bg-[#160b13] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FF2A85] flex items-center justify-center border border-zinc-700/50">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bảo mật & Quyền riêng tư</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Bảo vệ dữ liệu & quyền riêng tư cá nhân</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 bg-[#FF2A85]/10 border border-[#FF2A85]/30 text-[#FF2A85]">
              <Check className="w-3 h-3" />
              <span>An toàn</span>
            </span>
          </div>

          <PWAInstallBanner forceDisplay={true} />
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold transition-all active:scale-98 mt-6 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất tài khoản</span>
      </button>

      {showWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 bg-[#160b13] border border-[#FF2A85]/40 shadow-[0_0_30px_rgba(255,42,133,0.2)]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-[#FF2A85]/20 border border-[#FF2A85]/40 text-[#FF2A85]">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-white text-base font-bold">Cài đặt Widget Màn hình</h3>
            <p className="text-zinc-400 text-xs text-left leading-relaxed">
              Để xem ảnh bạn bè gửi ngay trên Màn hình chính như ứng dụng Locket thật:
            </p>
            <div className="text-left text-xs text-zinc-300 space-y-2.5 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <p>1. Nhấn nút <b>"Cài đặt LocketWeb"</b> bên ngoài trang cài đặt.</p>
              <p>2. Chọn <b>"Thêm vào Màn hình chính"</b> trên trình duyệt của bạn.</p>
              <p>3. Mở LocketWeb trực tiếp từ màn hình chính để dùng chuẩn full-screen!</p>
            </div>
            <button
              onClick={() => setShowWidgetModal(false)}
              className="w-full py-3 bg-[#FF2A85] text-white font-extrabold text-xs rounded-2xl active:scale-95 transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)]"
            >
              Đã hiểu ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
