"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { ArrowLeft, Users, Search, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { fetchGlobalCloudProfiles, deleteMemberFromGlobalCloud, CloudProfile } from '@/lib/cloudSync';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function FriendsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { deleteMemberMoments } = useMoments();
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<CloudProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberForDeletion, setSelectedMemberForDeletion] = useState<CloudProfile | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ADMIN_EMAIL = 'nguyenducmanh.ovaltine@gmail.com';
  const isAdmin = userProfile?.isAdmin || userProfile?.email?.toLowerCase().trim() === ADMIN_EMAIL;

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

  // Mobile edge swipe-back gesture: return to Home
  useEffect(() => {
    const handlePopState = () => {
      router.push('/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  // Long press handler for Admin
  const startPress = (member: CloudProfile) => {
    if (!isAdmin) return;
    longPressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(40); } catch (e) {}
      }
      setSelectedMemberForDeletion(member);
    }, 500);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMemberForDeletion || !isAdmin) return;
    setIsDeletingMember(true);
    try {
      await deleteMemberFromGlobalCloud(selectedMemberForDeletion.id);
      deleteMemberMoments(selectedMemberForDeletion.id);
      setMembers((prev) => prev.filter((m) => m.id !== selectedMemberForDeletion.id));
      setSelectedMemberForDeletion(null);
    } catch (e) {
      console.error('Failed to delete member:', e);
    } finally {
      setIsDeletingMember(false);
    }
  };

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
            className="w-full bg-[#18181C] border border-zinc-800 text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none"
            style={{ borderColor: 'var(--theme-border)' }}
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        </div>

        {/* You (Current User) Card */}
        {userProfile && (
          <div className="mb-4">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1 mb-2">
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
              <span>Tài khoản của bạn</span>
            </div>
            <div
              className="w-full bg-[#18181C] border rounded-2xl p-3.5 flex items-center justify-between shadow-md"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden border-2 bg-zinc-800 flex-shrink-0"
                  style={{ borderColor: 'var(--theme-primary)' }}
                >
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
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border text-white"
                style={{ background: 'var(--theme-border)', borderColor: 'var(--theme-primary)' }}
              >
                {userProfile.isAdmin ? 'Admin' : 'Bạn'}
              </span>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
              <span>Thành viên khác ({filteredMembers.length})</span>
            </div>
            {isAdmin && (
              <span className="text-[10px] text-zinc-500 font-medium">Nhấn giữ để xóa</span>
            )}
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
                onTouchStart={() => startPress(member)}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onMouseDown={() => startPress(member)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                className="w-full bg-[#18181C] hover:bg-[#222228] border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between transition-all select-none cursor-pointer active:scale-98"
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

      {/* Admin Member Deletion Confirmation Modal */}
      <AnimatePresence>
        {selectedMemberForDeletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedMemberForDeletion(null)}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#160a12]/95 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 text-center space-y-4 shadow-[0_15px_50px_rgba(255,0,0,0.3)]"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center mx-auto shadow-lg">
                <Trash2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-white text-base font-extrabold mb-1">Xóa thành viên căn phòng?</h3>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Bạn có chắc muốn xóa <span className="text-white font-bold">{selectedMemberForDeletion.display_name}</span> (@{selectedMemberForDeletion.username}) không?
                </p>
                <p className="text-red-400/90 text-[11px] mt-1.5 font-semibold">
                  ⚠️ Toàn bộ khoảnh khắc & dữ liệu do thành viên này đăng sẽ bị xóa vĩnh viễn khỏi căn phòng.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForDeletion(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-2xl active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeletingMember}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-[0_0_20px_rgba(225,29,72,0.5)] disabled:opacity-50"
                >
                  {isDeletingMember ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Xóa thành viên</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
