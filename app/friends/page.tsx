"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { ArrowLeft, Users, Search, Sparkles, Loader2 } from 'lucide-react';
import { fetchGlobalCloudProfiles, CloudProfile } from '@/lib/cloudSync';

export default function FriendsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<CloudProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all real registered users from Supabase profiles table
  useEffect(() => {
    async function loadMembers() {
      try {
        const profiles = await fetchGlobalCloudProfiles();
        setMembers(profiles);
      } catch (e) {
        console.error('Failed to load members:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  // Filter: exclude yourself + apply search query
  const filteredMembers = members
    .filter((m) => m.id !== userProfile?.id)
    .filter(
      (m) =>
        !searchQuery.trim() ||
        m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.username.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-white text-lg font-extrabold">Thành viên Căn phòng</h1>
        </div>

        {/* Search Bar */}
        <div className="relative my-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thành viên theo tên..."
            className="w-full bg-[#18181C] border border-zinc-800 text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#FF2A85]"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        </div>

        {/* You (Current User) Card */}
        {userProfile && (
          <div className="mb-4">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1 mb-2">
              <Users className="w-3.5 h-3.5 text-[#FF2A85]" />
              <span>Tài khoản của bạn</span>
            </div>
            <div className="w-full bg-[#18181C] border border-[#FF2A85]/30 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF2A85] bg-zinc-800 flex-shrink-0">
                  <img
                    src={userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.username}`}
                    alt={userProfile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold">{userProfile.display_name}</h4>
                  <p className="text-zinc-500 text-[11px]">@{userProfile.username}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF2A85]/20 text-[#FF2A85] border border-[#FF2A85]/30">
                {userProfile.isAdmin ? '👑 Admin' : 'Bạn'}
              </span>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2A85]" />
            <span>Thành viên khác trong căn phòng ({filteredMembers.length})</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-[#FFC700] animate-spin mb-3" />
              <p className="text-zinc-400 text-xs">Đang tải danh sách thành viên...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mb-3">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                {searchQuery ? 'Không tìm thấy thành viên' : 'Chưa có thành viên khác'}
              </h3>
              <p className="text-zinc-500 text-xs max-w-[240px]">
                {searchQuery
                  ? 'Thử tìm kiếm với tên khác.'
                  : 'Khi có người đăng nhập Google khác, họ sẽ xuất hiện tại đây tự động.'}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="w-full bg-[#18181C] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex-shrink-0">
                    <img
                      src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold">{member.display_name}</h4>
                    <p className="text-zinc-500 text-[11px]">@{member.username}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Thành viên
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
