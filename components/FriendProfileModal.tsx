"use client";

import React from 'react';
import { Profile, Moment } from '@/lib/types';
import { X, MessageCircle, Grid, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendProfileModalProps {
  friend: Profile;
  friendMoments: Moment[];
  onClose: () => void;
  onOpenChatWithFriend: (friend: Profile) => void;
  onSelectMoment: (moment: Moment) => void;
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  friend,
  friendMoments,
  onClose,
  onOpenChatWithFriend,
  onSelectMoment,
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 100, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 100, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-sm bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-left relative flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white z-20"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Profile Header Info */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-800/80 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#FFC700] mb-3 shadow-locket-glow">
              <img
                src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                alt={friend.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-white text-base font-bold">{friend.display_name}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">@{friend.username}</p>

            {/* Quick Action Button: Message Friend */}
            <button
              onClick={() => {
                onClose();
                onOpenChatWithFriend(friend);
              }}
              className="mt-3 py-2 px-5 bg-[#262626] hover:bg-[#333333] text-[#FFC700] text-xs font-bold rounded-xl border border-zinc-800 flex items-center space-x-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Gửi tin nhắn</span>
            </button>
          </div>

          {/* Friend's Shared Photo Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-[#FFC700]" />
                Khoảnh khắc ({friendMoments.length})
              </h4>
            </div>

            {friendMoments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                Chưa có khoảnh khắc nào từ {friend.display_name}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 px-0.5">
                {friendMoments.map((moment) => (
                  <div
                    key={moment.id}
                    onClick={() => {
                      onClose();
                      onSelectMoment(moment);
                    }}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer active:scale-95 transition-transform"
                  >
                    <img
                      src={moment.media_url}
                      alt={moment.caption || 'Khoảnh khắc'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
