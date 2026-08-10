"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { MemberFilterOption } from './LocketHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Users, Sparkles, Heart, Smile } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  sender?: Profile;
}

interface LocketChatSheetProps {
  currentUser: Profile;
  friends: MemberFilterOption[];
  onClose: () => void;
}

const LOCAL_CHAT_KEY = 'locket_chat_messages_v1';

function readLocalMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_CHAT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalMessage(msg: ChatMessage): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readLocalMessages();
    const updated = [...existing.filter((m) => m.id !== msg.id), msg].slice(-200);
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export const LocketChatSheet: React.FC<LocketChatSheetProps> = ({
  currentUser,
  friends,
  onClose,
}) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string>('all');
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalMessages());
  const [inputText, setInputText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  // Auto scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages from Cloud API
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?friend_id=${selectedFriendId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            const local = readLocalMessages();
            const merged = [...local, ...data.messages];
            const unique = merged.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
            unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return unique;
          });
        }
      }
    } catch (e) {}
  }, [selectedFriendId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message handler
  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender_id: currentUser.id,
      recipient_id: selectedFriendId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      sender: currentUser,
    };

    // Optimistic UI update
    saveLocalMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setIsSubmitting(false);
    scrollToBottom();

    // Push to Cloud API
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          recipient_id: selectedFriendId,
          content: text.trim(),
          sender_name: currentUser.display_name,
          sender_avatar: currentUser.avatar_url,
        }),
      });
    } catch (e) {}
  };

  // Filter messages for current active conversation
  const activeConversationMessages = messages.filter((m) => {
    if (selectedFriendId === 'all') {
      return m.recipient_id === 'all' || !m.recipient_id;
    }
    return (
      (m.sender_id === currentUser.id && m.recipient_id === selectedFriendId) ||
      (m.sender_id === selectedFriendId && m.recipient_id === currentUser.id)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between max-w-md mx-auto"
    >
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#121215]/90 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FFC700]/20 border border-[#FFC700]/50 flex items-center justify-center text-[#FFC700]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1">
              <span>Trò chuyện Locket</span>
              <span className="text-[10px] bg-[#FFC700] text-black px-1.5 py-0.2 rounded-full font-extrabold">LIVE</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Tương tác trực tiếp với phòng bạn bè</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Friends Selector Pills Bar */}
      <div className="px-3 py-2 border-b border-zinc-900 bg-black flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedFriendId('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
            selectedFriendId === 'all'
              ? 'bg-[#FFC700] text-black shadow-md scale-105'
              : 'bg-[#18181C] text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Phòng chung 👥</span>
        </button>

        {friends.map((friend) => {
          const isSelected = selectedFriendId === friend.id;
          return (
            <button
              key={friend.id}
              onClick={() => setSelectedFriendId(friend.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2 transition-all ${
                isSelected
                  ? 'bg-[#FFC700] text-black shadow-md scale-105'
                  : 'bg-[#18181C] text-zinc-300 border border-zinc-800 hover:text-white'
              }`}
            >
              <div className="w-4 h-4 rounded-full overflow-hidden border border-current">
                <img
                  src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate max-w-[90px]">{friend.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Stream Container */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {activeConversationMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <MessageSquare className="w-10 h-10 text-zinc-700 mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-zinc-400">Chưa có tin nhắn nào</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Gửi lời chào đầu tiên tới {selectedFriendId === 'all' ? 'phòng bạn bè' : selectedFriend?.name}! 👋
            </p>
          </div>
        ) : (
          activeConversationMessages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const senderName = isMe
              ? 'Bạn'
              : msg.sender?.display_name || friends.find((f) => f.id === msg.sender_id)?.name || 'Bạn bè';
            const avatarUrl = isMe
              ? currentUser.avatar_url
              : msg.sender?.avatar_url || friends.find((f) => f.id === msg.sender_id)?.avatar_url;

            const formattedTime = new Date(msg.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0 mb-1">
                    <img
                      src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] text-zinc-400 font-semibold mb-0.5 ml-1">
                      {senderName}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-md ${
                      isMe
                        ? 'bg-[#FFC700] text-black font-semibold rounded-br-none'
                        : 'bg-[#18181C] text-white border border-zinc-800 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1 px-1">{formattedTime}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Emoji Bar */}
      <div className="px-3 py-1.5 bg-[#121215] border-t border-zinc-900 flex items-center justify-around">
        {['❤️', '🔥', '😍', '👍', '😂', '🥰', '☕'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSend(emoji)}
            className="text-lg hover:scale-125 active:scale-95 transition-transform p-1"
            title={`Gửi ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Controls Bar */}
      <div className="p-3 bg-black border-t border-zinc-900 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Nhắn tới ${selectedFriendId === 'all' ? 'mọi người' : selectedFriend?.name || 'bạn bè'}...`}
          maxLength={300}
          className="flex-1 bg-[#18181C] border border-zinc-800 text-white text-xs px-4 py-2.5 rounded-full placeholder-zinc-500 focus:outline-none focus:border-[#FFC700] transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSubmitting}
          className="w-9 h-9 rounded-full bg-[#FFC700] hover:bg-[#e6b300] text-black flex items-center justify-center font-bold active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0 shadow-lg"
          title="Gửi tin nhắn"
        >
          <Send className="w-4 h-4 fill-black" />
        </button>
      </div>
    </motion.div>
  );
};
