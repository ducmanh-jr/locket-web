"use client";

export interface LocketTheme {
  id: string;
  name: string;
  badge: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  glowColor: string;
  previewGradient: string;
  description: string;
}

export const LOCKET_THEMES: LocketTheme[] = [
  {
    id: 'rose',
    name: 'Dark Rose (Mặc Định)',
    badge: 'Signature',
    primaryColor: '#D9266E',
    accentColor: '#FF2A85',
    bgGradient: 'linear-gradient(180deg, #180e2d 0%, #10091D 50%, #0b0515 100%)',
    glowColor: 'rgba(217, 38, 110, 0.5)',
    previewGradient: 'linear-gradient(135deg, #FF2A85 0%, #D9266E 50%, #BE185D 100%)',
    description: 'Phong cách Dark Rose kính mờ quý phái độc quyền Locket.',
  },
  {
    id: 'gold',
    name: 'Locket Gold Hoàng Gia',
    badge: 'Premium Gold',
    primaryColor: '#F59E0B',
    accentColor: '#FBBF24',
    bgGradient: 'linear-gradient(180deg, #241705 0%, #170F03 50%, #0d0801 100%)',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    previewGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
    description: 'Chủ đề ánh kim Locket Gold sang trọng dành cho tài khoản VIP.',
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    badge: 'Electric',
    primaryColor: '#06B6D4',
    accentColor: '#38BDF8',
    bgGradient: 'linear-gradient(180deg, #0e1726 0%, #090D16 50%, #05070d 100%)',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    previewGradient: 'linear-gradient(135deg, #38BDF8 0%, #06B6D4 50%, #8B5CF6 100%)',
    description: 'Tông màu viễn tưởng Neon Cyan & Violet rực rỡ.',
  },
  {
    id: 'emerald',
    name: 'Ngọc Lục Bảo',
    badge: 'Emerald',
    primaryColor: '#10B981',
    accentColor: '#34D399',
    bgGradient: 'linear-gradient(180deg, #0b2219 0%, #061510 50%, #030b08 100%)',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    previewGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)',
    description: 'Sắc xanh ngọc lục bảo huyền bí, thanh lịch và tươi mát.',
  },
  {
    id: 'midnight',
    name: 'Bạch Kim Obsidian',
    badge: 'Platinum',
    primaryColor: '#E2E8F0',
    accentColor: '#FFFFFF',
    bgGradient: 'linear-gradient(180deg, #18181b 0%, #09090B 50%, #000000 100%)',
    glowColor: 'rgba(226, 232, 240, 0.4)',
    previewGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
    description: 'Tông màu đen trắng tối giản, hiện đại chuẩn phong cách Minimalist.',
  },
];

const THEME_STORAGE_KEY = 'locket_active_theme_v1';

export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'rose';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && LOCKET_THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch (e) {}
  return 'rose';
}

export function saveStoredTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    applyThemeToDocument(themeId);
  } catch (e) {}
}

export function applyThemeToDocument(themeId: string): void {
  if (typeof window === 'undefined') return;
  const theme = LOCKET_THEMES.find((t) => t.id === themeId) || LOCKET_THEMES[0];
  const root = document.documentElement;

  root.setAttribute('data-locket-theme', theme.id);
  root.style.setProperty('--locket-rose', theme.primaryColor);
  root.style.setProperty('--locket-rose-dark', theme.accentColor);
  root.style.setProperty('--locket-theme-glow', theme.glowColor);
}
