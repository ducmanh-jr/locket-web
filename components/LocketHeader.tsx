"use client";

import React from 'react';
import { Profile } from '@/lib/types';
import { Users, LogOut } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface LocketHeaderProps {
  currentUser: Profile;
  onOpenProfile: () => void;
}

export const LocketHeader: React.FC<LocketHeaderProps> = ({
  currentUser,
  onOpenProfile,
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('locket_google_user_v1');
      localStorage.removeItem('locket_device_profile');
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    router.push('/login');
  };

  const avatarSrc =
    currentUser.avatar_url && currentUser.avatar_url.trim() !== ''
      ? currentUser.avatar_url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;

  return (
    <div className="relative w-full z-40 px-4 pt-3 sm:pt-6 pb-2 flex items-center justify-between bg-black flex-shrink-0 border-b border-zinc-900">
      {/* Left: User Profile Avatar & Name */}
      <button
        onClick={onOpenProfile}
        className="flex items-center space-x-2.5 bg-zinc-900/90 hover:bg-zinc-800 p-1.5 pr-3 rounded-full border border-zinc-800 active:scale-95 transition-transform"
        title="Trang cá nhân của bạn"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#FFC700] bg-zinc-900 flex-shrink-0">
          <img
            src={avatarSrc}
            alt={currentUser.display_name}
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-bold text-white max-w-[100px] truncate">
          {currentUser.display_name}
        </span>
      </button>

      {/* Center: Global Room Badge */}
      <div className="flex items-center space-x-1.5 bg-[#FFC700]/15 border border-[#FFC700]/30 px-3.5 py-1.5 rounded-full shadow-md">
        <Users className="w-3.5 h-3.5 text-[#FFC700]" />
        <span className="text-xs font-black tracking-tight text-white">
          Căn phòng <span className="text-[#FFC700]">Locket</span>
        </span>
      </div>

      {/* Right: Logout Button */}
      <button
        onClick={handleLogout}
        className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center border border-zinc-800 active:scale-95 transition-all flex-shrink-0"
        title="Đăng xuất tài khoản Google"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

