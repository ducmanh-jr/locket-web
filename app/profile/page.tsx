"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_CURRENT_USER, DEMO_SUGGESTED_USERS, addDemoMoment } from '@/lib/demoStore';
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
import { CapturedImage } from '@/lib/camera';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [user, setUser] = useState<Profile>(userProfile || DEMO_CURRENT_USER);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

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

    setUser((prev) => ({ ...prev, display_name: displayName }));
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const handleSendMoment = async (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => {
    const newMoment = {
      id: `moment-${Date.now()}`,
      sender_id: user.id,
      sender: user,
      media_url: image.dataUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };
    addDemoMoment(newMoment);
  };

  if (authLoading) {
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

        {/* Minimalist Authentic Profile Card */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-900 mb-3 shadow-xl">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.display_name}
              className="w-full h-full object-cover"
            />
          </div>

          {!isEditing ? (
            <div className="flex flex-col items-center">
              <h2 className="text-white text-base font-bold flex items-center justify-center gap-1.5">
                {user.display_name}
                <button
                  onClick={() => {
                    setDisplayName(user.display_name);
                    setIsEditing(true);
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-[#FFC700] transition-colors"
                  title="Chỉnh sửa tên"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">@{user.username}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="w-full max-w-xs flex flex-col items-center space-y-2.5">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#262626] border border-[#FFC700] text-white text-xs font-semibold rounded-2xl px-4 py-2.5 text-center focus:outline-none"
              />
              <div className="flex items-center space-x-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#FFC700] text-black text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
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

        {/* Authentic Locket Sleek Settings Menu List */}
        <div className="space-y-2">
          {/* Menu Item 1: Bạn bè & Gợi ý */}
          <button
            onClick={() => router.push('/friends')}
            className="w-full bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 text-[#FFC700] flex items-center justify-center">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bạn bè & Gợi ý kết bạn</h4>
                <p className="text-zinc-500 text-[11px]">Thêm bạn mới & gửi khoảnh khắc</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Menu Item 2: Lịch sử khoảnh khắc */}
          <button
            onClick={() => router.push('/history')}
            className="w-full bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 text-[#FFC700] flex items-center justify-center">
                <Grid className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Lịch sử Khoảnh khắc</h4>
                <p className="text-zinc-500 text-[11px]">Xem lại ảnh đã chụp dạng lưới 3x3</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Menu Item 3: PWA Widget */}
          <div className="w-full bg-[#18181C] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 text-green-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Ứng dụng PWA Widget</h4>
                <p className="text-zinc-500 text-[11px]">Đã bật Thêm vào Màn hình chính</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Sẵn sàng
            </span>
          </div>

          {/* Menu Item 4: Cloud Protection */}
          <div className="w-full bg-[#18181C] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold">Bảo mật & Quyền riêng tư</h4>
                <p className="text-zinc-500 text-[11px]">Mã hóa Row Level Security (RLS)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              An toàn
            </span>
          </div>
        </div>
      </div>

      {/* Logout Button at bottom */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl p-3.5 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold transition-all active:scale-98 mt-6"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất tài khoản</span>
      </button>

      {showCamera && (
        <CameraView
          friends={DEMO_SUGGESTED_USERS.slice(0, 5)}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
