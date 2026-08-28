"use client";

export interface LocketTheme {
  id: string;
  name: string;
  emoji: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  glowColor: string;
  previewGradient: string;
  description: string;
}

export const LOCKET_THEMES: LocketTheme[] = [
  {
    id: 'wine',
    name: 'Wine Mulberry',
    emoji: '🍇',
    primaryColor: '#A33757',
    accentColor: '#C74B72',
    bgGradient: 'linear-gradient(180deg, #4C1D3D 0%, #35132B 30%, #220B1B 60%, #12040E 100%)',
    glowColor: 'rgba(163, 55, 87, 0.4)',
    previewGradient: 'linear-gradient(135deg, #A33757 0%, #852E4E 50%, #4C1D3D 100%)',
    description: 'Tông mận rượu vang quyến rũ (#4C1D3D)',
  },
  {
    id: 'rose',
    name: 'Rose Velvet',
    emoji: '🌸',
    primaryColor: '#D9266E',
    accentColor: '#FF2A85',
    bgGradient: 'linear-gradient(180deg, #1f1035 0%, #18102a 30%, #130d22 60%, #0e0919 100%)',
    glowColor: 'rgba(217, 38, 110, 0.35)',
    previewGradient: 'linear-gradient(135deg, #FF2A85 0%, #D9266E 100%)',
    description: 'Tông hồng nhung kính mờ Locket',
  },
  {
    id: 'indigo',
    name: 'Indigo Dusk',
    emoji: '🌌',
    primaryColor: '#818CF8',
    accentColor: '#A5B4FC',
    bgGradient: 'linear-gradient(180deg, #201548 0%, #19103a 30%, #130d30 60%, #0d0924 100%)',
    glowColor: 'rgba(129, 140, 248, 0.3)',
    previewGradient: 'linear-gradient(135deg, #A5B4FC 0%, #818CF8 50%, #6366F1 100%)',
    description: 'Tím hoàng hôn sâu chuẩn Locket',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    primaryColor: '#38BDF8',
    accentColor: '#7DD3FC',
    bgGradient: 'linear-gradient(180deg, #0e1c32 0%, #0b1628 30%, #091220 60%, #060e1a 100%)',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    previewGradient: 'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 50%, #0EA5E9 100%)',
    description: 'Xanh đại dương sâu thẳm',
  },
  {
    id: 'gold',
    name: 'Champagne Gold',
    emoji: '👑',
    primaryColor: '#E5C158',
    accentColor: '#F3D477',
    bgGradient: 'linear-gradient(180deg, #201a10 0%, #1a150c 30%, #141008 60%, #0e0b05 100%)',
    glowColor: 'rgba(229, 193, 88, 0.3)',
    previewGradient: 'linear-gradient(135deg, #F3D477 0%, #E5C158 50%, #C69C3A 100%)',
    description: 'Vàng sampa sang trọng Locket Gold VIP',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    emoji: '🍀',
    primaryColor: '#34D399',
    accentColor: '#6EE7B7',
    bgGradient: 'linear-gradient(180deg, #0d2219 0%, #0a1b14 30%, #081510 60%, #05100c 100%)',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    previewGradient: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
    description: 'Xanh lá rừng sâu tĩnh lặng',
  },
  {
    id: 'midnight',
    name: 'Obsidian Black',
    emoji: '🖤',
    primaryColor: '#A1A1AA',
    accentColor: '#D4D4D8',
    bgGradient: 'linear-gradient(180deg, #161618 0%, #111113 30%, #0c0c0e 60%, #050506 100%)',
    glowColor: 'rgba(161, 161, 170, 0.2)',
    previewGradient: 'linear-gradient(135deg, #D4D4D8 0%, #A1A1AA 50%, #71717A 100%)',
    description: 'Đen thuần AMOLED tối giản',
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
