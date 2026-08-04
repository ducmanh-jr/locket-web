"use client";

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface LocketChatViewProps {
  friends: Profile[];
  currentUser: Profile;
  onBack: () => void;
}

export const LocketChatView: React.FC<LocketChatViewProps> = ({
  friends,
  currentUser,
  onBack,
}) => {
  const [activeFriend, setActiveFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'user-minh': [
      { id: 'm1', senderId: 'user-minh', text: 'Đẹp quá bn ơi', timestamp: '1 thg 5' },
    ],
  });
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeFriend) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text: inputText,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => ({
      ...prev,
      [activeFriend.id]: [...(prev[activeFriend.id] || []), newMsg],
    }));

    setInputText('');
  };

  // Filter out current logged in user from chat list & deduplicate
  const chatFriends = friends
    .filter(
      (f) =>
        f.id !== currentUser.id &&
        f.username !== currentUser.username &&
        f.id !== 'user-me' &&
        f.username !== 'manh_locket'
    )
    .filter(
      (user, index, self) => index === self.findIndex((u) => u.username === user.username)
    );

  return (
    <div className="w-full flex-1 flex flex-col bg-black z-40">
      {/* Header */}
      <div className="flex items-center space-x-3 px-4 py-3 border-b border-zinc-900">
        <button
          onClick={() => (activeFriend ? setActiveFriend(null) : onBack())}
          className="p-1 rounded-full text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h2 className="text-white text-lg font-extrabold">
          {activeFriend ? activeFriend.display_name : 'Tin nhắn'}
        </h2>
      </div>

      {/* Main Content Area */}
      {!activeFriend ? (
        /* Threads List matching Screenshot 2 */
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {chatFriends.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-8">Chưa có cuộc trò chuyện nào.</p>
          ) : (
            chatFriends.map((friend) => {
              const friendMsgs = messages[friend.id] || [];
              const lastMsg = friendMsgs[friendMsgs.length - 1];

              return (
                <div
                  key={friend.id}
                  onClick={() => setActiveFriend(friend)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#18181C] hover:bg-[#262626] border border-zinc-800/80 cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                        alt={friend.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold">{friend.display_name}</h4>
                      <p className="text-zinc-400 text-xs truncate max-w-[180px]">
                        {lastMsg ? lastMsg.text : 'Chạm để gửi tin nhắn...'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-medium">
                    {lastMsg ? lastMsg.timestamp : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Active Chat Direct Thread */
        <div className="flex-1 flex flex-col justify-between p-4">
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar py-2">
            {(messages[activeFriend.id] || []).map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-semibold ${
                      isMe
                        ? 'bg-[#FFC700] text-black rounded-br-xs'
                        : 'bg-[#262626] text-white rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-zinc-600 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
          </div>

          {/* Send Box */}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-zinc-900">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhắn tin với ${activeFriend.display_name}...`}
              className="flex-1 bg-[#262626] text-white text-xs font-medium px-4 py-3 rounded-full focus:outline-none placeholder-zinc-500 border border-zinc-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#FFC700] text-black flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
