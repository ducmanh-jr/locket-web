"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Palette } from 'lucide-react';
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 select-none">
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-[#160B13]/95 border border-white/15 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col space-y-4 max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF2A85] to-[#F59E0B] flex items-center justify-center shadow-lg text-white">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white text-base font-black tracking-tight flex items-center space-x-1.5">
                    <span>Đổi Chủ Đề Locket Gold</span>
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </h3>
                  <p className="text-zinc-400 text-xs">Tùy biến bảng màu giao diện độc quyền</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes Grid List */}
            <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1 max-h-[55vh]">
              {LOCKET_THEMES.map((theme: LocketTheme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <motion.div
                    key={theme.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : 'bg-black/30 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Swatch Circle */}
                      <div
                        className="w-11 h-11 rounded-2xl flex-shrink-0 shadow-md border border-white/20 flex items-center justify-center"
                        style={{ background: theme.previewGradient }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />}
                      </div>

                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white text-xs font-extrabold">{theme.name}</h4>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full text-black"
                            style={{ background: theme.primaryColor }}
                          >
                            {theme.badge}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">{theme.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Done Button */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-black text-xs text-white shadow-xl transition-transform active:scale-98"
              style={{
                background: 'linear-gradient(135deg, #D9266E 0%, #F59E0B 100%)',
                boxShadow: '0 4px 20px rgba(217,38,110,0.4)',
              }}
            >
              Áp Dụng Giao Diện
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
