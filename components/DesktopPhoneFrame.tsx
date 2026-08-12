"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-[#000000] text-zinc-100 flex items-center justify-center p-0 lg:p-3 font-sans overflow-hidden relative">
      {/* Ambient Pink Locket Glow in Background */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2A85]/8 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Centered Phone Frame — Xiaomi 17 Ultra Responsive Fit */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full h-full lg:h-[min(800px,94vh)] lg:max-h-[94vh] bg-black lg:shadow-[0_30px_90px_-20px_rgba(255,42,133,0.18),0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between z-10 mx-auto transition-all duration-300 rounded-none border-0 lg:w-[400px] lg:max-w-[95vw] lg:rounded-[2.6rem] lg:border-[7px] lg:border-[#1A1A1E] my-auto"
      >
        {/* Inner Content Area */}
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
