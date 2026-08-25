"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { MemberFilterOption } from './LocketHeader';
import { motion } from 'framer-motion';
import {
  X,
  Send,
  ChevronLeft,
  Phone,
  Video,
  ThumbsUp,
  Search,
  Users,
} from 'lucide-react';

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
    const updated = [...existing.filter((m) => m.id !== msg.id), msg].slice(-300);
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export const LocketChatSheet: React.FC<LocketChatSheetProps> = ({
  currentUser,
  friends,
  onClose,
}) => {
  const [activeView, setActiveView] = useState<'inbox' | 'thread'>('inbox');
  const [selectedFriendId, setSelectedFriendId] = useState<string>('all');
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalMessages());
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Sanitize & Deduplicate Friends List
  const sanitizedFriends = React.useMemo(() => {
    const isSystemUser = (id?: string, name?: string) => {
      const checkStr = `${id || ''} ${name || ''}`.toLowerCase();
      return (
        checkStr.includes('system32') ||
        checkStr.includes('admin') ||
        checkStr.trim() === 'dm' ||
        checkStr.includes('user-system32') ||
        checkStr.includes('user-admin') ||
        checkStr.includes('user-dm')
      );
    };

    const list = friends.filter((f) => {
      if (!f.id) return false;
      if (f.id === currentUser.id) return false;
      if (isSystemUser(f.id, f.name)) return false;
      return true;
    });

    const uniqueMap = new Map<string, MemberFilterOption>();
    for (const f of list) {
      if (!uniqueMap.has(f.id)) {
        uniqueMap.set(f.id, f);
      }
    }
    return Array.from(uniqueMap.values());
  }, [friends, currentUser.id]);

  // Search Filter
  const filteredFriends = React.useMemo(() => {
    if (!searchQuery.trim()) return sanitizedFriends;
    return sanitizedFriends.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sanitizedFriends, searchQuery]);

  const selectedFriend = sanitizedFriends.find((f) => f.id === selectedFriendId);

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
    if (activeView === 'thread') {
      scrollToBottom();
    }
  }, [messages, activeView, scrollToBottom]);

  // Open a specific conversation thread
  const openThread = (friendId: string) => {
    setSelectedFriendId(friendId);
    setActiveView('thread');
  };

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

    saveLocalMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setIsSubmitting(false);
    scrollToBottom();

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

  // Get last message for a specific thread
  const getLastMessage = (friendId: string) => {
    const threadMsgs = messages.filter((m) => {
      if (friendId === 'all') return m.recipient_id === 'all' || !m.recipient_id;
      return (
        (m.sender_id === currentUser.id && m.recipient_id === friendId) ||
        (m.sender_id === friendId && m.recipient_id === currentUser.id)
      );
    });
    if (threadMsgs.length === 0) return null;
    return threadMsgs[threadMsgs.length - 1];
  };

  const formatChatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 z-50 bg-[#121212] text-white flex flex-col justify-between overflow-hidden rounded-[2.5rem] select-none font-sans"
    >
      {activeView === 'inbox' ? (
        /* ==================== MINIMALIST INBOX VIEW ==================== */
        <div className="flex-1 flex flex-col h-full bg-[#121212]">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#2C2C2E]/40">
            <div className="flex items-center space-x-3">
              <div className="w-[38px] h-[38px] rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
                  }
                  alt={currentUser.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Đoạn chat</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-center transition-all active:scale-95"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2.5">
            <div className="h-9 px-3 flex items-center space-x-2 bg-[#2C2C2E] rounded-xl border border-white/5 focus-within:border-[#D9266E]/50 text-zinc-400 transition-colors">
              <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full font-normal"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active / Online Friends Horizontal Row */}
          <div className="px-4 py-2 flex items-center space-x-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-[#2C2C2E]/40">
            <button
              onClick={() => openThread('all')}
              className="flex flex-col items-center space-y-1.5 flex-shrink-0"
            >
              <div className="relative w-[50px] h-[50px] rounded-full bg-[#2C2C2E] p-0.5 flex items-center justify-center text-[#D9266E] border border-white/10 active:scale-95 transition-transform">
                <Users className="w-5 h-5 text-[#D9266E]" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
              </div>
              <span className="text-[11px] text-zinc-300 font-normal truncate max-w-[56px]">Phòng chung</span>
            </button>

            {sanitizedFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => openThread(friend.id)}
                className="flex flex-col items-center space-y-1.5 flex-shrink-0"
              >
                <div className="relative w-[50px] h-[50px] rounded-full bg-zinc-800 p-0.5 active:scale-95 transition-transform border border-white/5">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt={friend.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
                </div>
                <span className="text-[11px] text-zinc-300 font-normal truncate max-w-[56px]">
                  {friend.name.trim().split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Minimalist Chat List */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Conversation 1: All Room Chat */}
            {(() => {
              const lastMsg = getLastMessage('all');
              return (
                <button
                  onClick={() => openThread('all')}
                  className="w-full px-4 py-3 flex items-center justify-between border-b border-[#2C2C2E]/40 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-[50px] h-[50px] rounded-full bg-[#2C2C2E] flex-shrink-0 border border-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#D9266E]" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">Phòng trò chuyện chung</h4>
                      <p className="text-xs text-[#8E8E93] font-normal truncate mt-0.5">
                        {lastMsg
                          ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                          : 'Chưa có tin nhắn'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[11px] text-zinc-500 font-medium flex-shrink-0 ml-3">
                      {formatChatTime(lastMsg.created_at)}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Individual Friend Chats */}
            {filteredFriends.map((friend) => {
              const lastMsg = getLastMessage(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => openThread(friend.id)}
                  className="w-full px-4 py-3 flex items-center justify-between border-b border-[#2C2C2E]/40 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-[50px] h-[50px] rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-white/5">
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                        alt={friend.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{friend.name}</h4>
                      <p className="text-xs text-[#8E8E93] font-normal truncate mt-0.5">
                        {lastMsg
                          ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                          : 'Nhấn để trò chuyện'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[11px] text-zinc-500 font-medium flex-shrink-0 ml-3">
                      {formatChatTime(lastMsg.created_at)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== MINIMALIST THREAD VIEW ==================== */
        <div className="flex-1 flex flex-col h-full bg-[#121212]">
          {/* Thread Header */}
          <div className="px-4 py-3 bg-[#1E1E22] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setActiveView('inbox')}
                className="p-1 rounded-full text-zinc-300 hover:bg-white/10 active:scale-95 transition-all"
                title="Quay lại"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                {selectedFriendId === 'all' ? (
                  <div className="w-full h-full bg-[#2C2C2E] flex items-center justify-center text-[#D9266E]">
                    <Users className="w-4 h-4" />
                  </div>
                ) : (
                  <img
                    src={selectedFriend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriendId}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#1E1E22]" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {selectedFriendId === 'all' ? 'Phòng trò chuyện chung' : selectedFriend?.name}
                </h3>
                <span className="text-[10px] text-emerald-400 font-normal flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang hoạt động</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 text-zinc-300">
              <button className="p-2 rounded-full hover:bg-white/5 transition-all" title="Gọi thoại">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/5 transition-all" title="Gọi Video">
                <Video className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-zinc-400" title="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {activeConversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D9266E] to-rose-600 flex items-center justify-center text-white mb-3 shadow-lg">
                  <Send className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Bắt đầu trò chuyện</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Gửi tin nhắn tới {selectedFriendId === 'all' ? 'Phòng chung' : selectedFriend?.name}
                </p>
              </div>
            ) : (
              activeConversationMessages.map((msg, index) => {
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
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 mb-0.5">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && index === 0 && (
                        <span className="text-[10px] text-zinc-400 font-normal mb-0.5 ml-1">
                          {senderName}
                        </span>
                      )}

                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                          isMe
                            ? 'bg-[#D9266E] text-white font-normal rounded-br-xs'
                            : 'bg-[#2C2C2E] text-white rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-0.5 px-1 font-normal">{formattedTime}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Reaction Pill */}
          <div className="px-3 py-1 bg-[#121212] border-t border-white/5 flex items-center justify-around">
            {['❤️', '🔥', '😍', '👍', '😂', '🥰', '☕'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSend(emoji)}
                className="text-base hover:scale-125 active:scale-95 transition-transform p-1"
                title={`Gửi ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-[#1E1E22] border-t border-white/5 flex items-center space-x-2">
            <button
              onClick={() => handleSend('👍')}
              className="p-1.5 rounded-full text-[#D9266E] hover:bg-white/5 active:scale-95 transition-all"
              title="Gửi Like 👍"
            >
              <ThumbsUp className="w-5 h-5 fill-current" />
            </button>

            <div className="flex-1 flex items-center bg-[#2C2C2E] rounded-full px-3.5 py-2 border border-white/5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhắn tin..."
                maxLength={300}
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-normal"
              />
            </div>

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSubmitting}
              className="p-2 rounded-full bg-[#D9266E] hover:bg-rose-600 text-white disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
              title="Gửi"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
