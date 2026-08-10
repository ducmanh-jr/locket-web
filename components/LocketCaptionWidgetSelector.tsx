"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Clock, Sun, Heart, Smile, MapPin, Coffee, Edit3 } from 'lucide-react';

interface LocketCaptionWidgetSelectorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export const LocketCaptionWidgetSelector: React.FC<LocketCaptionWidgetSelectorProps> = ({
  value,
  onChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'clock' | 'greeting' | 'activity' | 'mood' | 'custom'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // 1. Generate Dynamic Realtime Clock & Time-based Suggestions
  const dynamicSuggestions = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const isPm = hours >= 12;
    const hours12 = (hours % 12 || 12).toString().padStart(2, '0');
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];

    const time12h = `${hours12}:${minutes} ${isPm ? 'PM' : 'AM'} 🕒`;
    const timeWithDay = `${hours12}:${minutes} - ${dayName} 📅`;
    const time24h = `${hours.toString().padStart(2, '0')}:${minutes} 🌙`;

    // Determine Greeting based on current hour
    let timeGreeting = 'Buổi tối vui vẻ! 🌆';
    let timeSubGreeting = 'Cơm nhà là nhất 🍚';
    if (hours >= 5 && hours < 11) {
      timeGreeting = 'Chào buổi sáng! ☀️';
      timeSubGreeting = 'Cần ly cà phê ☕';
    } else if (hours >= 11 && hours < 14) {
      timeGreeting = 'Bữa trưa ngon miệng! 🍱';
      timeSubGreeting = 'Nghỉ trưa thôi 😴';
    } else if (hours >= 14 && hours < 18) {
      timeGreeting = 'Chiều mát mẻ! 🍃';
      timeSubGreeting = 'Trà sữa ngập răng 🧋';
    } else if (hours >= 18 && hours < 22) {
      timeGreeting = 'Buổi tối vui vẻ! 🌆';
      timeSubGreeting = 'Cơm nhà là nhất 🍚';
    } else {
      timeGreeting = 'Chúc ngủ ngon! 🌙';
      timeSubGreeting = 'Thức khuya quá 🦉';
    }

    return [
      { id: 'time-1', text: time12h, cat: 'clock', icon: '🕒' },
      { id: 'time-2', text: timeWithDay, cat: 'clock', icon: '📅' },
      { id: 'time-3', text: time24h, cat: 'clock', icon: '🌙' },

      { id: 'greet-1', text: timeGreeting, cat: 'greeting', icon: '☀️' },
      { id: 'greet-2', text: timeSubGreeting, cat: 'greeting', icon: '☕' },

      { id: 'act-1', text: 'Đang ăn nè 🍕', cat: 'activity', icon: '🍕' },
      { id: 'act-2', text: 'Thèm ăn quá 🍜', cat: 'activity', icon: '🍜' },
      { id: 'act-3', text: 'Coffee Time ☕', cat: 'activity', icon: '☕' },
      { id: 'act-4', text: 'Đang học bài 📚', cat: 'activity', icon: '📚' },
      { id: 'act-5', text: 'Deadline dí 💻', cat: 'activity', icon: '💻' },
      { id: 'act-6', text: 'Chill time 🎧', cat: 'activity', icon: '🎧' },
      { id: 'act-7', text: 'On the way 🚗', cat: 'activity', icon: '🚗' },
      { id: 'act-8', text: 'Check-in 📍', cat: 'activity', icon: '📍' },
      { id: 'act-9', text: 'Gym time 🏋️‍♂️', cat: 'activity', icon: '🏋️‍♂️' },

      { id: 'mood-1', text: 'Nhớ bạn nhiều ❤️', cat: 'mood', icon: '❤️' },
      { id: 'mood-2', text: 'Hôm nay vui cực ✨', cat: 'mood', icon: '✨' },
      { id: 'mood-3', text: 'Mệt mỏi quá 😮‍💨', cat: 'mood', icon: '😮‍💨' },
      { id: 'mood-4', text: 'Xinh chưa nè 📸', cat: 'mood', icon: '📸' },
      { id: 'mood-5', text: 'Best Friends 👯‍♂️', cat: 'mood', icon: '👯‍♂️' },
      { id: 'mood-6', text: '31°C - Nắng đẹp ☀️', cat: 'mood', icon: '☀️' },
      { id: 'mood-7', text: 'Hà Nội 🇻🇳', cat: 'mood', icon: '🇻🇳' },
    ];
  }, []);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return dynamicSuggestions;
    return dynamicSuggestions.filter((item) => item.cat === activeCategory);
  }, [activeCategory, dynamicSuggestions]);

  // Navigate next / prev
  const handlePrev = () => {
    const newIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setCurrentIndex(newIdx);
    onChange(filteredItems[newIdx].text);
  };

  const handleNext = () => {
    const newIdx = (currentIndex + 1) % filteredItems.length;
    setCurrentIndex(newIdx);
    onChange(filteredItems[newIdx].text);
  };

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 30) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartXRef.current = null;
  };

  const selectSuggestion = (text: string, index: number) => {
    setCurrentIndex(index);
    onChange(text);
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Main Interactive Caption Pill with Left / Right Swipe Controls */}
      <div className="relative w-[92%] max-w-xs flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/20 active:scale-95 transition-all shadow-md z-10"
          title="Gợi ý trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Caption Input / Animated Suggestion Display */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 mx-1.5 relative flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 px-3 py-2 text-center shadow-2xl transition-all focus-within:border-[#FFC700]"
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Vuốt chọn hoặc nhập chú thích... ✏️"
            maxLength={60}
            className="w-full bg-transparent text-white text-xs font-bold text-center placeholder-zinc-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/20 active:scale-95 transition-all shadow-md z-10"
          title="Gợi ý kế tiếp"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Swipe Hint Indicator */}
      <div className="flex items-center space-x-1 mt-1 text-[10px] text-zinc-400 font-medium">
        <span>👈 Vuốt để đổi tiện ích Locket 👉</span>
      </div>

      {/* Quick Suggestion Chips Bar */}
      <div className="w-full overflow-x-auto no-scrollbar flex items-center space-x-1.5 px-3 py-1.5 mt-1">
        {filteredItems.map((item, idx) => {
          const isSelected = value === item.text;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectSuggestion(item.text, idx)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 border ${
                isSelected
                  ? 'bg-[#FFC700] text-black border-[#FFC700] font-bold shadow-md scale-105'
                  : 'bg-black/60 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};
