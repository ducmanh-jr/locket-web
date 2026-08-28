"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
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

          {/* Sleek Apple-style iOS Sheet Container */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md bg-[#130E17]/95 border-t sm:border border-white/12 rounded-t-[2.2rem] sm:rounded-[2.2rem] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col space-y-4"
          >
            {/* Top iOS Grab Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center border border-white/10 shadow-inner">
                  <Sparkles className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-white text-base font-extrabold tracking-tight">
                    Chủ Đề Giao Diện
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Tùy chỉnh màu sắc chủ đạo của Locket</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme List */}
            <div className="space-y-3 pt-1">
              {LOCKET_THEMES.map((theme: LocketTheme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <motion.div
                    key={theme.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/12 border-white/30 shadow-md'
                        : 'bg-black/25 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Metallic Swatch Circle */}
                      <div
                        className="w-10 h-10 rounded-2xl flex-shrink-0 shadow-md border border-white/20 flex items-center justify-center"
                        style={{ background: theme.previewGradient }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-white drop-shadow-sm stroke-[2.8]" />}
                      </div>

                      <div className="text-left">
                        <h4 className="text-white text-xs font-bold">{theme.name}</h4>
                        <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">{theme.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Done Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 mt-2 rounded-2xl font-extrabold text-xs text-white shadow-xl transition-all active:scale-98"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%)',
                boxShadow: 'var(--theme-glow)',
              }}
            >
              Áp Dụng
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
