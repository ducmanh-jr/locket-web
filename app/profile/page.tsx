"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_CURRENT_USER, DEMO_SUGGESTED_USERS, addDemoMoment } from '@/lib/demoStore';
import { Profile } from '@/lib/types';
import { User, Edit3, Smartphone, Database, LogOut, Check, Sparkles } from 'lucide-react';
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
    <div className="min-h-full flex flex-col justify-between p-4 pb-28 bg-black">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <User className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Hồ sơ Cá nhân</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-[#18181C] border border-zinc-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#FFC700] mb-4 shadow-locket-glow">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.display_name}
              className="w-full h-full object-cover"
            />
          </div>

          {!isEditing ? (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-white text-lg font-bold flex items-center justify-center gap-1.5">
                {user.display_name}
                <button
                  onClick={() => {
                    setDisplayName(user.display_name);
                    setIsEditing(true);
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-[#FFC700]"
                  title="Đổi tên hiển thị"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">@{user.username}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="w-full flex flex-col items-center space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#222228] border border-[#FFC700] text-white text-sm font-semibold rounded-2xl px-4 py-2.5 text-center focus:outline-none"
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

        {/* Account Details & Status */}
        <div className="space-y-3">
          <div className="bg-[#18181C] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-[#FFC700]" />
              <div>
                <h4 className="text-white text-xs font-bold">Ứng dụng Web / PWA</h4>
                <p className="text-zinc-400 text-[11px]">Thêm vào màn hình chính để dùng như App gốc</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Sẵn sàng
            </span>
          </div>

          <div className="bg-[#18181C] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#FFC700]" />
              <div>
                <h4 className="text-white text-xs font-bold">Supabase Cloud Auth</h4>
                <p className="text-zinc-400 text-[11px]">
                  {isSupabaseConfigured() ? 'Tài khoản Google / Cloud của bạn' : 'Chế độ Demo Tương Tác ($0 Server)'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-[#18181C] border border-red-500/30 hover:border-red-500 rounded-2xl p-4 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold transition-all mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>

      <Navbar onOpenCamera={() => setShowCamera(true)} />

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
