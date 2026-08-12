"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'gold' | 'pink' | 'purple' | 'cyan' | 'emerald' | 'sunset' | 'silver' | 'rainbow';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  glow: string;
  bgTint: string;
  isRainbow?: boolean;
}

export const LOCKET_THEMES: Record<ThemeId, ThemeConfig> = {
  gold: {
    id: 'gold',
    name: 'Gold Classic',
    emoji: '⭐',
    primary: '#FFD700',
    secondary: '#FFA500',
    glow: 'rgba(255, 215, 0, 0.6)',
    bgTint: 'rgba(255, 215, 0, 0.05)',
  },
  pink: {
    id: 'pink',
    name: 'Neon Pink',
    emoji: '🌸',
    primary: '#FF69B4',
    secondary: '#FF1493',
    glow: 'rgba(255, 105, 180, 0.6)',
    bgTint: 'rgba(255, 105, 180, 0.06)',
  },
  purple: {
    id: 'purple',
    name: 'Purple Violet',
    emoji: '💜',
    primary: '#B829EA',
    secondary: '#7B2CBF',
    glow: 'rgba(184, 41, 234, 0.6)',
    bgTint: 'rgba(184, 41, 234, 0.06)',
  },
  cyan: {
    id: 'cyan',
    name: 'Neon Cyan',
    emoji: '🩵',
    primary: '#00E5FF',
    secondary: '#0099CC',
    glow: 'rgba(0, 229, 255, 0.6)',
    bgTint: 'rgba(0, 229, 255, 0.05)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    emoji: '💚',
    primary: '#00FF88',
    secondary: '#00CC6A',
    glow: 'rgba(0, 255, 136, 0.6)',
    bgTint: 'rgba(0, 255, 136, 0.05)',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    emoji: '🔥',
    primary: '#FF6B35',
    secondary: '#FF3E00',
    glow: 'rgba(255, 107, 53, 0.6)',
    bgTint: 'rgba(255, 107, 53, 0.06)',
  },
  silver: {
    id: 'silver',
    name: 'Silver Platinum',
    emoji: '🩶',
    primary: '#E0E0E0',
    secondary: '#9E9E9E',
    glow: 'rgba(224, 224, 224, 0.5)',
    bgTint: 'rgba(224, 224, 224, 0.04)',
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow Aura',
    emoji: '🌈',
    primary: '#FF007F',
    secondary: '#00F0FF',
    glow: 'rgba(255, 0, 255, 0.6)',
    bgTint: 'rgba(255, 255, 255, 0.04)',
    isRainbow: true,
  },
};

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'gold',
  themeConfig: LOCKET_THEMES.gold,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>('gold');

  useEffect(() => {
    const saved = localStorage.getItem('locket_gold_theme') as ThemeId;
    if (saved && LOCKET_THEMES[saved]) {
      setCurrentThemeState(saved);
    }
  }, []);

  const setTheme = (themeId: ThemeId) => {
    if (!LOCKET_THEMES[themeId]) return;
    setCurrentThemeState(themeId);
    localStorage.setItem('locket_gold_theme', themeId);
  };

  const themeConfig = LOCKET_THEMES[currentTheme] || LOCKET_THEMES.gold;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', themeConfig.primary);
    root.style.setProperty('--theme-secondary', themeConfig.secondary);
    root.style.setProperty('--theme-glow', themeConfig.glow);
    root.style.setProperty('--theme-bg-tint', themeConfig.bgTint);
    root.setAttribute('data-locket-theme', currentTheme);
  }, [currentTheme, themeConfig]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
