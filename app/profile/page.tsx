"use client";

import React, { useState, useEffect } from 'react';
import { CameraView } from '@/components/CameraView';
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
import { CapturedMedia } from '@/lib/camera';
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
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [showWidgetModal, setShowWidgetModal] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  // Redirect unauthenticated users
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
    // Sync back to AuthProvider and localStorage
    updateProfile({ display_name: displayName });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFC700] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between bg-black text-white px-4 pt-3 pb-4 select-none overflow-y-auto custom-scrollbar">
      {/* Top Header Bar */}
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

        {/* Profile Header with Glowing Golden Ring & Edit Pill */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FFC700] p-0.5 bg-gradient-to-b from-[#FFC700]/30 to-transparent shadow-[0_0_25px_rgba(255,199,0,0.25)] flex items-center justify-center">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.display_name}
                className="w-full h-full object-cover rounded-full"
              />
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
                className="mt-3 px-4 py-1.5 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all active:scale-95 shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FFC700]" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="w-full max-w-xs flex flex-col items-center space-y-2.5">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#262626] border border-[#FFC700] text-white text-xs font-semibold rounded-2xl px-4 py-2.5 text-center focus:outline-none shadow-inner"
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
                  className="flex-1 py-2 bg-[#FFC700] hover:bg-[#FFE066] text-black text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1 active:scale-95 shadow-[0_0_15px_rgba(255,199,0,0.3)] transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          )}

          {savedSuccess && (
            <p className="text-[#FFC700] text-xs font-semibold mt-2 animate-in fade-in">
              ✓ Đã cập nhật tên thành công!
            </p>
          )}
        </div>

        {/* Standardized Grouped Settings List */}
        <div className="space-y-2.5">
          {/* Menu Item 1: Bạn bè & Gợi ý */}
          <button
            onClick={() => router.push('/friends')}
            className="w-full bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FFC700] flex items-center justify-center border border-zinc-700/50">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bạn bè & Gợi ý kết bạn</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Thêm bạn mới & gửi khoảnh khắc</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Menu Item 2: Lịch sử khoảnh khắc */}
          <button
            onClick={() => router.push('/history')}
            className="w-full bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FFC700] flex items-center justify-center border border-zinc-700/50">
                <Grid className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Lịch sử Khoảnh khắc</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Xem lại bộ sưu tập ảnh 3x3</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Menu Item 3: Widget Màn hình chính */}
          <button
            onClick={() => setShowWidgetModal(true)}
            className="w-full bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FFC700] flex items-center justify-center border border-zinc-700/50">
                <Smartphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Tiện ích Widget Màn hình</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Hướng dẫn đưa Locket ra Màn hình chính</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Menu Item 4: Bảo mật & Quyền riêng tư */}
          <div className="w-full bg-[#18181C] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-[#FFC700] flex items-center justify-center border border-zinc-700/50">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bảo mật & Quyền riêng tư</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Bảo vệ dữ liệu & quyền riêng tư cá nhân</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FFC700]/10 text-[#FFC700] border border-[#FFC700]/30 flex items-center space-x-1">
              <Check className="w-3 h-3 text-[#FFC700]" />
              <span>An toàn</span>
            </span>
          </div>

          {/* Menu Item 5: PWA Install Banner */}
          <PWAInstallBanner forceDisplay={true} />
        </div>
      </div>

      {/* Logout Button at Bottom */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold transition-all active:scale-98 mt-6 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất tài khoản</span>
      </button>

      {/* Widget Guide Modal */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC700]/20 border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-white text-base font-bold">Cài đặt Widget Màn hình</h3>
            <p className="text-zinc-400 text-xs text-left leading-relaxed">
              Để xem ảnh bạn bè gửi ngay trên Màn hình chính (Home Screen) như ứng dụng Locket thật:
            </p>
            <div className="text-left text-xs text-zinc-300 space-y-2.5 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <p>1. Nhấn nút <b>"Cài đặt LocketWeb"</b> bên ngoài trang cài đặt.</p>
              <p>2. Chọn <b>"Thêm vào Màn hình chính"</b> trên trình duyệt của bạn.</p>
              <p>3. Mở LocketWeb trực tiếp từ màn hình chính để dùng chuẩn full-screen!</p>
            </div>
            <button
              onClick={() => setShowWidgetModal(false)}
              className="w-full py-3 bg-[#FFC700] hover:bg-[#FFE066] text-black font-extrabold text-xs rounded-2xl active:scale-95 transition-all shadow-[0_0_15px_rgba(255,199,0,0.3)]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
