"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Đang tải khoảnh khắc..." }) => {
  return (
    <div className="w-full h-full min-h-full flex flex-col items-center justify-center bg-[#0c060a] text-white select-none relative overflow-hidden p-6">
      {/* Background Ambient Dark Velvet Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D9266E]/20 rounded-full blur-[110px] pointer-events-none z-0"
      />

      {/* Center Animated Logo & Rings */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-28 h-28 flex items-center justify-center"
        >
          {/* Spinning Rose Neon Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1.5 rounded-full p-[2px] bg-gradient-to-tr from-[#D9266E] via-pink-500/80 to-transparent shadow-[0_0_20px_rgba(217,38,110,0.5)]"
          />

          {/* Pulsing Core Icon Container */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-[#140811] border border-[#D9266E]/40 p-3 flex items-center justify-center shadow-[0_0_25px_rgba(217,38,110,0.3)] relative z-10 overflow-hidden"
          >
            <img
              src="/icon.svg"
              alt="Locket Logo"
              className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(217,38,110,0.6)]"
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
          <h1 className="text-2xl font-black tracking-tight text-white">
            Locket<span className="text-[#D9266E]">Web</span>
          </h1>

          {/* Sleek Progress Indicator Bar */}
          <div className="w-36 h-1 bg-zinc-900 rounded-full overflow-hidden relative mx-auto border border-white/10">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full h-full bg-gradient-to-r from-transparent via-[#D9266E] to-transparent rounded-full shadow-[0_0_12px_#D9266E]"
            />
          </div>

          <p className="text-xs font-bold text-zinc-400 tracking-wide animate-pulse">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
