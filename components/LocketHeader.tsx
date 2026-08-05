"use client";

import React from 'react';
import { Profile } from '@/lib/types';
import { Users, ChevronDown } from 'lucide-react';

interface LocketHeaderProps {
  currentUser: Profile;
  onOpenProfile: () => void;
}

export const LocketHeader: React.FC<LocketHeaderProps> = ({
  currentUser,
  onOpenProfile,
}) => {
  const avatarSrc =
    currentUser.avatar_url && currentUser.avatar_url.trim() !== ''
      ? currentUser.avatar_url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;

  return (
    <div className="relative w-full z-40 px-4 pt-3 sm:pt-6 pb-2 flex items-center justify-between bg-black flex-shrink-0 border-b border-zinc-900">
      {/* Left: User Profile Avatar & Name */}
      <button
        onClick={onOpenProfile}
        className="flex items-center space-x-2 bg-zinc-900/90 hover:bg-zinc-800 p-1.5 pr-3 rounded-full border border-zinc-800 active:scale-95 transition-transform"
        title="Trang cá nhân của bạn"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#FFC700] bg-zinc-900 flex-shrink-0">
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

      {/* Center: "Tất cả bạn bè" Pill Button */}
      <div className="flex items-center space-x-1.5 bg-[#FFC700] text-black font-extrabold px-3.5 py-1.5 rounded-full shadow-locket-glow active:scale-95 transition-transform cursor-pointer">
        <Users className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="text-xs tracking-tight">Tất cả bạn bè</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-80 stroke-[2.5]" />
      </div>

      {/* Right Spacer for Layout Balance */}
      <div className="w-9 h-9" />
    </div>
  );
};



