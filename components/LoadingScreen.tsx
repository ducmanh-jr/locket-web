"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Đang tải khoảnh khắc..." }) => {
  return (
    <div className="w-full h-full min-h-full flex flex-col items-center justify-center bg-[#3D1F3D] text-white select-none relative overflow-hidden p-6">
      {/* Background Ambient Deep Violet Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#8D769A]/25 rounded-full blur-[110px] pointer-events-none z-0"
      />

      {/* Center Animated Logo & Rings */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-28 h-28 flex items-center justify-center"
        >
          {/* Spinning Violet-Lavender Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1.5 rounded-full p-[2px] bg-gradient-to-tr from-[#8D769A] via-[#B3A3BA] to-transparent shadow-[0_0_22px_rgba(141,118,154,0.6)]"
          />

          {/* Pulsing Core Icon Container */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-[#140d18] border border-[#8D769A]/50 p-3 flex items-center justify-center shadow-[0_0_25px_rgba(141,118,154,0.35)] relative z-10 overflow-hidden"
          >
            <img
              src="/icon.svg"
              alt="Locket Logo"
              className="w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(179,163,186,0.6)]"
            />
          </motion.div>
        </motion.div>

        {/* Title & Animated Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center space-y-3"
        >
          <h1 className="text-2xl font-black tracking-tight text-[#D9D8D9]">
            Locket<span className="text-[#B3A3BA]">Web</span>
          </h1>

          {/* Sleek Progress Indicator Bar */}
          <div className="w-36 h-1 bg-[#1a1220] rounded-full overflow-hidden relative mx-auto border border-white/10">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full h-full bg-gradient-to-r from-transparent via-[#B3A3BA] to-transparent rounded-full shadow-[0_0_12px_#8D769A]"
            />
          </div>

          <p className="text-xs font-bold text-[#B3A3BA]/80 tracking-wide animate-pulse">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
