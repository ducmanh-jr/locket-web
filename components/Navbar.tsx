"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Camera, Grid, User } from 'lucide-react';

interface NavbarProps {
  onOpenCamera?: () => void;
  pendingRequestsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCamera, pendingRequestsCount = 0 }) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/friends', label: 'Bạn bè', icon: Users, badge: pendingRequestsCount },
    { href: '/camera', label: 'Chụp ảnh', icon: Camera, isCamera: true },
    { href: '/history', label: 'Lịch sử', icon: Grid },
    { href: '/profile', label: 'Cá nhân', icon: User },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 w-full max-w-sm mx-auto px-4 pb-4 pt-2 pointer-events-none flex justify-center mt-auto">
      <div className="pointer-events-auto bg-[#18181C]/90 backdrop-blur-xl border border-[#2C2C34]/80 rounded-full px-4 py-2 flex items-center justify-around shadow-2xl shadow-black/80">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCamera) {
            return (
              <button
                key={item.href}
                onClick={onOpenCamera}
                className="relative group focus:outline-none -mt-4 transition-transform active:scale-95"
                title="Chụp ảnh mới"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FFC700] via-[#FFE680] to-[#FFC700] p-[3px] shadow-locket-glow animate-pulse-slow">
                  <div className="w-full h-full bg-[#0E0E10] rounded-full flex items-center justify-center text-[#FFC700] group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-[#FFC700] font-medium scale-110'
                  : 'text-zinc-400 hover:text-zinc-200 hover:scale-105'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
