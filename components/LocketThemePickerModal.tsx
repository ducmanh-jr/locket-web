"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, LOCKET_THEMES, ThemeId } from '@/lib/providers/ThemeProvider';
import { Sparkles, Check, X, Crown } from 'lucide-react';

interface LocketThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocketThemePickerModal: React.FC<LocketThemePickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentTheme, setTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<ThemeId>(currentTheme);
  const themeList = Object.values(LOCKET_THEMES);

  useEffect(() => {
    if (isOpen) {
      setPreviewTheme(currentTheme);
    }
  }, [isOpen, currentTheme]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }
  };

  const handleSelect = (id: ThemeId) => {
    triggerHaptic();
    setPreviewTheme(id);
    setTheme(id);
  };

  const handleApply = () => {
    triggerHaptic();
    setTheme(previewTheme);
    onClose();
  };

  if (!isOpen) return null;

  const activeConfig = LOCKET_THEMES[previewTheme] || LOCKET_THEMES.gold;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none"
      >
        <motion.div
          initial={{ y: 150, scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 150, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[#141418] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-center space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            borderColor: activeConfig.primary,
            boxShadow: `0 0 30px ${activeConfig.glow}, inset 0 0 20px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-black font-extrabold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${activeConfig.primary}, ${activeConfig.secondary})`,
                  boxShadow: `0 0 12px ${activeConfig.glow}`,
                }}
              >
                <Crown className="w-4 h-4 text-black" />
              </div>
              <div className="text-left">
                <h3 className="text-white text-sm font-extrabold flex items-center gap-1">
                  Đổi Giao Diện Locket Gold
                </h3>
                <p className="text-zinc-400 text-[10px]">Nhấn chọn hoặc vuốt carousel để đổi màu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mini Viewfinder Preview Mock */}
          <div
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border flex flex-col items-center justify-center p-3 shadow-inner my-1 transition-all duration-300"
            style={{
              borderColor: activeConfig.primary,
              boxShadow: `0 0 20px ${activeConfig.glow}`,
            }}
          >
            {/* Viewfinder Mock Box */}
            <div
              className="w-24 h-24 rounded-2xl relative flex flex-col items-center justify-center transition-all duration-300"
              style={{
                border: `3px solid ${activeConfig.primary}`,
                boxShadow: `0 0 15px ${activeConfig.glow}`,
                background: '#09090b',
              }}
            >
              <div className="text-2xl animate-bounce">{activeConfig.emoji}</div>
              <span
                className="text-[9px] font-black uppercase tracking-wider mt-1"
                style={{ color: activeConfig.primary }}
              >
                {activeConfig.name}
              </span>
            </div>

            {/* Shutter Mock Button */}
            <div
              className="w-8 h-8 rounded-full border-2 mt-3 flex items-center justify-center"
              style={{
                borderColor: activeConfig.primary,
                boxShadow: `0 0 10px ${activeConfig.glow}`,
              }}
            >
              <div className="w-6 h-6 rounded-full bg-white" />
            </div>
          </div>

          {/* Horizontal Carousel Theme Cards */}
          <div className="w-full overflow-x-auto custom-scrollbar flex items-center space-x-2.5 py-2 px-1">
            {themeList.map((theme) => {
              const isSelected = previewTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  className={`flex-shrink-0 w-24 p-2.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 scale-105 shadow-lg'
                      : 'bg-[#1a1a20] hover:bg-zinc-800/50 border-zinc-800'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: theme.primary,
                          boxShadow: `0 0 15px ${theme.glow}`,
                        }
                      : {}
                  }
                >
                  {/* Emoji Badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                  >
                    {theme.emoji}
                  </div>

                  <span
                    className="text-[10px] font-black text-center truncate w-full"
                    style={{ color: isSelected ? theme.primary : '#d4d4d8' }}
                  >
                    {theme.name}
                  </span>

                  {isSelected && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-black"
                      style={{ background: theme.primary }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full py-3 text-black font-extrabold text-xs rounded-2xl active:scale-95 transition-all flex items-center justify-center space-x-1.5 shadow-lg mt-2"
            style={{
              background: `linear-gradient(135deg, ${activeConfig.primary}, ${activeConfig.secondary})`,
              boxShadow: `0 0 20px ${activeConfig.glow}`,
            }}
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Áp Dụng Giao Diện {activeConfig.name}</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
