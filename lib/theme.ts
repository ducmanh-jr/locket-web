"use client";

export interface LocketTheme {
  id: string;
  name: string;
  emoji: string;
  iconName: 'flower' | 'sparkles' | 'moon' | 'waves' | 'crown' | 'clover' | 'heart';
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
    iconName: 'flower',
    primaryColor: '#852E4E',
    accentColor: '#A33757',
    bgGradient: 'linear-gradient(180deg, #4C1D3D 0%, #35132B 30%, #220B1B 60%, #12040E 100%)',
    glowColor: 'rgba(133, 46, 78, 0.4)',
    previewGradient: 'linear-gradient(135deg, #7A2242 0%, #4D162B 100%)',
    description: 'Tông mận rượu vang quyến rũ quý phái',
  },
  {
    id: 'rose',
    name: 'Rose Velvet',
    emoji: '🌸',
    iconName: 'sparkles',
    primaryColor: '#D9266E',
    accentColor: '#FF2A85',
    bgGradient: 'linear-gradient(180deg, #1f1035 0%, #18102a 30%, #130d22 60%, #0e0919 100%)',
    glowColor: 'rgba(217, 38, 110, 0.35)',
    previewGradient: 'linear-gradient(135deg, #A82E5C 0%, #6E1A3C 100%)',
    description: 'Tông hồng nhung kính mờ Locket tinh tế',
  },
  {
    id: 'indigo',
    name: 'Indigo Dusk',
    emoji: '🌌',
    iconName: 'moon',
    primaryColor: '#6366F1',
    accentColor: '#818CF8',
    bgGradient: 'linear-gradient(180deg, #201548 0%, #19103a 30%, #130d30 60%, #0d0924 100%)',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    previewGradient: 'linear-gradient(135deg, #3A235C 0%, #201338 100%)',
    description: 'Tím chàm đêm hoàng hôn tĩnh lặng',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    iconName: 'waves',
    primaryColor: '#0EA5E9',
    accentColor: '#38BDF8',
    bgGradient: 'linear-gradient(180deg, #0e1c32 0%, #0b1628 30%, #091220 60%, #060e1a 100%)',
    glowColor: 'rgba(14, 165, 233, 0.35)',
    previewGradient: 'linear-gradient(135deg, #1A5478 0%, #0F334C 100%)',
    description: 'Xanh đại dương sâu thẳm sang trọng',
  },
  {
    id: 'gold',
    name: 'Champagne Gold',
    emoji: '👑',
    iconName: 'crown',
    primaryColor: '#D4AF37',
    accentColor: '#E5C158',
    bgGradient: 'linear-gradient(180deg, #201a10 0%, #1a150c 30%, #141008 60%, #0e0b05 100%)',
    glowColor: 'rgba(212, 175, 55, 0.35)',
    previewGradient: 'linear-gradient(135deg, #8C733E 0%, #594723 100%)',
    description: 'Vàng sampa metallic nhám mờ VIP',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    emoji: '🍀',
    iconName: 'clover',
    primaryColor: '#10B981',
    accentColor: '#34D399',
    bgGradient: 'linear-gradient(180deg, #0d2219 0%, #0a1b14 30%, #081510 60%, #05100c 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    previewGradient: 'linear-gradient(135deg, #1C4D38 0%, #0F3324 100%)',
    description: 'Xanh mộc rừng sâu tĩnh mịch',
  },
  {
    id: 'midnight',
    name: 'Obsidian Black',
    emoji: '🖤',
    iconName: 'heart',
    primaryColor: '#A1A1AA',
    accentColor: '#D4D4D8',
    bgGradient: 'linear-gradient(180deg, #161618 0%, #111113 30%, #0c0c0e 60%, #050506 100%)',
    glowColor: 'rgba(161, 161, 170, 0.2)',
    previewGradient: 'linear-gradient(135deg, #2D2E33 0%, #15161A 100%)',
    description: 'Đen than chì Obsidian tối giản',
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
