"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_SUGGESTED_USERS, DEMO_CURRENT_USER, addDemoMoment } from '@/lib/demoStore';
import { Profile } from '@/lib/types';
import { UserPlus, Search, Check, X, Users, Sparkles, UserCheck } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export default function FriendsPage() {
  const [friendsList, setFriendsList] = useState<Profile[]>(DEMO_SUGGESTED_USERS.slice(0, 3));
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>(DEMO_SUGGESTED_USERS.slice(3));
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingRequests, setPendingRequests] = useState<Profile[]>([
    {
      id: 'user-quang',
      username: 'quang_huy',
      display_name: 'Quang Huy 🎧',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  ]);

  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Fetch Real Users from Supabase + Merge Demo Suggestions
  useEffect(() => {
    async function loadRealProfiles() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('profiles').select('*');
          if (!error && data && data.length > 0) {
            // Filter out current user
            const realOthers = data.filter((p: Profile) => p.id !== DEMO_CURRENT_USER.id);
            // Combine real profiles with initial suggested users
            const combined = [...realOthers, ...DEMO_SUGGESTED_USERS.slice(3)];
            // Deduplicate by username
            const unique = combined.filter(
              (user, index, self) => index === self.findIndex((u) => u.username === user.username)
            );
            setSuggestedUsers(unique);
          }
        } catch (e) {
          console.error('Error fetching Supabase profiles:', e);
        }
      }
    }
    loadRealProfiles();
  }, []);

  // Send Friend Request handler
  const handleSendFriendRequest = async (targetUser: Profile) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('friendships').insert({
          requester_id: DEMO_CURRENT_USER.id,
          addressee_id: targetUser.id,
          status: 'pending',
        });
      } catch (e) {
        console.error('Supabase friendship error:', e);
      }
    }

    setSentRequestIds((prev) => [...prev, targetUser.id]);
    showToast(`Đã gửi lời mời kết bạn tới ${targetUser.display_name}!`);
  };

  const handleAcceptRequest = (requestUser: Profile) => {
    setPendingRequests((prev) => prev.filter((u) => u.id !== requestUser.id));
    setFriendsList((prev) => [...prev, requestUser]);
    showToast(`Đã chấp nhận lời mời kết bạn từ ${requestUser.display_name}`);
  };

  const handleDeclineRequest = (userId: string) => {
    setPendingRequests((prev) => prev.filter((u) => u.id !== userId));
  };

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
      id: `moment-${Date.now()}`,
      sender_id: DEMO_CURRENT_USER.id,
      sender: DEMO_CURRENT_USER,
      media_url: image.dataUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };
    addDemoMoment(newMoment);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 pb-28 bg-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#FFC700] text-black px-4 py-2 rounded-2xl font-bold text-xs shadow-lg animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Bạn bè & Gợi ý</h1>
        </div>

        {/* Search & Add Friend Form */}
        <form onSubmit={handleAddFriendBySearch} className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Thêm theo @username..."
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

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
              Lời mời kết bạn ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#18181C] border border-[#FFC700]/30 rounded-2xl p-3 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#FFC700]/50"
                    />
                    <div>
                      <h4 className="text-white text-sm font-semibold">{user.display_name}</h4>
                      <p className="text-zinc-400 text-xs">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(user)}
                      className="w-8 h-8 rounded-full bg-[#FFC700] text-black flex items-center justify-center font-bold hover:bg-[#FFD633]"
                      title="Chấp nhận"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(user.id)}
                      className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
                      title="Từ chối"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Friends List */}
        <div className="mb-6">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
            Bạn bè hiện tại ({friendsList.length})
          </h3>
          <div className="space-y-2">
            {friendsList.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#18181C] border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#FFC700]/50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{friend.display_name}</h4>
                    <p className="text-zinc-400 text-xs">@{friend.username}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-[#FFC700] bg-[#FFC700]/10 border border-[#FFC700]/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Đã kết bạn
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Friend Suggestions Section (Gợi ý kết bạn từ người dùng thật & demo) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC700]" />
              Gợi ý kết bạn ({suggestedUsers.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Tự động cập nhật người dùng mới</span>
          </div>

          <div className="space-y-2">
            {suggestedUsers.map((user) => {
              const isSent = sentRequestIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="bg-[#18181C] border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold">{user.display_name}</h4>
                      <p className="text-zinc-400 text-xs">@{user.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendFriendRequest(user)}
                    disabled={isSent}
                    className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center space-x-1 ${
                      isSent
                        ? 'bg-zinc-800 text-zinc-400 cursor-default'
                        : 'bg-[#FFC700] hover:bg-[#FFD633] text-black shadow-locket-glow'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã gửi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Kết bạn</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Navbar onOpenCamera={() => setShowCamera(true)} pendingRequestsCount={pendingRequests.length} />

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
