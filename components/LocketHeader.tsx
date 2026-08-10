"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { Users, ChevronDown, Check, X, Sparkles, MessageSquare } from 'lucide-react';
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
        {/* Left: Pure Circular User Avatar (Official Locket Style) */}
        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FFC700] bg-zinc-900 flex-shrink-0 active:scale-95 transition-transform p-0 shadow-md"
          title="Trang cá nhân của bạn"
        >
          <img
            src={avatarSrc}
            alt={currentUser.display_name}
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username || 'user'}`;
            }}
            className="w-full h-full object-cover"
          />
        </button>

        {/* Center: "Tất cả bạn bè" Black Pill Button (Exact Official Locket Style) */}
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center space-x-2 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-white font-extrabold px-4 py-2 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
          title="Bấm để lọc ảnh theo bạn bè"
        >
          <Users className="w-4 h-4 text-[#FFC700] stroke-[2.2]" />
          <span className="text-xs font-extrabold text-white tracking-tight truncate max-w-[130px]">{pillLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2.2]" />
        </button>

        {/* Right: Official Locket Gold Chat Icon Button */}
        <button
          onClick={onOpenChat}
          className="w-9 h-9 rounded-full bg-[#18181C] hover:bg-[#262626] border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-[0_0_12px_rgba(255,199,0,0.25)] relative group"
          title="Mở Trò chuyện Locket 💬"
        >
          <svg className="w-5 h-5 text-[#FFC700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.03 2 11c0 2.29.94 4.38 2.5 5.96-.33 1.5-.96 2.89-1.87 4.04 2.1-.2 4.1-.9 5.8-2 .01 0 .01 0 .02 0 .5.07 1.02.1 1.55.1 5.523 0 10-4.03 10-9s-4.477-9-10-9z"/>
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FFC700] border-2 border-black animate-pulse shadow-md" />
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
                  <Sparkles className="w-4 h-4 text-[#FFC700]" />
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
                      ? 'bg-[#FFC700]/15 border-[#FFC700] text-white'
                      : 'bg-[#262626] border-zinc-800 text-zinc-300 hover:bg-[#333333]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFC700] text-black flex items-center justify-center flex-shrink-0 font-black">
                      <Users className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white text-xs font-extrabold">Tất cả bạn bè</h4>
                      <p className="text-zinc-400 text-[11px]">Xem toàn bộ ảnh trong căn phòng</p>
                    </div>
                  </div>
                  {selectedFilterId === 'all' && (
                    <Check className="w-4 h-4 text-[#FFC700] stroke-[3]" />
                  )}
                </button>

                {/* Option 2+: Individual Google Members */}
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
                            ? 'bg-[#FFC700]/15 border-[#FFC700] text-white'
                            : 'bg-[#262626] border-zinc-800 text-zinc-300 hover:bg-[#333333]'
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
                          <Check className="w-4 h-4 text-[#FFC700] stroke-[3]" />
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




