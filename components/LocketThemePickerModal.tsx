"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { LOCKET_THEMES, LocketTheme, getStoredTheme, saveStoredTheme } from '@/lib/theme';

interface LocketThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocketThemePickerModal: React.FC<LocketThemePickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeThemeId, setActiveThemeId] = useState<string>('rose');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    setActiveThemeId(getStoredTheme());
  }, []);

  if (!isMounted || !isOpen) return null;

  const handleSelectTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    saveStoredTheme(themeId);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          {/* Dark Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* iOS Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md bg-[#130E17]/95 border-t sm:border border-white/12 rounded-t-[2.2rem] sm:rounded-[2.2rem] p-5 pb-6 shadow-[0_30px_70px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col"
          >
            {/* iOS Grab Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-[15px] font-extrabold tracking-tight">
                Chủ Đề Nền
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Grid — 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              {LOCKET_THEMES.map((theme: LocketTheme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <motion.button
                    key={theme.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative flex flex-col items-center p-3 pb-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-white/10 border-white/30 shadow-lg'
                        : 'bg-black/20 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {/* Color Swatch */}
                    <div
                      className={`w-12 h-12 rounded-2xl shadow-md border flex items-center justify-center text-lg mb-2 transition-transform ${
                        isSelected ? 'border-white/40 scale-105' : 'border-white/15'
                      }`}
                      style={{ background: theme.previewGradient }}
                    >
                      {isSelected ? (
                        <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                      ) : (
                        <span className="drop-shadow-sm">{theme.emoji}</span>
                      )}
                    </div>

                    {/* Name */}
                    <span className={`text-[10px] font-bold leading-tight text-center ${
                      isSelected ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {theme.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Done Button */}
            <button
              onClick={onClose}
              className="w-full py-3 mt-4 rounded-2xl font-bold text-xs text-white shadow-lg transition-all active:scale-98"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%)',
                boxShadow: 'var(--theme-glow)',
              }}
            >
              Xong
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
