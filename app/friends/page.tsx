"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEFAULT_3_FRIENDS, DEMO_CURRENT_USER, addDemoMoment } from '@/lib/demoStore';
import { Profile } from '@/lib/types';
import { UserPlus, Search, Users, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export default function FriendsPage() {
  const [friendsList, setFriendsList] = useState<Profile[]>(DEFAULT_3_FRIENDS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Fetch All Google/Supabase Registered Profiles -> Everyone is automatically friends!
  useEffect(() => {
    async function loadAllGoogleUsers() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('profiles').select('*');
          if (!error && data && data.length > 0) {
            // Filter out current logged-in user
            const realOthers = data.filter(
              (p: Profile) =>
                p.id !== DEMO_CURRENT_USER.id &&
                p.username !== DEMO_CURRENT_USER.username &&
                p.display_name !== DEMO_CURRENT_USER.display_name
            );
            // Combine real Google users with default friends (dm, system32, admin)
            const combined = [...realOthers, ...DEFAULT_3_FRIENDS].filter(
              (p) =>
                p.id !== DEMO_CURRENT_USER.id &&
                p.username !== DEMO_CURRENT_USER.username &&
                p.display_name !== DEMO_CURRENT_USER.display_name
            );
            // Deduplicate by username
            const unique = combined.filter(
              (user, index, self) => index === self.findIndex((u) => u.username === user.username)
            );
            setFriendsList(unique);
          }
        } catch (e) {
          console.error('Error fetching Supabase profiles:', e);
        }
      }
    }
    loadAllGoogleUsers();
  }, []);

  const handleAddFriendBySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const newFriend: Profile = {
      id: `user-${Date.now()}`,
      username: searchQuery.toLowerCase().replace('@', ''),
      display_name: searchQuery,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchQuery}`,
    };

    setFriendsList((prev) => [...prev, newFriend]);
    setSearchQuery('');
    showToast(`Đã thêm @${newFriend.username} vào danh sách bạn bè!`);
  };

  const handleSendMoment = async (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => {
    const newMoment = {
      id: `m-photo-v5-${Date.now()}`,
      sender_id: DEMO_CURRENT_USER.id,
      sender: DEMO_CURRENT_USER,
      media_url: image.dataUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };
    addDemoMoment(newMoment);
  };

  const filteredDisplayFriends = searchQuery.trim()
    ? friendsList.filter(
        (f) =>
          f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friendsList;

  return (
    <div className="min-h-full flex flex-col justify-between p-4 pb-28 bg-black select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#FFC700] text-black px-4 py-2 rounded-2xl font-bold text-xs shadow-lg animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Users className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Mạng lưới Bạn bè Google</h1>
        </div>

        {/* Auto Friend Notice Banner */}
        <div className="bg-[#18181C] border border-[#FFC700]/30 rounded-2xl p-3.5 mb-5 flex items-center space-x-3 shadow-md">
          <div className="w-9 h-9 rounded-full bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white text-xs font-bold flex items-center gap-1">
              <span>Tự động kết bạn 100%</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-green-500/20 text-green-400">Google Auth</span>
            </h4>
            <p className="text-zinc-400 text-[11px]">
              Tất cả thành viên đăng nhập bằng Google đều tự động trở thành bạn bè trên Locket!
            </p>
          </div>
        </div>

        {/* Search & Add Friend Form */}
        <form onSubmit={handleAddFriendBySearch} className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bạn bè hoặc thêm @username..."
            className="w-full bg-[#18181C] border border-zinc-800 text-white text-sm rounded-2xl pl-10 pr-24 py-3 focus:outline-none focus:border-[#FFC700] placeholder-zinc-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#FFC700] hover:bg-[#FFD633] text-black font-bold text-xs rounded-xl flex items-center space-x-1 transition-transform active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>

        {/* Current Friends List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#FFC700]" />
              Danh sách bạn bè ({filteredDisplayFriends.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Kết nối tức thì</span>
          </div>

          <div className="space-y-2">
            {filteredDisplayFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#18181C] border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#FFC700]/50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.display_name}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{friend.display_name}</h4>
                    <p className="text-zinc-400 text-xs">@{friend.username}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-[#FFC700] bg-[#FFC700]/10 border border-[#FFC700]/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Đã tự động kết bạn
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Navbar onOpenCamera={() => setShowCamera(true)} pendingRequestsCount={0} />

      {showCamera && (
        <CameraView
          friends={friendsList}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
