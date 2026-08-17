"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { Users, ChevronDown, Check, X, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const springSheet = { type: 'spring' as const, stiffness: 340, damping: 30, mass: 0.85 };

export interface MemberFilterOption {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  count: number;
}

interface LocketHeaderProps {
  currentUser: Profile;
  onOpenProfile: () => void;
  onOpenChat?: () => void;
  selectedFilterId: string;
  onSelectFilter: (id: string) => void;
  members: MemberFilterOption[];
}

export const LocketHeader: React.FC<LocketHeaderProps> = ({
  currentUser,
  onOpenProfile,
  onOpenChat,
  selectedFilterId,
  onSelectFilter,
  members,
}) => {
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const avatarSrc =
    currentUser.avatar_url && currentUser.avatar_url.trim() !== ''
      ? currentUser.avatar_url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;

  const friendCount = members.filter((m) => m.id !== 'all').length;
  const currentFilterMember = members.find((m) => m.id === selectedFilterId);
  const pillLabel =
    selectedFilterId === 'all' || !currentFilterMember
      ? `${friendCount} người bạn`
      : currentFilterMember.name;

  return (
    <>
      <div className="relative w-full z-40 px-4 pt-3 sm:pt-4 pb-2 flex items-center justify-between bg-transparent flex-shrink-0">

        {/* Left: Speaker / Announcement Icon Button (Exact Screenshot) */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(20); } catch (e) { }
            }
          }}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
          title="Thông báo Locket"
        >
          <Megaphone className="w-5 h-5 stroke-[2]" />
        </motion.button>

        {/* Center: "👥 18 người bạn" Black Pill Button (Exact Screenshot) */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setShowFilterModal(true)}
          className="flex items-center space-x-2 backdrop-blur-xl text-white font-extrabold px-4 py-1.5 rounded-full shadow-lg cursor-pointer border border-white/10"
          style={{
            background: 'rgba(20, 10, 18, 0.78)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          title="Bấm để xem danh sách bạn bè"
        >
          <Users className="w-4 h-4 text-[#D9266E] stroke-[2.4]" />
          <span className="text-xs font-black text-white tracking-tight truncate max-w-[140px]">{pillLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2.2]" />
        </motion.button>

        {/* Right: Circular User Avatar with Gold Ring + Crown for Admin */}
        <button
          onClick={onOpenProfile}
          className="relative flex-shrink-0 active:scale-95 transition-transform"
          title="Trang cá nhân của bạn"
        >
          {(currentUser.isAdmin || currentUser.email === 'nguyenducmanh.ovaltine@gmail.com') ? (
            <>
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[14px] z-30 drop-shadow-[0_0_6px_rgba(255,215,0,0.9)] select-none">
                👑
              </span>
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 shadow-[0_0_12px_rgba(255,215,0,0.5)]">
                <div className="w-full h-full rounded-full p-[1.5px] bg-gradient-to-tr from-[#D9266E] to-[#BE185D]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                    <img
                      src={avatarSrc}
                      alt={currentUser.display_name}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-9 h-9 rounded-full border-2 border-[#D9266E] p-0.5 bg-zinc-900 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img
                  src={avatarSrc}
                  alt={currentUser.display_name}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;
                  }}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Friend Filter Selector Sheet Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowFilterModal(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 140, scale: 0.90, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 140, scale: 0.90, opacity: 0 }}
              transition={springSheet}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#150a12]/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 text-left space-y-4 shadow-[0_-12px_50px_rgba(0,0,0,0.6)] max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#D9266E]" />
                  <h3 className="text-white text-sm font-extrabold">Xem khoảnh khắc từ</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {/* Option 1: All Friends */}
                <button
                  onClick={() => {
                    onSelectFilter('all');
                    setShowFilterModal(false);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all active:scale-98 border ${selectedFilterId === 'all'
                      ? 'bg-[#D9266E]/20 border-[#D9266E] text-white'
                      : 'bg-[#1c0d17] border-zinc-800 text-zinc-300 hover:bg-[#25121f]'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#D9266E] text-white flex items-center justify-center flex-shrink-0 font-black">
                      <Users className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white text-xs font-extrabold">{friendCount} người bạn</h4>
                      <p className="text-zinc-400 text-[11px]">Xem toàn bộ ảnh trong căn phòng</p>
                    </div>
                  </div>
                  {selectedFilterId === 'all' && (
                    <Check className="w-4 h-4 text-[#D9266E] stroke-[3]" />
                  )}
                </button>

                {/* Option 2+: Individual Members */}
                {members
                  .filter((m) => m.id !== 'all')
                  .map((member) => {
                    const isSelected = selectedFilterId === member.id;
                    const memberAvatar =
                      member.avatar_url && member.avatar_url.trim() !== ''
                        ? member.avatar_url
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`;

                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          onSelectFilter(member.id);
                          setShowFilterModal(false);
                        }}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all active:scale-98 border ${isSelected
                            ? 'bg-[#D9266E]/20 border-[#D9266E] text-white'
                            : 'bg-[#1c0d17] border-zinc-800 text-zinc-300 hover:bg-[#25121f]'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex-shrink-0">
                            <img
                              src={memberAvatar}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <h4 className="text-white text-xs font-bold">{member.name}</h4>
                            <p className="text-zinc-400 text-[11px]">
                              {member.count} khoảnh khắc
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#D9266E] stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
