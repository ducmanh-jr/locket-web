"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Smartphone, Monitor } from 'lucide-react';
import { LOCKET_THEMES, LocketTheme, getStoredTheme, saveStoredTheme } from '@/lib/theme';
import { CANVAS_THEMES, CanvasTheme, getStoredCanvasTheme, saveStoredCanvasTheme } from '@/lib/canvasTheme';

interface LocketThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocketThemePickerModal: React.FC<LocketThemePickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'canvas'>('canvas');
  const [activeThemeId, setActiveThemeId] = useState<string>('rose');
  const [activeCanvasId, setActiveCanvasId] = useState<string>('wine');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    setActiveThemeId(getStoredTheme());
    setActiveCanvasId(getStoredCanvasTheme());
  }, []);

  if (!isMounted || !isOpen) return null;

  const handleSelectAppTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    saveStoredTheme(themeId);
  };

  const handleSelectCanvasTheme = (canvasId: string) => {
    setActiveCanvasId(canvasId);
    saveStoredCanvasTheme(canvasId);
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
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Header with Title & Close */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-[15px] font-extrabold tracking-tight">
                Tùy Chỉnh Màu Giao Diện
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher: App Theme vs Canvas Ambient Wallpaper */}
            <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('canvas')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'canvas'
                    ? 'bg-white/15 text-white shadow-md border border-white/15'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Nền Xung Quanh</span>
              </button>

              <button
                onClick={() => setActiveTab('app')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'app'
                    ? 'bg-white/15 text-white shadow-md border border-white/15'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Màu App Locket</span>
              </button>
            </div>

            {/* Tab Content 1: Outer Canvas Ambient Wallpaper */}
            {activeTab === 'canvas' && (
              <div className="grid grid-cols-3 gap-3">
                {CANVAS_THEMES.map((canvas: CanvasTheme) => {
                  const isSelected = activeCanvasId === canvas.id;
                  return (
                    <motion.button
                      key={canvas.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectCanvasTheme(canvas.id)}
                      className={`relative flex flex-col items-center p-3 pb-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-white/10 border-white/30 shadow-lg'
                          : 'bg-black/20 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {/* Color Swatch with 3 Swatch Dots */}
                      <div
                        className={`w-12 h-12 rounded-2xl shadow-md border flex items-center justify-center text-lg mb-2 relative overflow-hidden transition-transform ${
                          isSelected ? 'border-white/40 scale-105' : 'border-white/15'
                        }`}
                        style={{ background: canvas.gradient }}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                        ) : (
                          <div className="flex space-x-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
                              style={{ background: canvas.swatchColors[0] }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
                              style={{ background: canvas.swatchColors[1] }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
                              style={{ background: canvas.swatchColors[2] }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <span className={`text-[10px] font-bold leading-tight text-center ${
                        isSelected ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {canvas.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Tab Content 2: App Locket Theme */}
            {activeTab === 'app' && (
              <div className="grid grid-cols-3 gap-3">
                {LOCKET_THEMES.map((theme: LocketTheme) => {
                  const isSelected = activeThemeId === theme.id;
                  return (
                    <motion.button
                      key={theme.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectAppTheme(theme.id)}
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
            )}

            {/* Done Button */}
            <button
              onClick={onClose}
              className="w-full py-3 mt-4 rounded-2xl font-bold text-xs text-white shadow-lg transition-all active:scale-98"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%)',
                boxShadow: 'var(--theme-glow)',
              }}
            >
              Hoàn Tất
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
