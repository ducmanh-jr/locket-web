"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '@/lib/types';
import {
  ArrowLeft,
  Users,
  Grid,
  LogOut,
  Edit3,
  Check,
  ChevronRight,
  Camera,
  Loader2,
  AlertCircle,
  Palette,
  Sparkles,
  Zap,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { LocketThemePickerModal } from '@/components/LocketThemePickerModal';
import { uploadBlobToPublicUrl } from '@/lib/cloudSync';

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading, signOut, updateProfile } = useAuth();
  const [user, setUser] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
      setDisplayName(userProfile.display_name || '');
      setUsername(userProfile.username || '');
      setAvatarUrl(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [authLoading, userProfile, router]);

  // Mobile edge swipe-back gesture: return to Home
  useEffect(() => {
    const handlePopState = () => {
      router.push('/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  // Handle Avatar Image File Selection
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    setIsUploadingAvatar(true);
    try {
      // 1. Try uploading to public Cloud URL
      const publicUrl = await uploadBlobToPublicUrl(file, `avatar-${userProfile.id}`);
      let finalUrl = publicUrl;

      // 2. Fallback to compressed Data URL
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const maxDim = 250;
              let w = img.width;
              let h = img.height;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              canvas.width = w;
              canvas.height = h;
              ctx?.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        });
      }

      if (finalUrl) {
        setAvatarUrl(finalUrl);
        if (isSupabaseConfigured() && userProfile) {
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: userProfile.id,
                avatar_url: finalUrl,
                username: userProfile.username || `user_${userProfile.id.substring(0, 6)}`,
                display_name: userProfile.display_name || 'Thành viên Locket',
              });
          } catch (e) {}
        }
        updateProfile({ avatar_url: finalUrl });
        if (user) setUser({ ...user, avatar_url: finalUrl });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to process avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user) return;

    setUsernameError(null);
    const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanedUsername) {
      setUsernameError('Vui lòng nhập tên ID/username hợp lệ (chỉ gồm chữ cái, số và dấu gạch dưới)!');
      return;
    }

    setIsSaving(true);

    try {
      // Check if username is taken by someone else in Supabase
      if (isSupabaseConfigured() && userProfile && cleanedUsername !== userProfile.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanedUsername)
          .maybeSingle();

        if (existing && existing.id !== userProfile.id) {
          setUsernameError(`❌ Tên ID @${cleanedUsername} đã có người sử dụng! Vui lòng chọn tên khác.`);
          setIsSaving(false);
          return;
        }
      }

      // Update Supabase profiles table
      if (isSupabaseConfigured() && userProfile) {
        await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            username: cleanedUsername,
            avatar_url: avatarUrl,
          })
          .eq('id', userProfile.id);
      }

      const updatedUser: Profile = {
        ...user,
        display_name: displayName.trim(),
        username: cleanedUsername,
        avatar_url: avatarUrl,
      };

      setUser(updatedUser);
      updateProfile({
        display_name: displayName.trim(),
        username: cleanedUsername,
        avatar_url: avatarUrl,
      });

      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#10091D]">
        <div className="w-10 h-10 rounded-full border-4 border-[#FF2A85] border-t-transparent animate-spin" />
      </div>
    );
  }

  const avatarSrc = avatarUrl || user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="h-full flex flex-col justify-between bg-[#10091D] text-white px-4 pt-3 pb-4 select-none overflow-y-auto custom-scrollbar">
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

        {/* Hidden Avatar File Input */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileSelect}
        />

        {/* Profile Header with Avatar & Neon Pink Ring */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="relative mb-3 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {/* Profile Avatar */}
            <div className="w-24 h-24 rounded-full p-[2.5px] pink-ring-pulse bg-gradient-to-tr from-[#FF2A85] to-[#FF69B4] relative">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 relative">
                <img
                  src={avatarSrc}
                  alt={user.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#FF2A85] animate-spin" />
                  </div>
                )}
              </div>
              {/* Camera Badge Overlay */}
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FF2A85] text-white flex items-center justify-center shadow-lg border-2 border-[#10091D] active:scale-90 transition-transform z-20">
                <Camera className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* End Avatar Header */}

          {!isEditing ? (
            <div className="flex flex-col items-center">
              <h2 className="text-white text-lg font-black tracking-tight">{user.display_name}</h2>
              <p className="text-zinc-400 text-xs font-medium mt-0.5">@{user.username}</p>

              <button
                onClick={() => {
                  setDisplayName(user.display_name);
                  setUsername(user.username);
                  setUsernameError(null);
                  setIsEditing(true);
                }}
                className="mt-3 px-4 py-1.5 bg-[#1a0c16] hover:bg-[#281423] border border-[#FF2A85]/40 text-zinc-200 hover:text-white font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all active:scale-95 shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF2A85]" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="w-full max-w-xs flex flex-col items-center space-y-3">
              {/* Display Name Input */}
              <div className="w-full text-left space-y-1">
                <label className="text-[11px] font-bold text-zinc-400">Tên hiển thị Locket</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-white text-xs font-semibold rounded-2xl px-4 py-2.5 focus:outline-none bg-[#1a0c16] border border-[#FF2A85]"
                  placeholder="Nhập tên mới..."
                />
              </div>

              {/* Username (@handle) Input — FULLY EDITABLE WITH UNIQUE CHECK */}
              <div className="w-full text-left space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                  <span>Tên ID / Username (@handle)</span>
                  <span className="text-[#FF2A85] text-[10px] font-bold">✨ Có thể đổi</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-zinc-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                      setUsernameError(null);
                    }}
                    className="w-full text-white text-xs font-semibold rounded-2xl pl-8 pr-4 py-2.5 focus:outline-none bg-[#1a0c16] border border-[#FF2A85]"
                    placeholder="nguyenducmn..."
                  />
                </div>
              </div>

              {/* Error Alert */}
              {usernameError && (
                <div className="w-full text-left p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              {/* Read-only Gmail Banner */}
              {user.email && (
                <div className="w-full text-left text-[11px] text-zinc-400 bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Gmail liên kết: </span>
                  <span className="text-zinc-300 font-semibold">{user.email}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center space-x-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setUsernameError(null);
                  }}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-[#FF2A85] text-white text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {savedSuccess && (
            <p className="text-xs font-semibold mt-2 text-[#FF2A85]">
              ✓ Đã cập nhật hồ sơ & ID thành công!
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
            onClick={() => setShowThemePicker(true)}
            className="w-full bg-[#160b13] hover:bg-[#22121d] border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98 shadow-sm group"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 shadow-md group-hover:scale-105 transition-transform"
                style={{ background: 'var(--theme-primary)', color: '#FFFFFF' }}
              >
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-xs font-bold flex items-center space-x-1.5">
                  <span>Chủ Đề Giao Diện</span>
                </h4>
                <p className="text-zinc-400 text-[11px] mt-0.5">Rose Velvet • Champagne Gold • Obsidian</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
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

          {/* Network & Offline Cache Card — Apple Settings Style */}
          <div className="w-full bg-[#160b13] border border-white/10 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Zap className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-white text-xs font-bold flex items-center space-x-2">
                    <span>Tốc Độ & Lưu Trữ Ngoại Tuyến</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  </h4>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Tự động nén ảnh 0ms & cache bộ nhớ mượt mà</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                Đã bật
              </span>
            </div>
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

      <LocketThemePickerModal
        isOpen={showThemePicker}
        onClose={() => setShowThemePicker(false)}
      />
    </div>
  );
}
