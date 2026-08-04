"use client";

import React, { useState } from 'react';
import { Smartphone, Check, Sparkles, ChevronUp, X, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

type DevicePreset = 'iphone17' | 'xiaomi17' | 'zfold8' | 'fullscreen';

interface PresetConfig {
  id: DevicePreset;
  name: string;
  brand: string;
  icon: string;
  containerClass: string;
  aspectDesc: string;
}

const DEVICE_PRESETS: PresetConfig[] = [
  {
    id: 'iphone17',
    name: 'iPhone 17 Pro Max',
    brand: 'Apple',
    icon: '🍎',
    containerClass: 'max-w-[410px] h-[830px] rounded-[3.25rem] border-[9px] border-[#1C1C1E]',
    aspectDesc: '19.5:9 • Viền titan siêu mỏng',
  },
  {
    id: 'xiaomi17',
    name: 'Xiaomi 17 Pro Max',
    brand: 'Xiaomi',
    icon: '⚡',
    containerClass: 'max-w-[390px] h-[840px] rounded-[2.5rem] border-[8px] border-[#18181B]',
    aspectDesc: '20:9 • Khung tràn viền 120Hz',
  },
  {
    id: 'zfold8',
    name: 'Samsung Z Fold 8',
    brand: 'Samsung',
    icon: '📐',
    containerClass: 'max-w-[540px] h-[780px] rounded-[2.25rem] border-[10px] border-[#222226]',
    aspectDesc: 'Màn hình gập vuông rộng lớn',
  },
  {
    id: 'fullscreen',
    name: 'Toàn màn hình PC',
    brand: 'Desktop',
    icon: '🖥️',
    containerClass: 'max-w-xl h-[860px] rounded-[2rem] border-[6px] border-[#27272A]',
    aspectDesc: 'Chế độ khung nhìn rộng',
  },
];

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>('iphone17');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const currentConfig =
    DEVICE_PRESETS.find((p) => p.id === selectedDevice) || DEVICE_PRESETS[0];

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#000000] text-zinc-100 flex items-center justify-center p-0 lg:p-6 font-sans selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Ambient Yellow Locket Glow in Background */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFC700]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Bottom-Left Collapsible Luxury Device Ratio Control Pill (PC Only) */}
      <div className="hidden lg:block fixed bottom-6 left-6 z-50">
        <div className="relative">
          {/* Expanded Luxury Floating Popover Drawer */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="absolute bottom-16 left-0 mb-2 w-72 bg-[#141417]/95 border border-zinc-700/80 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-50 text-left space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center border border-[#FFC700]/40">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white text-xs font-extrabold uppercase tracking-wider">
                      Tỷ lệ hiển thị PC
                    </span>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Chọn thiết bị để giả lập góc nhìn Locket chuẩn thiết kế trên PC:
                </p>

                {/* Device Options List */}
                <div className="space-y-1.5">
                  {DEVICE_PRESETS.map((preset) => {
                    const isSelected = selectedDevice === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedDevice(preset.id);
                          setIsOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all active:scale-95 text-left ${
                          isSelected
                            ? 'bg-[#FFC700]/20 text-[#FFC700] border border-[#FFC700]/50 shadow-sm'
                            : 'bg-[#1C1C20]/90 hover:bg-zinc-800/80 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">{preset.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold leading-tight">{preset.name}</h4>
                            <p className="text-[10px] text-zinc-500">{preset.brand}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#FFC700] text-black flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Info Footer */}
                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="truncate">{currentConfig.aspectDesc}</span>
                  <span className="text-[#FFC700] font-bold">Chính xác 100%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Pill Button (Collapsed Mode) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-[#141417]/90 hover:bg-[#1A1A1E] border border-zinc-700/80 text-white shadow-2xl backdrop-blur-xl transition-all active:scale-95 group"
            title="Đổi tỷ lệ hiển thị điện thoại"
          >
            <div className="w-6 h-6 rounded-lg bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center flex-shrink-0 border border-[#FFC700]/40 group-hover:scale-110 transition-transform">
              <Smartphone className="w-3.5 h-3.5" />
            </div>

            <div className="text-left">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 leading-tight">
                <span>{currentConfig.name}</span>
                <span className="text-[10px]">{currentConfig.icon}</span>
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium">Tỷ lệ màn hình PC</p>
            </div>

            <ChevronUp
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ml-1 ${
                isOpen ? 'rotate-180 text-[#FFC700]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Centered Phone Frame Mockup (No notch camera bar) */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className={`relative w-full h-[100dvh] sm:h-[820px] bg-black sm:shadow-[0_30px_90px_-20px_rgba(255,199,0,0.18),0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between z-10 mx-auto transition-all duration-300 ${currentConfig.containerClass}`}
      >
        {/* Inner Content Area */}
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
