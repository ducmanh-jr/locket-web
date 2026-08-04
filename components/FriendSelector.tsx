"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { Check, Users, X } from 'lucide-react';

interface FriendSelectorProps {
  friends: Profile[];
  selectedFriendIds: string[];
  onToggleFriend: (friendId: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
  onConfirmSend: () => void;
  isSending?: boolean;
}

export const FriendSelector: React.FC<FriendSelectorProps> = ({
  friends,
  selectedFriendIds,
  onToggleFriend,
  onSelectAll,
  onClose,
  onConfirmSend,
  isSending = false,
}) => {
  const isAllSelected = friends.length > 0 && selectedFriendIds.length === friends.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#18181C] border border-[#2C2C34] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C34]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#FFC700]" />
            <h2 className="text-white text-lg font-bold">Gửi đến bạn bè</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Select All Toggle */}
        <div className="flex items-center justify-between py-3 px-1 border-b border-[#2C2C34]/50">
          <span className="text-zinc-400 text-sm font-medium">
            Đã chọn {selectedFriendIds.length} / {friends.length}
          </span>
          <button
            onClick={onSelectAll}
            className="text-xs text-[#FFC700] hover:underline font-semibold"
          >
            {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 my-2 custom-scrollbar">
          {friends.length === 0 ? (
            <p className="text-center text-zinc-500 py-8 text-sm">
              Bạn chưa có bạn bè nào. Thêm bạn bè để bắt đầu chia sẻ!
            </p>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <div
                  key={friend.id}
                  onClick={() => onToggleFriend(friend.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#FFC700]/10 border-[#FFC700]/50'
                      : 'bg-[#222228]/50 border-transparent hover:bg-[#222228]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FFC700] flex items-center justify-center font-bold text-[#0E0E10]">
                          {friend.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold">{friend.display_name}</h4>
                      <p className="text-zinc-400 text-xs">@{friend.username}</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#FFC700] border-[#FFC700] text-[#0E0E10]'
                        : 'border-zinc-600 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={onConfirmSend}
          disabled={selectedFriendIds.length === 0 || isSending}
          className="w-full py-3.5 px-4 bg-[#FFC700] hover:bg-[#FFD633] text-[#0E0E10] font-bold rounded-2xl transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-locket-glow mt-2 flex items-center justify-center space-x-2"
        >
          {isSending ? (
            <span>Đang gửi...</span>
          ) : (
            <span>Gửi khoảnh khắc ({selectedFriendIds.length})</span>
          )}
        </button>
      </div>
    </div>
  );
};
