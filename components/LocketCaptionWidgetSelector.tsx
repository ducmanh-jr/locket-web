"use client";

import React, { useState, useRef, useMemo } from 'react';

interface LocketCaptionWidgetSelectorProps {
  value: string;
  onChange: (newValue: string) => void;
}

const GOLD_CAPTION_STYLES = [
  { id: 'gold-default', label: 'Gold', borderColor: 'var(--theme-primary)', bg: 'rgba(0,0,0,0.75)', textColor: 'var(--theme-primary)', glow: '0 0 12px var(--theme-glow)' },
  { id: 'gold-warm', label: '✨ Luxury', borderColor: 'var(--theme-secondary)', bg: 'rgba(20,10,0,0.85)', textColor: 'var(--theme-primary)', glow: '0 0 15px var(--theme-glow)' },
  { id: 'classic', label: 'Classic', borderColor: 'rgba(255,255,255,0.25)', bg: 'rgba(0,0,0,0.6)', textColor: 'white', glow: 'none' },
  { id: 'glass', label: 'Glass', borderColor: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.08)', textColor: 'white', glow: 'none' },
];

export const LocketCaptionWidgetSelector: React.FC<LocketCaptionWidgetSelectorProps> = ({
  value,
  onChange,
}) => {
  const [activeStyle, setActiveStyle] = useState<string>('gold-default');
  const touchStartXRef = useRef<number | null>(null);

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

    let timeGreeting = 'Buổi tối vui vẻ! 🌆';
    if (hours >= 5 && hours < 11) timeGreeting = 'Chào buổi sáng! ☀️';
    else if (hours >= 11 && hours < 14) timeGreeting = 'Bữa trưa ngon miệng! 🍱';
    else if (hours >= 14 && hours < 18) timeGreeting = 'Chiều mát mẻ! 🍃';

    return [
      { id: 'time-1', text: time12h },
      { id: 'time-2', text: timeWithDay },
      { id: 'greet-1', text: timeGreeting },
      { id: 'gold-1', text: '✨ Locket Gold ✨' },
      { id: 'gold-2', text: '👑 Premium Moment 👑' },
      { id: 'gold-3', text: '🌟 Golden Hour 🌟' },
      { id: 'mood-1', text: 'Nhớ bạn nhiều ❤️' },
      { id: 'mood-2', text: 'Best Friends 👯‍♂️' },
    ];
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const handlePrev = () => {
    const newIdx = (currentIndex - 1 + dynamicSuggestions.length) % dynamicSuggestions.length;
    setCurrentIndex(newIdx);
    onChange(dynamicSuggestions[newIdx].text);
  };

  const handleNext = () => {
    const newIdx = (currentIndex + 1) % dynamicSuggestions.length;
    setCurrentIndex(newIdx);
    onChange(dynamicSuggestions[newIdx].text);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 30) {
      if (diffX > 0) handlePrev();
      else handleNext();
    }
    touchStartXRef.current = null;
  };

  const currentStyle = GOLD_CAPTION_STYLES.find((s) => s.id === activeStyle) || GOLD_CAPTION_STYLES[0];
  const isGoldStyle = activeStyle === 'gold-default' || activeStyle === 'gold-warm';

  return (
    <div className="w-full flex flex-col items-center select-none space-y-1.5">
      {/* Caption Input Pill */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-[85%] max-w-[280px] relative flex items-center justify-center transition-all"
        style={{
          borderRadius: '9999px',
          border: `1.5px solid ${currentStyle.borderColor}`,
          background: currentStyle.bg,
          backdropFilter: 'blur(16px)',
          boxShadow: currentStyle.glow !== 'none' ? currentStyle.glow : undefined,
          padding: '6px 16px',
        }}
      >
        {isGoldStyle && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none gold-shimmer-overlay"
            style={{ borderRadius: '9999px' }}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Viết chú thích..."
          maxLength={60}
          className="w-full bg-transparent text-xs font-semibold text-center placeholder-zinc-400 focus:outline-none tracking-tight relative z-10"
          style={{ color: currentStyle.textColor }}
        />
      </div>

      {/* Gold Style Picker Row */}
      <div className="flex items-center space-x-1.5">
        {GOLD_CAPTION_STYLES.map((style) => {
          const isActive = activeStyle === style.id;
          const isGold = style.id.startsWith('gold');
          return (
            <button
              key={style.id}
              onClick={() => setActiveStyle(style.id)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-90"
              style={{
                border: `1px solid ${isActive ? style.borderColor : 'rgba(255,255,255,0.15)'}`,
                background: isActive
                  ? (isGold ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' : 'rgba(255,255,255,0.15)')
                  : 'rgba(0,0,0,0.4)',
                color: isActive ? (isGold ? 'black' : 'white') : 'rgba(255,255,255,0.6)',
                boxShadow: isActive && isGold ? '0 0 8px var(--theme-glow)' : undefined,
              }}
            >
              {isGold && <span>✨</span>}
              <span>{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
