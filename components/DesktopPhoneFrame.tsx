"use client";

import React, { useState } from 'react';
import { Smartphone, Check, Sparkles, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const currentConfig =
    DEVICE_PRESETS.find((p) => p.id === selectedDevice) || DEVICE_PRESETS[0];

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#000000] text-zinc-100 flex items-center justify-center p-0 lg:p-6 font-sans selection:bg-[#FFC700] selection:text-black overflow-hidden relative">
      {/* Ambient Yellow Locket Glow in Background */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFC700]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Left Side Floating Device Switcher Panel (PC Only) */}
      <div className="hidden lg:flex flex-col space-y-3 absolute left-8 top-1/2 -translate-y-1/2 z-40 max-w-[220px]">
        <div className="bg-[#141417]/90 border border-zinc-800/90 backdrop-blur-md rounded-3xl p-4 shadow-2xl text-left space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800/80">
            <Smartphone className="w-4 h-4 text-[#FFC700]" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              Tỷ lệ Điện thoại
            </span>
          </div>

          <p className="text-zinc-400 text-[11px]">
            Chọn thiết bị để giả lập góc nhìn Locket trên PC:
          </p>

          <div className="space-y-1.5">
            {DEVICE_PRESETS.map((preset) => {
              const isSelected = selectedDevice === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedDevice(preset.id)}
                  className={`w-full p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all active:scale-95 text-left ${
                    isSelected
                      ? 'bg-[#FFC700]/20 text-[#FFC700] border border-[#FFC700]/40 shadow-sm'
                      : 'bg-[#1C1C20] hover:bg-zinc-800 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{preset.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{preset.name}</h4>
                      <p className="text-[10px] text-zinc-500">{preset.brand}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FFC700] stroke-[3]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 text-[10px] text-zinc-500 border-t border-zinc-800/80">
            <span>{currentConfig.aspectDesc}</span>
          </div>
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
