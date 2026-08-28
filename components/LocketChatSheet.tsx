"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { MemberFilterOption } from './LocketHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  X,
  Send,
  ChevronLeft,
  Phone,
  Video,
  ThumbsUp,
  Search,
  Image as ImageIcon,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Check,
  CheckCheck,
  Plus,
  FileText,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';

async function getChatAuthHeader(): Promise<Record<string, string>> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return { Authorization: `Bearer ${data.session.access_token}` };
      }
    } catch (e) {}
  }
  return {};
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
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
    const updated = [...existing.filter((m) => m.id !== msg.id), msg].slice(-500);
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(updated));
  } catch (e) {}
}

function saveLocalMessages(msgs: ChatMessage[]): void {
  if (typeof window === 'undefined' || !Array.isArray(msgs) || msgs.length === 0) return;
  try {
    const existing = readLocalMessages();
    const map = new Map<string, ChatMessage>();
    existing.forEach((m) => map.set(m.id, m));
    msgs.forEach((m) => {
      if (m && m.id) {
        const prev = map.get(m.id);
        if (prev) {
          const statusOrder: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
          const pStatus = statusOrder[prev.status || 'sent'] || 1;
          const mStatus = statusOrder[m.status || 'sent'] || 1;
          map.set(m.id, { ...prev, ...m, status: mStatus >= pStatus ? m.status : prev.status });
        } else {
          map.set(m.id, m);
        }
      }
    });
    const updated = Array.from(map.values()).slice(-500);
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(updated));
  } catch (e) {}
}

import { killGlobalAudio } from '@/lib/audioPlayer';

export const LocketChatSheet: React.FC<LocketChatSheetProps> = ({
  currentUser,
  friends,
  onClose,
}) => {
  useEffect(() => {
    killGlobalAudio();
  }, []);
  const [activeView, setActiveView] = useState<'inbox' | 'thread'>('inbox');
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalMessages());
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const [showPlusMenu, setShowPlusMenu] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Document / File Upload Handler
  const handleDocumentPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload file to server to get a short HTTP URL instead of storing Base64 in localStorage
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          handleSend(`📄 [Tệp] ${file.name}`, data.url);
        }
      } else {
        // Fallback: use Base64 only for small files (< 500KB)
        if (file.size < 500 * 1024) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            if (base64Data) {
              handleSend(`📄 [Tệp] ${file.name}`, base64Data);
            }
          };
          reader.readAsDataURL(file);
        } else {
          console.warn('[Chat] File too large for localStorage fallback, upload failed');
        }
      }
    } catch (err) {
      console.warn('[Chat] File upload error:', err);
    }
    e.target.value = '';
    setShowPlusMenu(false);
  };

  // Delete Message Handler
  const handleDeleteMessage = async (msgId: string) => {
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== msgId);
      saveLocalMessages(next);
      return next;
    });
    setActionMessage(null);
    try {
      const authHeaders = await getChatAuthHeader();
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ action: 'delete_message', message_id: msgId }),
      });
    } catch (e) {}
  };

  // Start Edit Message Handler
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
    setActionMessage(null);
  };

  // Save Edit Message Handler
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    const msgId = editingMessageId;
    const newContent = editingText.trim();

    setMessages((prev) => {
      const next = prev.map((m) => (m.id === msgId ? { ...m, content: newContent } : m));
      saveLocalMessages(next);
      return next;
    });

    setEditingMessageId(null);
    setEditingText('');

    try {
      const authHeaders = await getChatAuthHeader();
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'edit_message',
          message_id: msgId,
          content: newContent,
        }),
      });
    } catch (e) {}
  };

  // Call System Overlay States
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);

  // Call Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCallType) {
      timer = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeCallType]);

  const formatCallTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Sanitize & Deduplicate Friends List (Filter out self)
  const sanitizedFriends = React.useMemo(() => {
    const list = friends.filter((f) => {
      if (!f.id) return false;
      if (f.id === 'all' || f.name.toLowerCase().includes('tất cả')) return false;
      if (f.id === currentUser.id) return false;
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

  // Set default selected friend ID on mount if available
  useEffect(() => {
    if (!selectedFriendId && sanitizedFriends.length > 0) {
      setSelectedFriendId(sanitizedFriends[0].id);
    }
  }, [sanitizedFriends, selectedFriendId]);

  // Search Filter
  const filteredFriends = React.useMemo(() => {
    if (!searchQuery.trim()) return sanitizedFriends;
    return sanitizedFriends.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sanitizedFriends, searchQuery]);

  const selectedFriend = sanitizedFriends.find((f) => f.id === selectedFriendId);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);

  // Auto scroll to bottom of chat (only force scroll on send/open, respect manual scroll-up)
  const scrollToBottom = useCallback((force: boolean = false) => {
    if (!force && isUserScrolledUpRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScrollStream = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isUserScrolledUpRef.current = !isNearBottom;
  };

  // Fetch messages from Cloud API
  const fetchMessages = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const url =
        activeView === 'thread' && selectedFriendId
          ? `/api/chat?user_id=${currentUser.id}&friend_id=${selectedFriendId}`
          : `/api/chat?user_id=${currentUser.id}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          if (data.messages.length > 0) {
            saveLocalMessages(data.messages);
          }
          setMessages((prev) => {
            const local = readLocalMessages();
            const merged = [...prev, ...local, ...data.messages];
            const map = new Map<string, ChatMessage>();
            merged.forEach((m) => {
              if (m && m.id) {
                const prevM = map.get(m.id);
                if (prevM) {
                  const statusOrder: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
                  const pStatus = statusOrder[prevM.status || 'sent'] || 1;
                  const mStatus = statusOrder[m.status || 'sent'] || 1;
                  map.set(m.id, { ...prevM, ...m, status: mStatus >= pStatus ? m.status : prevM.status });
                } else {
                  map.set(m.id, m);
                }
              }
            });
            const unique = Array.from(map.values());
            unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return unique;
          });
        }
      }
    } catch (e) {}
  }, [currentUser?.id, selectedFriendId, activeView]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('locket_chat_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'new_message' && event.data?.message) {
            const msg = event.data.message;
            setMessages((prev) => {
              if (prev.some((x) => x.id === msg.id)) return prev;
              const next = [...prev, msg];
              next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              return next;
            });
          }
        };
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (activeView === 'thread') {
      scrollToBottom();
    }
  }, [messages, activeView, scrollToBottom]);

  // Detect mobile keyboard open/close via visualViewport API to auto-hide quick emojis
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const kbOpen = window.innerHeight - vv.height > 120;
      setIsKeyboardOpen(kbOpen);
      if (kbOpen) {
        setTimeout(() => scrollToBottom(), 80);
      }
    };
    vv.addEventListener('resize', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
    };
  }, [scrollToBottom]);

  // Open a specific conversation thread
  const openThread = (friendId: string) => {
    setSelectedFriendId(friendId);
    setActiveView('thread');
    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 60);

    // Immediately mark unread messages from this friend as read locally
    setMessages((prev) => {
      let changed = false;
      const updated = prev.map((m) => {
        if (m.sender_id === friendId && m.status !== 'read') {
          changed = true;
          return { ...m, status: 'read' as const };
        }
        return m;
      });
      if (changed) {
        saveLocalMessages(updated);
      }
      return updated;
    });

    try {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          sender_id: currentUser.id,
          recipient_id: friendId,
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Send message handler
  const handleSend = async (textToSend?: string, mediaUrl?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if ((!text.trim() && !mediaUrl) || isSubmitting || !selectedFriendId) return;

    setIsSubmitting(true);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender_id: currentUser.id,
      recipient_id: selectedFriendId,
      content: text.trim(),
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
      sender: currentUser,
    };

    saveLocalMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    if (textToSend === undefined) setInputText('');
    setIsSubmitting(false);
    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 60);

    // Instant Cross-Tab Broadcast Channel Sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('locket_chat_sync_channel');
        bc.postMessage({ type: 'new_message', message: newMsg });
        bc.close();
      } catch (e) {}
    }

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMsg.id,
          sender_id: currentUser.id,
          recipient_id: selectedFriendId,
          content: text.trim(),
          media_url: mediaUrl,
          sender_name: currentUser.display_name,
          sender_avatar: currentUser.avatar_url,
          created_at: newMsg.created_at,
        }),
      });
    } catch (e) {}
  };

  // Real Image Selection & Upload Handler
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        handleSend('', base64Data);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter messages for current active conversation (strict 1-on-1)
  const activeConversationMessages = messages.filter((m) => {
    return (
      (m.sender_id === currentUser.id && m.recipient_id === selectedFriendId) ||
      (m.sender_id === selectedFriendId && m.recipient_id === currentUser.id)
    );
  });

  // Get last message for a specific thread
  const getLastMessage = useCallback(
    (friendId: string) => {
      const threadMsgs = messages.filter((m) => {
        return (
          (m.sender_id === currentUser.id && m.recipient_id === friendId) ||
          (m.sender_id === friendId && m.recipient_id === currentUser.id)
        );
      });
      if (threadMsgs.length === 0) return null;
      return threadMsgs[threadMsgs.length - 1];
    },
    [messages, currentUser.id]
  );

  // Sort Friends by Latest Message Timestamp (Most Recent Conversation First!)
  const sortedFriends = React.useMemo(() => {
    const list = [...filteredFriends];
    list.sort((a, b) => {
      const msgA = getLastMessage(a.id);
      const msgB = getLastMessage(b.id);
      const timeA = msgA ? new Date(msgA.created_at || 0).getTime() : 0;
      const timeB = msgB ? new Date(msgB.created_at || 0).getTime() : 0;
      return timeB - timeA; // Descending: Most recent first!
    });
    return list;
  }, [filteredFriends, getLastMessage]);

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
      className="fixed sm:absolute inset-0 z-50 bg-white text-zinc-900 flex flex-col overflow-hidden rounded-t-[1.5rem] sm:rounded-[2.5rem] select-none font-sans shadow-2xl"
    >
      {/* Hidden File Input for Image Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImagePick}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden File Input for Document Attachment */}
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocumentPick}
        accept="*"
        className="hidden"
      />

      {/* ==================== REAL CALL OVERLAY ==================== */}
      <AnimatePresence>
        {activeCallType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-zinc-950 text-white flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Call Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                Locket Audio / Video Call
              </span>
              <button
                onClick={() => setActiveCallType(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calling User Info */}
            <div className="flex flex-col items-center justify-center space-y-2 text-center mt-6">
              <h3 className="text-xl font-bold tracking-tight">
                {selectedFriend?.name || 'Bạn bè'}
              </h3>
              <p className="text-xs text-rose-400 font-medium">
                {formatCallTimer(callDurationSeconds)}
              </p>
            </div>

            {/* Call Center Avatar / Video Box */}
            <div className="relative my-auto flex flex-col items-center justify-center">
              {activeCallType === 'video' && !isVideoDisabled ? (
                <div className="w-56 h-72 rounded-3xl bg-zinc-900 border-2 border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
                  <img
                    src={selectedFriend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriendId}`}
                    alt=""
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    {selectedFriend?.name}
                  </span>

                  {/* My Camera PiP Preview */}
                  <div className="absolute top-3 right-3 w-16 h-20 bg-zinc-800 rounded-xl overflow-hidden border border-white/20 shadow-md">
                    <img
                      src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#D9266E] shadow-xl z-10 relative">
                    <img
                      src={selectedFriend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriendId}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Call Action Bar Controls */}
            <div className="w-full pb-8 flex items-center justify-center space-x-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-all active:scale-95 shadow-md ${
                  isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
                title={isMuted ? 'Bật micro' : 'Tắt micro'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {activeCallType === 'video' && (
                <button
                  onClick={() => setIsVideoDisabled(!isVideoDisabled)}
                  className={`p-4 rounded-full transition-all active:scale-95 shadow-md ${
                    isVideoDisabled ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                  title={isVideoDisabled ? 'Bật camera' : 'Tắt camera'}
                >
                  {isVideoDisabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              )}

              <button
                onClick={() => setActiveCallType(null)}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 shadow-lg shadow-red-600/40"
                title="Tắt máy"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop overlay to dismiss floating message action menu */}
      {actionMessage && (
        <div
          onClick={() => setActionMessage(null)}
          className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-150"
        />
      )}

      {activeView === 'inbox' ? (
        /* ==================== CLEAN LIGHT INBOX VIEW ==================== */
        <div className="flex-1 flex flex-col h-full bg-white">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-zinc-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
                  }
                  alt={currentUser.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Đoạn chat</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-all active:scale-95"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2.5">
            <div className="h-9 px-3 flex items-center space-x-2 bg-zinc-100 rounded-xl border border-zinc-200/60 focus-within:border-[#D9266E] text-zinc-600 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="w-full bg-transparent text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Friends Horizontal Row (Sorted by Most Recent Conversation First) */}
          <div className="px-4 py-2.5 flex items-center space-x-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-zinc-100">
            {sortedFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => openThread(friend.id)}
                className="flex flex-col items-center space-y-1 flex-shrink-0"
              >
                <div className="w-[50px] h-[50px] rounded-full bg-zinc-100 p-0.5 border border-zinc-200 shadow-sm active:scale-95 transition-transform overflow-hidden">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt={friend.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-[11px] text-zinc-700 font-medium truncate max-w-[56px]">
                  {friend.name.trim().split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Individual Friend Chat List (Sorted by Most Recent Conversation First) */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {sortedFriends.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Không tìm thấy cuộc trò chuyện nào
              </div>
            ) : (
              sortedFriends.map((friend) => {
                const lastMsg = getLastMessage(friend.id);
                const isUnread = Boolean(
                  lastMsg &&
                    lastMsg.sender_id === friend.id &&
                    lastMsg.status !== 'read'
                );

                return (
                  <button
                    key={friend.id}
                    onClick={() => openThread(friend.id)}
                    className={`w-full px-4 py-3.5 flex items-center justify-between border-b border-zinc-100 transition-all ${
                      isUnread
                        ? 'bg-[#D9266E]/[0.06] hover:bg-[#D9266E]/[0.10] active:bg-[#D9266E]/[0.14]'
                        : 'hover:bg-zinc-50 active:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      {/* Clean Avatar (Zero Pink Rings or Dots) */}
                      <div className="w-[50px] h-[50px] rounded-full bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200 shadow-sm">
                        <img
                          src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                          alt={friend.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>

                      {/* Display Name & Last Message Preview */}
                      <div className="text-left min-w-0 flex-1 pr-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-zinc-900 truncate">
                            {friend.name}
                          </h4>
                          {lastMsg && (
                            <span className="text-[11px] text-zinc-400 font-medium flex-shrink-0 ml-2">
                              {formatChatTime(lastMsg.created_at)}
                            </span>
                          )}
                        </div>

                        {/* ONLY Bold the message content preview text when unread */}
                        <p
                          className={`text-xs sm:text-[13px] truncate mt-0.5 leading-snug ${
                            isUnread
                              ? 'font-bold text-zinc-950 text-[13px]'
                              : 'font-normal text-zinc-500'
                          }`}
                        >
                          {lastMsg
                            ? lastMsg.media_url
                              ? `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}📷 [Hình ảnh]`
                              : `${lastMsg.sender_id === currentUser.id ? 'Bạn: ' : ''}${lastMsg.content}`
                            : 'Nhấn để trò chuyện'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ==================== MOBILE-OPTIMIZED THREAD VIEW ==================== */
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Thread Header with Proper Top Padding */}
          <div className="px-4 pt-4 pb-3 bg-white border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                onClick={() => setActiveView('inbox')}
                className="p-1 rounded-full text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all flex-shrink-0"
                title="Quay lại"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
                <img
                  src={selectedFriend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriendId}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 truncate">
                {selectedFriend?.name || 'Bạn bè'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 flex-shrink-0" title="Đóng">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages Stream — flex-1 + min-h-0 ensures proper shrinking on mobile */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScrollStream}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5 bg-[#FAFAFA] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {activeConversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D9266E] to-rose-500 flex items-center justify-center text-white mb-3 shadow-md">
                  <Send className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-800">Bắt đầu trò chuyện</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Gửi tin nhắn tới {selectedFriend?.name}
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

                const isEditing = editingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActionMessage(msg);
                    }}
                    onTouchStart={(e) => {
                      longPressTimerRef.current = setTimeout(() => {
                        if ('vibrate' in navigator) navigator.vibrate(30);
                        setActionMessage(msg);
                      }, 380);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    }}
                    onTouchMove={() => {
                      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    }}
                    className={`flex items-end space-x-1.5 group relative select-none ${
                      isMe ? 'justify-end' : 'justify-start'
                    } ${actionMessage?.id === msg.id ? 'z-40' : ''}`}
                  >
                    {!isMe && (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0 mb-0.5 border border-zinc-300">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className={`max-w-[78%] flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Floating Messenger-Style Action Popover Directly Above Message */}
                      {actionMessage?.id === msg.id && (
                        <div
                          className={`absolute -top-9 ${
                            isMe ? 'right-0' : 'left-0'
                          } z-50 flex items-center bg-zinc-900 text-white rounded-full px-2 py-1 shadow-2xl border border-white/20 space-x-1 animate-in fade-in zoom-in-95 duration-150 select-none`}
                        >
                          {isMe && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(msg);
                              }}
                              className="flex items-center space-x-1 px-2 py-0.5 rounded-full hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-rose-400" />
                              <span>Sửa</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded-full hover:bg-white/20 text-xs font-semibold text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}

                      {!isMe && index === 0 && (
                        <span className="text-[10px] text-zinc-500 font-normal mb-0.5 ml-1">
                          {senderName}
                        </span>
                      )}

                      {/* Image Attachment */}
                      {msg.media_url && (
                        <div className="mb-1 rounded-2xl overflow-hidden border border-zinc-200 shadow-sm max-w-[200px]">
                          <img src={msg.media_url} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                        </div>
                      )}

                      {/* Inline Editing vs Text Bubble */}
                      {isEditing ? (
                        <div className="flex flex-col space-y-1.5 w-full my-1 bg-white p-2 rounded-2xl border border-[#D9266E] shadow-sm">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-transparent text-xs text-zinc-900 focus:outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-semibold"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-0.5 rounded-md bg-[#D9266E] text-white text-[10px] font-semibold"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.content && (
                          <div className="relative group/bubble flex items-center">
                            {/* Message Bubble Options Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMessage(msg);
                              }}
                              className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-600 ${
                                isMe ? '-left-6 absolute' : '-right-6 absolute'
                              }`}
                              title="Tùy chọn tin nhắn"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            <div
                              className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words shadow-xs select-none ${
                                isMe
                                  ? 'text-white rounded-br-sm shadow-md'
                                  : 'bg-white border border-zinc-200/80 text-zinc-900 rounded-bl-sm'
                              }`}
                              style={isMe ? { background: 'var(--theme-primary)' } : {}}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )
                      )}

                      <span className="text-[9px] text-zinc-400 mt-0.5 px-1 font-normal flex items-center space-x-1">
                        <span>{formattedTime}</span>
                        {isMe && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-[#D9266E]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3 h-3 text-zinc-400" />
                          ) : (
                            <Check className="w-3 h-3 text-zinc-400" />
                          )
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Plus Menu Floating Bar (Image & Document Attachments) */}
          {showPlusMenu && (
            <div className="px-3 py-2 bg-white border-t border-zinc-100 flex items-center space-x-3 flex-shrink-0 animate-in fade-in duration-150">
              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#D9266E] text-xs font-semibold transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Gửi ảnh</span>
              </button>

              <button
                onClick={() => {
                  setShowPlusMenu(false);
                  docInputRef.current?.click();
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Gửi tệp</span>
              </button>
            </div>
          )}

          {/* Input Bar — sticky bottom, safe-area aware */}
          <div className="px-2 py-2 bg-white border-t border-zinc-100 flex items-center space-x-1.5 flex-shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
            {/* Plus (+) Options Toggle Button */}
            <button
              onClick={() => setShowPlusMenu((prev) => !prev)}
              className={`p-2 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-[#D9266E] active:scale-95 transition-all flex-shrink-0 ${
                showPlusMenu ? 'bg-rose-50 text-[#D9266E] rotate-45' : ''
              }`}
              title="Thêm tùy chọn đính kèm"
            >
              <Plus className="w-5 h-5 transition-transform" />
            </button>

            {/* Chat Input Field (textarea completely bypasses Android autofill/password bar) */}
            <div className="flex-1 min-w-0 flex items-center bg-zinc-100 rounded-2xl px-3 py-1 border border-zinc-200/80 focus-within:border-[#D9266E] transition-colors">
              <textarea
                rows={1}
                name="chat-message-area"
                id="locket-chat-textarea"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nhắn tin..."
                maxLength={500}
                className="w-full bg-transparent text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none resize-none py-1 leading-normal max-h-20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSubmitting}
              className="p-2 rounded-full bg-[#D9266E] hover:bg-rose-600 text-white disabled:opacity-40 active:scale-95 transition-all shadow-sm flex-shrink-0"
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

export function getUnreadMessagesCount(currentUserId: string): number {
  if (typeof window === 'undefined' || !currentUserId) return 0;
  try {
    const msgs = readLocalMessages();
    let count = 0;
    msgs.forEach((m) => {
      if (m && m.sender_id !== currentUserId && m.status !== 'read') {
        count += 1;
      }
    });
    return count;
  } catch (e) {
    return 0;
  }
}
