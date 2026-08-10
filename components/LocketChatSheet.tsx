"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { MemberFilterOption } from './LocketHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  ChevronLeft,
  Phone,
  Video,
  Info,
  Plus,
  Image as ImageIcon,
  ThumbsUp,
  Smile,
  Search,
  Users,
  CheckCheck,
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

  // 1. Sanitize & Deduplicate Friends List (Filter out self and test/system users)
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
      className="absolute inset-0 z-50 bg-[#18191A] text-white flex flex-col justify-between overflow-hidden rounded-[2.5rem] select-none font-sans"
    >
      {activeView === 'inbox' ? (
        /* ==================== MESSENGER INBOX VIEW ==================== */
        <div className="flex-1 flex flex-col h-full bg-[#18191A]">
          {/* Messenger Inbox Header */}
          <div className="px-4 pt-4 pb-2.5 flex items-center justify-between bg-[#242526] border-b border-zinc-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFC700] p-0.5 bg-gradient-to-b from-[#FFC700]/30 to-transparent shadow-md flex items-center justify-center">
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
                  }
                  alt={currentUser.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Đoạn chat</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#3A3B3C] hover:bg-[#4E4F50] text-zinc-200 flex items-center justify-center transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messenger Search Input */}
          <div className="px-4 py-2 bg-[#18191A]">
            <div className="flex items-center space-x-2 bg-[#242526] px-3.5 py-2.5 rounded-2xl border border-zinc-700/60 focus-within:border-[#FFC700] text-zinc-400 transition-colors shadow-inner">
              <Search className="w-4 h-4 text-[#FFC700]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đoạn chat..."
                className="bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Messenger Active Online Friends Stories Row */}
          <div className="px-3 py-2 flex items-center space-x-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-zinc-800/50 bg-[#18191A]">
            <button
              onClick={() => openThread('all')}
              className="flex flex-col items-center space-y-1 flex-shrink-0"
            >
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFC700] to-amber-500 p-0.5 shadow-md active:scale-95 transition-transform">
                <div className="w-full h-full rounded-full bg-[#242526] flex items-center justify-center text-[#FFC700]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A] z-10" />
              </div>
              <span className="text-[10px] text-zinc-300 font-bold truncate max-w-[58px]">Phòng chung</span>
            </button>

            {sanitizedFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => openThread(friend.id)}
                className="flex flex-col items-center space-y-1 flex-shrink-0"
              >
                <div className="relative w-12 h-12 rounded-full bg-zinc-800 p-0.5 shadow-md active:scale-95 transition-transform">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt={friend.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A] z-10" />
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold truncate max-w-[58px]">
                  {friend.name.trim().split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Standardized Unified Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Conversation 1: All Room Chat */}
            {(() => {
              const lastMsg = getLastMessage('all');
              return (
                <button
                  onClick={() => openThread('all')}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all border border-zinc-800/60 shadow-sm ${
                    selectedFriendId === 'all' ? 'bg-[#3A3B3C]' : 'bg-[#242526]/80 hover:bg-[#3A3B3C]/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFC700] to-amber-500 p-0.5 flex-shrink-0 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#242526] flex items-center justify-center text-[#FFC700]">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A] z-10" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">Phòng trò chuyện chung 👥</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {lastMsg
                          ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                          : 'Bắt đầu cuộc trò chuyện chung ngay...'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[10px] text-zinc-400 font-semibold flex-shrink-0 ml-2">
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
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all border border-zinc-800/60 shadow-sm ${
                    selectedFriendId === friend.id ? 'bg-[#3A3B3C]' : 'bg-[#242526]/80 hover:bg-[#3A3B3C]/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0 shadow-md overflow-hidden">
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                        alt={friend.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A] z-10" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{friend.name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {lastMsg
                          ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                          : 'Nhấn để bắt đầu trò chuyện 👋'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[10px] text-zinc-400 font-semibold flex-shrink-0 ml-2">
                      {formatChatTime(lastMsg.created_at)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== MESSENGER CHAT THREAD VIEW ==================== */
        <div className="flex-1 flex flex-col h-full bg-[#18191A]">
          {/* Messenger Thread Header */}
          <div className="px-3 py-2.5 bg-[#242526] border-b border-zinc-800/80 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setActiveView('inbox')}
                className="p-1 rounded-full text-[#0084FF] hover:bg-[#3A3B3C] active:scale-95 transition-all"
                title="Quay lại danh sách"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shadow-md">
                {selectedFriendId === 'all' ? (
                  <div className="w-full h-full bg-gradient-to-tr from-[#FFC700] to-amber-500 flex items-center justify-center text-black">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={selectedFriend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriendId}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-[#242526]" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white truncate max-w-[130px]">
                  {selectedFriendId === 'all' ? 'Phòng chung 👥' : selectedFriend?.name}
                </h3>
                <span className="text-[10px] text-green-400 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>Đang hoạt động</span>
                </span>
              </div>
            </div>

            {/* Messenger Header Action Buttons */}
            <div className="flex items-center space-x-1 text-[#0084FF]">
              <button className="p-2 rounded-full hover:bg-[#3A3B3C] transition-all" title="Gọi thoại">
                <Phone className="w-4 h-4 fill-current" />
              </button>
              <button className="p-2 rounded-full hover:bg-[#3A3B3C] transition-all" title="Gọi Video">
                <Video className="w-4 h-4 fill-current" />
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[#3A3B3C] text-zinc-300" title="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messenger Stream Area */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {activeConversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0084FF] to-blue-400 flex items-center justify-center text-white mb-3 shadow-lg animate-pulse">
                  <Send className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-white">Gửi lời chào đầu tiên! 👋</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Hãy mở đầu cuộc trò chuyện tới {selectedFriendId === 'all' ? 'Phòng chung' : selectedFriend?.name}!
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
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 mb-0.5 shadow-sm">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && index === 0 && (
                        <span className="text-[10px] text-zinc-400 font-semibold mb-0.5 ml-1">
                          {senderName}
                        </span>
                      )}

                      {/* Messenger Bubble with Rounded Corner Alignment */}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-[#0084FF] to-blue-600 text-white font-medium rounded-br-xs'
                            : 'bg-[#242526] text-white border border-zinc-700/50 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{formattedTime}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Emojis Floating Pill */}
          <div className="px-3 py-1 bg-[#18191A] border-t border-zinc-800/60 flex items-center justify-around">
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

          {/* Messenger Input Bar */}
          <div className="p-2.5 bg-[#242526] border-t border-zinc-800 flex items-center space-x-2">
            <button
              onClick={() => handleSend('👍')}
              className="p-1.5 rounded-full text-[#0084FF] hover:bg-[#3A3B3C] active:scale-95 transition-all"
              title="Gửi Like 👍"
            >
              <ThumbsUp className="w-5 h-5 fill-current" />
            </button>

            {/* Input Box */}
            <div className="flex-1 flex items-center bg-[#3A3B3C] rounded-full px-3.5 py-2 border border-zinc-700/40">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Nhắn tin...`}
                maxLength={300}
                className="w-full bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSubmitting}
              className="p-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white disabled:opacity-40 active:scale-95 transition-all shadow-md flex-shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
