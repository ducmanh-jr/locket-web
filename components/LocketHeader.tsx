"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { ChevronDown, ChevronUp, MessageCircle, Users, User } from 'lucide-react';

interface LocketHeaderProps {
  currentUser: Profile;
  friends: Profile[];
  selectedFriendFilter: string | null;
  onSelectFilter: (friendId: string | null) => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
}

export const LocketHeader: React.FC<LocketHeaderProps> = ({
  currentUser,
  friends,
  selectedFriendFilter,
  onSelectFilter,
  onOpenChat,
  onOpenProfile,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedFriend = friends.find((f) => f.id === selectedFriendFilter);
  const labelText = selectedFriend ? selectedFriend.display_name : 'Tất cả bạn bè';

  return (
    <div className="relative w-full z-40 px-4 pt-8 pb-2 flex items-center justify-between bg-black">
      {/* Left: User Avatar */}
      <button
        onClick={onOpenProfile}
        className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center active:scale-95 transition-transform"
        title="Trang cá nhân"
      >
        {currentUser.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-zinc-400" />
        )}
      </button>

      {/* Center: Filter Pill Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold px-4 py-2 rounded-full border border-zinc-800 transition-all active:scale-95 shadow-md"
        >
          <span className="max-w-[120px] truncate">{labelText}</span>
          {dropdownOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {/* Dropdown Menu Modal */}
        {dropdownOpen && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-[#262626] border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Option: Tất cả bạn bè */}
            <button
              onClick={() => {
                onSelectFilter(null);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                selectedFriendFilter === null
                  ? 'bg-zinc-700/80 text-white'
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

            {/* Individual Friends */}
            <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => {
                    onSelectFilter(friend.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedFriendFilter === friend.id
                      ? 'bg-zinc-700/80 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.display_name}
                      className="w-7 h-7 rounded-full object-cover border border-zinc-600"
                    />
                    <span className="truncate max-w-[120px]">{friend.display_name}</span>
                  </div>
                  <span className="text-zinc-400 text-[10px]">&gt;</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Message / Chat Icon */}
      <button
        onClick={onOpenChat}
        className="w-10 h-10 rounded-full bg-[#262626] hover:bg-[#333333] text-white flex items-center justify-center border border-zinc-800 active:scale-95 transition-all"
        title="Tin nhắn"
      >
        <MessageCircle className="w-5 h-5 stroke-[2]" />
      </button>
    </div>
  );
};
