"use client";

import React from 'react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#000000] text-zinc-100 flex items-center justify-center p-0 lg:p-3 font-sans overflow-hidden">
      {/* Ambient Theme Glow in Background */}
      <div
        className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 transition-all duration-500"
        style={{ background: 'var(--theme-primary)', opacity: 0.12 }}
      />

      {/* Centered Phone Frame — Xiaomi 17 Ultra Responsive Fit */}
      <div
        className="relative w-full h-full lg:h-[min(800px,94vh)] lg:max-h-[94vh] overflow-hidden flex flex-col justify-between z-10 mx-auto transition-all duration-300 rounded-none border-0 lg:w-[400px] lg:max-w-[95vw] lg:rounded-[2.6rem] lg:border-[7px] lg:border-white/10 my-auto shadow-2xl"
        style={{ background: 'var(--theme-bg-gradient)' }}
      >
        {/* Inner Content Area */}
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
