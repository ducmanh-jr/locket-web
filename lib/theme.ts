"use client";

export interface LocketTheme {
  id: string;
  name: string;
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
    name: 'Rose Velvet',
    primaryColor: '#D9266E',
    accentColor: '#FF2A85',
    bgGradient: 'linear-gradient(180deg, #180e2d 0%, #10091D 50%, #0b0515 100%)',
    glowColor: 'rgba(217, 38, 110, 0.35)',
    previewGradient: 'linear-gradient(135deg, #FF2A85 0%, #D9266E 100%)',
    description: 'Tông màu Rose Velvet kính mờ nguyên bản của Locket.',
  },
  {
    id: 'gold',
    name: 'Champagne Gold',
    primaryColor: '#E5C158',
    accentColor: '#F3D477',
    bgGradient: 'linear-gradient(180deg, #221a0f 0%, #161009 50%, #0d0905 100%)',
    glowColor: 'rgba(229, 193, 88, 0.35)',
    previewGradient: 'linear-gradient(135deg, #F3D477 0%, #E5C158 50%, #C69C3A 100%)',
    description: 'Tông màu Champagne Gold sang trọng chuẩn Locket Gold VIP.',
  },
  {
    id: 'midnight',
    name: 'Obsidian Midnight',
    primaryColor: '#E2E8F0',
    accentColor: '#FFFFFF',
    bgGradient: 'linear-gradient(180deg, #18181b 0%, #09090B 50%, #000000 100%)',
    glowColor: 'rgba(226, 232, 240, 0.25)',
    previewGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #71717A 100%)',
    description: 'Tông màu đen bạch kim tối giản, tinh tế chuẩn phong cách Apple.',
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
  root.style.setProperty('--theme-primary', theme.primaryColor);
  root.style.setProperty('--theme-accent', theme.accentColor);
  root.style.setProperty('--theme-glow', theme.glowColor);
}
