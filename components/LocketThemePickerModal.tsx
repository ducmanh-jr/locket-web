"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Smartphone, Monitor, Flower2, Sparkles, Moon, Waves, Crown, Clover, Heart } from 'lucide-react';
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

  const renderThemeIcon = (iconName: string) => {
    const iconProps = { className: "w-5 h-5 text-[#E6C66D] stroke-[1.75] opacity-90 drop-shadow-sm" };
    switch (iconName) {
      case 'flower':
        return <Flower2 {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'moon':
        return <Moon {...iconProps} />;
      case 'waves':
        return <Waves {...iconProps} />;
      case 'crown':
        return <Crown {...iconProps} />;
      case 'clover':
        return <Clover {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      default:
        return <Sparkles {...iconProps} />;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          {/* Dark Soft-Diffused Bokeh Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Luxury Bottom Sheet Container */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-md bg-[#120B18]/95 border-t sm:border border-white/10 rounded-t-[2.4rem] sm:rounded-[2.4rem] p-5 pb-6 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-3xl flex flex-col"
          >
            {/* iOS Grab Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3.5 sm:hidden" />

            {/* Header with Title & Close */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-white/95 text-[15px] font-semibold tracking-tight">
                Tùy Chỉnh Màu Giao Diện
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 border border-white/10 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10 mb-4.5">
              <button
                onClick={() => setActiveTab('canvas')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'canvas'
                    ? 'bg-white/15 text-white shadow-sm border border-white/15 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 opacity-80" />
                <span>Nền Xung Quanh</span>
              </button>

              <button
                onClick={() => setActiveTab('app')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'app'
                    ? 'bg-white/15 text-white shadow-sm border border-white/15 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 opacity-80" />
                <span>Màu App Locket</span>
              </button>
            </div>

            {/* Tab 1: Nền Xung Quanh (Canvas Ambient Wallpaper) */}
            {activeTab === 'canvas' && (
              <div className="grid grid-cols-3 gap-3">
                {CANVAS_THEMES.map((canvas: CanvasTheme) => {
                  const isSelected = activeCanvasId === canvas.id;
                  return (
                    <motion.button
                      key={canvas.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectCanvasTheme(canvas.id)}
                      className={`relative flex flex-col items-center p-3 pb-2.5 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? 'bg-white/[0.08] border-rose-500/40 shadow-[0_0_20px_rgba(217,38,110,0.2)] ring-1 ring-rose-500/30'
                          : 'bg-black/30 border-white/8 hover:bg-white/[0.04] hover:border-white/15'
                      }`}
                    >
                      {/* Tactile Soft-Shadowed Swatch Tile */}
                      <div
                        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center relative overflow-hidden transition-all duration-200 mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.6)] ${
                          isSelected ? 'border-white/40 scale-[1.03]' : 'border-white/10 group-hover:border-white/20'
                        }`}
                        style={{ background: canvas.gradient }}
                      >
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Check className="w-4 h-4 text-white stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="flex space-x-1.5 items-center">
                            <span
                              className="w-2 h-2 rounded-full border border-white/40 shadow-xs"
                              style={{ background: canvas.swatchColors[0] }}
                            />
                            <span
                              className="w-2 h-2 rounded-full border border-white/40 shadow-xs"
                              style={{ background: canvas.swatchColors[1] }}
                            />
                            <span
                              className="w-2 h-2 rounded-full border border-white/40 shadow-xs"
                              style={{ background: canvas.swatchColors[2] }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Swatch Name */}
                      <span className={`text-[11px] tracking-tight leading-tight text-center transition-colors ${
                        isSelected ? 'text-white font-semibold' : 'text-zinc-400 font-medium group-hover:text-zinc-200'
                      }`}>
                        {canvas.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Màu App Locket */}
            {activeTab === 'app' && (
              <div className="grid grid-cols-3 gap-3">
                {LOCKET_THEMES.map((theme: LocketTheme) => {
                  const isSelected = activeThemeId === theme.id;
                  return (
                    <motion.button
                      key={theme.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectAppTheme(theme.id)}
                      className={`relative flex flex-col items-center p-3 pb-2.5 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? 'bg-white/[0.08] border-rose-500/40 shadow-[0_0_20px_rgba(217,38,110,0.2)] ring-1 ring-rose-500/30'
                          : 'bg-black/30 border-white/8 hover:bg-white/[0.04] hover:border-white/15'
                      }`}
                    >
                      {/* Tactile Soft-Shadowed Swatch Tile */}
                      <div
                        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center relative overflow-hidden transition-all duration-200 mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.6)] ${
                          isSelected ? 'border-white/40 scale-[1.03]' : 'border-white/10 group-hover:border-white/20'
                        }`}
                        style={{ background: theme.previewGradient }}
                      >
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Check className="w-4 h-4 text-white stroke-[2.5]" />
                          </div>
                        ) : (
                          renderThemeIcon(theme.iconName)
                        )}
                      </div>

                      {/* Swatch Name */}
                      <span className={`text-[11px] tracking-tight leading-tight text-center transition-colors ${
                        isSelected ? 'text-white font-semibold' : 'text-zinc-400 font-medium group-hover:text-zinc-200'
                      }`}>
                        {theme.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Refined Garnet Rose-Gold Done Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 mt-4 rounded-2xl font-semibold text-xs text-white/95 tracking-wide shadow-xl border border-white/10 transition-all duration-200 active:scale-[0.98] hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #A82E5C 0%, #7E1C3F 50%, #4D1027 100%)',
                boxShadow: '0 8px 24px -4px rgba(168, 46, 92, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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

