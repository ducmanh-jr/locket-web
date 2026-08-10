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

  // Touch & Click Swipe Handlers
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

  return (
    <div className="w-full flex items-center justify-center select-none">
      {/* Clean Glassmorphic Caption Pill Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-[85%] max-w-[280px] relative flex items-center justify-center bg-black/60 backdrop-blur-xl rounded-full border border-white/20 px-4 py-2.5 text-center shadow-2xl transition-all focus-within:border-[#FFC700] focus-within:bg-black/80"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Viết chú thích..."
          maxLength={60}
          className="w-full bg-transparent text-white text-xs font-semibold text-center placeholder-zinc-400 focus:outline-none tracking-tight"
        />
      </div>
    </div>
  );
};
