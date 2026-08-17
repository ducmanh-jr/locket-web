"use client";

import React from 'react';

interface DesktopPhoneFrameProps {
  children: React.ReactNode;
}

export const DesktopPhoneFrame: React.FC<DesktopPhoneFrameProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#09080c] text-zinc-100 flex items-center justify-center p-0 lg:p-3 font-sans overflow-hidden">
      {/* Ambient Gold Locket Glow in Background */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E5B849]/12 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Centered Phone Frame — Xiaomi 17 Ultra Responsive Fit */}
      <div className="relative w-full h-full lg:h-[min(800px,94vh)] lg:max-h-[94vh] bg-[#09080c] lg:shadow-[0_30px_90px_-20px_rgba(229,184,73,0.25),0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between z-10 mx-auto transition-all duration-300 rounded-none border-0 lg:w-[400px] lg:max-w-[95vw] lg:rounded-[2.6rem] lg:border-[7px] lg:border-[#1c1822] my-auto">
        {/* Inner Content Area */}
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
