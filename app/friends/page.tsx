"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_FRIENDS, DEMO_CURRENT_USER, addDemoMoment } from '@/lib/demoStore';
import { Profile } from '@/lib/types';
import { UserPlus, Search, Check, X, Users, Sparkles } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';

export default function FriendsPage() {
  const [friendsList, setFriendsList] = useState<Profile[]>(DEMO_FRIENDS);
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

  const handleAcceptRequest = (requestUser: Profile) => {
    setPendingRequests((prev) => prev.filter((u) => u.id !== requestUser.id));
    setFriendsList((prev) => [...prev, requestUser]);
    showToast(`Đã chấp nhận lời mời kết bạn từ ${requestUser.display_name}`);
  };

  const handleDeclineRequest = (userId: string) => {
    setPendingRequests((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddFriend = (e: React.FormEvent) => {
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
    showToast(`Đã gửi yêu cầu kết bạn tới @${newFriend.username}!`);
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
    <div className="min-h-full flex flex-col justify-between p-4 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#FFC700] text-[#0E0E10] px-4 py-2 rounded-2xl font-bold text-xs shadow-lg animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Danh sách Bạn bè</h1>
        </div>

        {/* Search & Add Friend Form */}
        <form onSubmit={handleAddFriend} className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Thêm theo @username..."
            className="w-full bg-[#18181C] border border-[#2C2C34] text-white text-sm rounded-2xl pl-10 pr-24 py-3 focus:outline-none focus:border-[#FFC700] placeholder-zinc-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#FFC700] hover:bg-[#FFD633] text-[#0E0E10] font-bold text-xs rounded-xl flex items-center space-x-1 transition-transform active:scale-95"
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
                      className="w-8 h-8 rounded-full bg-[#FFC700] text-[#0E0E10] flex items-center justify-center font-bold hover:bg-[#FFD633]"
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

        {/* Accepted Friends List */}
        <div>
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
            Bạn bè hiện tại ({friendsList.length})
          </h3>
          <div className="space-y-2">
            {friendsList.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#18181C] border border-[#2C2C34] rounded-2xl p-3.5 flex items-center justify-between hover:border-[#FFC700]/50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img
                      src={friend.avatar_url}
                      alt={friend.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{friend.display_name}</h4>
                    <p className="text-zinc-400 text-xs">@{friend.username}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-[#FFC700] bg-[#FFC700]/10 border border-[#FFC700]/20 px-2.5 py-1 rounded-full">
                  Đã kết bạn
                </span>
              </div>
            ))}
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
