"use client";

import React, { useState } from 'react';
import { Reaction } from '@/lib/types';

interface ReactionPickerProps {
  momentId: string;
  reactions?: Reaction[];
  onReact: (emoji: string) => void;
}

const EMOJIS = ['❤️', '🔥', '😂', '😮', '🥺', '👍'];

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  reactions = [],
  onReact,
}) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const handleEmojiClick = (emoji: string) => {
    onReact(emoji);

    // Create floating animation instance
    const id = Date.now() + Math.random();
    const left = Math.random() * 80 + 10; // random X position %
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Group reaction counts
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return (
    <div className="relative w-full">
      {/* Floating Emojis Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -top-24 bottom-0 z-50">
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-4 text-3xl animate-float-emoji pointer-events-none filter drop-shadow-lg"
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Emoji Bar */}
      <div className="flex items-center justify-between bg-[#18181C]/90 backdrop-blur-md border border-[#2C2C34] rounded-full px-3 py-1.5 shadow-lg">
        {EMOJIS.map((emoji) => {
          const count = reactionCounts[emoji] || 0;
          return (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="relative group flex items-center justify-center p-2 rounded-full hover:bg-zinc-800/60 active:scale-125 transition-all duration-150"
              title={`Thả cảm xúc ${emoji}`}
            >
              <span className="text-2xl transform group-hover:scale-110 transition-transform">
                {emoji}
              </span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFC700] text-[#0E0E10] text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
