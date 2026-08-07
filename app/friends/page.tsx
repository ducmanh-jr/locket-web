"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { ArrowLeft, Users, UserPlus, Search, Check, Sparkles } from 'lucide-react';
import { DEMO_FRIENDS } from '@/lib/demoStore';

export default function FriendsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleAddFriend = (id: string) => {
    setAddedIds((prev) => [...prev, id]);
  };

  const filteredFriends = DEMO_FRIENDS.filter(
    (f) =>
      f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col justify-between bg-black text-white px-4 pt-3 pb-4 select-none overflow-y-auto custom-scrollbar">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-zinc-900">
          <button
            onClick={() => router.push('/profile')}
            className="p-1.5 rounded-full text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-white text-lg font-extrabold">Bạn bè & Gợi ý kết bạn</h1>
        </div>

        {/* Search Bar */}
        <div className="relative my-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bạn bè theo tên hoặc username..."
            className="w-full bg-[#18181C] border border-zinc-800 text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#FFC700]"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Friends List */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC700]" />
            <span>Danh sách thành viên căn phòng ({filteredFriends.length})</span>
          </div>

          {filteredFriends.map((friend) => {
            const isAdded = addedIds.includes(friend.id);

            return (
              <div
                key={friend.id}
                className="w-full bg-[#18181C] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex-shrink-0">
                    <img
                      src={friend.avatar_url}
                      alt={friend.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold">{friend.display_name}</h4>
                    <p className="text-zinc-500 text-[11px]">@{friend.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddFriend(friend.id)}
                  disabled={isAdded}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
                    isAdded
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-[#FFC700] hover:bg-[#FFD633] text-black shadow-sm active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Đã bạn</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
