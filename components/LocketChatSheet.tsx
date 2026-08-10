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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
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
          <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-[#242526] border-b border-zinc-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#FFC700]/60 shadow-md">
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
                  }
                  alt=""
                  className="w-full h-full object-cover"
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
            <div className="flex items-center space-x-2 bg-[#242526] px-3.5 py-2 rounded-full border border-zinc-800 text-zinc-400">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đoạn chat..."
                className="bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none w-full"
              />
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
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A]" />
              </div>
              <span className="text-[10px] text-zinc-300 font-semibold truncate max-w-[56px]">Phòng chung</span>
            </button>

            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => openThread(friend.id)}
                className="flex flex-col items-center space-y-1 flex-shrink-0"
              >
                <div className="relative w-12 h-12 rounded-full bg-zinc-800 p-0.5 shadow-md active:scale-95 transition-transform">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A]" />
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold truncate max-w-[56px]">
                  {friend.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Conversation 1: All Room Chat */}
            {(() => {
              const lastMsg = getLastMessage('all');
              return (
                <button
                  onClick={() => openThread('all')}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                    selectedFriendId === 'all' ? 'bg-[#242526]' : 'hover:bg-[#242526]/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFC700] to-amber-500 p-0.5 flex-shrink-0 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#242526] flex items-center justify-center text-[#FFC700]">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A]" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">Phòng trò chuyện chung 👥</h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {lastMsg ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}` : 'Bắt đầu cuộc trò chuyện ngay...'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
                      {new Date(lastMsg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Individual Friend Chats */}
            {friends.map((friend) => {
              const lastMsg = getLastMessage(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => openThread(friend.id)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                    selectedFriendId === friend.id ? 'bg-[#242526]' : 'hover:bg-[#242526]/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0 shadow-md overflow-hidden">
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#18191A]" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{friend.name}</h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {lastMsg
                          ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                          : 'Nhấn để gửi tin nhắn 👋'}
                      </p>
                    </div>
                  </div>
                  {lastMsg && (
                    <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
                      {new Date(lastMsg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
