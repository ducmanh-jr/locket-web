"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { ChevronDown, ChevronUp, MessageCircle, Users, User, Info } from 'lucide-react';

interface LocketHeaderProps {
  currentUser: Profile;
  friends: Profile[];
  selectedFriendFilter: string | null;
  onSelectFilter: (friendId: string | null) => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onViewFriendProfile?: (friend: Profile) => void;
}

export const LocketHeader: React.FC<LocketHeaderProps> = ({
  currentUser,
  friends,
  selectedFriendFilter,
  onSelectFilter,
  onOpenChat,
  onOpenProfile,
  onViewFriendProfile,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedFriend = friends.find((f) => f.id === selectedFriendFilter);
  const labelText = selectedFriend ? selectedFriend.display_name : 'Tất cả bạn bè';

  return (
    <div className="relative w-full z-40 px-4 pt-3 sm:pt-8 pb-1 flex items-center justify-between bg-black flex-shrink-0">
      {/* Left: User Avatar */}
      <button
        onClick={onOpenProfile}
        className="w-9 h-9 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        title="Trang cá nhân của tôi"
      >
        {currentUser.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Center: Filter Pill Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-zinc-800/80 transition-all active:scale-95 shadow-md"
        >
          <span className="max-w-[130px] truncate">{labelText}</span>
          {dropdownOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {/* Dropdown Menu Modal */}
        {dropdownOpen && (
          <div className="absolute top-11 left-1/2 -translate-x-1/2 w-64 bg-[#262626] border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Option: Tất cả bạn bè */}
            <button
              onClick={() => {
                onSelectFilter(null);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                selectedFriendFilter === null
                  ? 'bg-[#FFC700]/20 text-[#FFC700] border border-[#FFC700]/30'
                  : 'text-zinc-300 hover:bg-zinc-700/40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-white">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>Tất cả bạn bè</span>
              </div>
              <span className="text-zinc-400 text-[10px]">&gt;</span>
            </button>

            <div className="my-1 border-t border-zinc-700/50" />

            {/* Individual Friends (dm, system32, admin) */}
            <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedFriendFilter === friend.id
                      ? 'bg-[#FFC700]/20 text-[#FFC700] border border-[#FFC700]/30'
                      : 'text-zinc-300 hover:bg-zinc-700/40'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectFilter(friend.id);
                      setDropdownOpen(false);
                    }}
                    className="flex-1 flex items-center space-x-2.5 text-left"
                  >
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.display_name}
                      className="w-7 h-7 rounded-full object-cover border border-zinc-600 flex-shrink-0"
                    />
                    <span className="truncate max-w-[110px]">{friend.display_name}</span>
                  </button>

                  {/* View Friend Profile Icon */}
                  {onViewFriendProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(false);
                        onViewFriendProfile(friend);
                      }}
                      className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors"
                      title="Xem trang cá nhân bạn bè"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Message / Chat Icon */}
      <button
        onClick={onOpenChat}
        className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333333] text-white flex items-center justify-center border border-zinc-800/80 active:scale-95 transition-all flex-shrink-0"
        title="Tin nhắn"
      >
        <MessageCircle className="w-4.5 h-4.5 stroke-[2]" />
      </button>
    </div>
  );
};
