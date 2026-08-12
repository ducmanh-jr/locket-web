"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { Users, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MemberFilterOption {
  id: string; // 'all' or user ID / username
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

  const currentFilterMember = members.find((m) => m.id === selectedFilterId);
  const pillLabel =
    selectedFilterId === 'all' || !currentFilterMember
      ? 'Tất cả bạn bè'
      : currentFilterMember.name;

  return (
    <>
      <div className="relative w-full z-40 px-4 pt-3 sm:pt-5 pb-2 flex items-center justify-between bg-black flex-shrink-0 border-b border-zinc-900">

        {/* Left: Gold Ring Avatar with Crown Badge */}
        <button
          onClick={onOpenProfile}
          className="relative w-9 h-9 flex-shrink-0 active:scale-95 transition-transform"
          title="Trang cá nhân của bạn"
        >
          {/* Animated Gold Ring */}
          <div
            className="absolute inset-0 rounded-full gold-ring-pulse"
            style={{
              background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary), var(--theme-primary))',
              padding: '2px',
              borderRadius: '9999px',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
              <img
                src={avatarSrc}
                alt={currentUser.display_name}
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Crown Badge on top of Avatar */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <span className="text-[11px] leading-none select-none" style={{ filter: 'drop-shadow(0 1px 3px rgba(255,165,0,0.8))' }}>
              👑
            </span>
          </div>
        </button>

        {/* Center: "Tất cả bạn bè" Black Pill Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center space-x-2 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-white font-extrabold px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
          title="Bấm để lọc ảnh theo bạn bè"
        >
          <Users className="w-4 h-4 stroke-[2.2]" style={{ color: 'var(--theme-primary)' }} />
          <span className="text-xs font-extrabold text-white tracking-tight truncate max-w-[130px]">{pillLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2.2]" />
        </button>

        {/* Right: Locket Gold Chat Icon Button */}
        <button
          onClick={onOpenChat}
          className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all gold-pulse-glow overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)',
          }}
          title="Mở Trò chuyện Locket Gold 💬"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 gold-shimmer-overlay rounded-full" />

          {/* Chat bubble icon */}
          <svg className="w-4.5 h-4.5 text-black relative z-10 drop-shadow" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
            <path d="M12 2C6.477 2 2 6.03 2 11c0 2.29.94 4.38 2.5 5.96-.33 1.5-.96 2.89-1.87 4.04 2.1-.2 4.1-.9 5.8-2 .01 0 .01 0 .02 0 .5.07 1.02.1 1.55.1 5.523 0 10-4.03 10-9s-4.477-9-10-9z"/>
          </svg>

          {/* GOLD label badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 text-[7px] font-black leading-none px-1 py-0.5 rounded-sm bg-black border border-white/20 z-20"
            style={{ color: 'var(--theme-primary)', letterSpacing: '0.03em' }}
          >
            GOLD
          </div>
        </button>
      </div>

      {/* Friend Filter Selector Sheet Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilterModal(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 120, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 120, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-left space-y-4 shadow-2xl max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">✨</span>
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
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all active:scale-98 border ${
                    selectedFilterId === 'all'
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-[#262626] border-zinc-800 text-zinc-300 hover:bg-[#333333]'
                  }`}
                  style={selectedFilterId === 'all' ? { borderColor: 'var(--theme-primary)' } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-black"
                      style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
                    >
                      <Users className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white text-xs font-extrabold">Tất cả bạn bè</h4>
                      <p className="text-zinc-400 text-[11px]">Xem toàn bộ ảnh trong căn phòng</p>
                    </div>
                  </div>
                  {selectedFilterId === 'all' && (
                    <Check className="w-4 h-4 stroke-[3]" style={{ color: 'var(--theme-primary)' }} />
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
                        className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all active:scale-98 border ${
                          isSelected
                            ? 'bg-zinc-800 text-white'
                            : 'bg-[#262626] border-zinc-800 text-zinc-300 hover:bg-[#333333]'
                        }`}
                        style={isSelected ? { borderColor: 'var(--theme-primary)' } : {}}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-700"
                            style={isSelected ? { borderColor: 'var(--theme-primary)' } : {}}
                          >
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
                          <Check className="w-4 h-4 stroke-[3]" style={{ color: 'var(--theme-primary)' }} />
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
