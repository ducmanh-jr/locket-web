"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_CURRENT_USER, DEMO_FRIENDS, addDemoMoment } from '@/lib/demoStore';
import { Profile } from '@/lib/types';
import { User, Edit3, Smartphone, Database, LogOut, Check, Sparkles } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState<Profile>(DEMO_CURRENT_USER);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(user.display_name);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setUser((prev) => ({ ...prev, display_name: displayName }));
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
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

  return (
    <div className="min-h-full flex flex-col justify-between p-4 pb-28">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <User className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Hồ sơ Cá nhân</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-[#18181C] border border-[#2C2C34] rounded-3xl p-6 flex flex-col items-center text-center shadow-xl mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#FFC700] mb-4 shadow-locket-glow">
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-full h-full object-cover"
            />
          </div>

          {!isEditing ? (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-white text-lg font-bold flex items-center justify-center gap-1.5">
                {user.display_name}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-full text-zinc-400 hover:text-[#FFC700]"
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
                  className="flex-1 py-2 bg-[#FFC700] text-[#0E0E10] text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
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

        {/* Account Details & PWA Status */}
        <div className="space-y-3">
          <div className="bg-[#18181C] border border-[#2C2C34] rounded-2xl p-4 flex items-center justify-between">
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

          <div className="bg-[#18181C] border border-[#2C2C34] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#FFC700]" />
              <div>
                <h4 className="text-white text-xs font-bold">Supabase Backend</h4>
                <p className="text-zinc-400 text-[11px]">
                  {isSupabaseConfigured() ? 'Đã kết nối Database Cloud' : 'Chế độ Demo Tương Tác ($0 Server)'}
                </p>
              </div>
            </div>
          </div>

          <a
            href="/login"
            className="w-full bg-[#18181C] border border-red-500/30 hover:border-red-500 rounded-2xl p-4 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold transition-all mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </a>
        </div>
      </div>

      <Navbar onOpenCamera={() => setShowCamera(true)} />

      {showCamera && (
        <CameraView
          friends={DEMO_FRIENDS}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
