"use client";

export interface CanvasTheme {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  swatchColors: [string, string, string];
  description: string;
}

export const CANVAS_THEMES: CanvasTheme[] = [
  {
    id: 'wine',
    name: 'Wine Mulberry',
    emoji: '🍇',
    gradient: 'radial-gradient(circle at 50% 30%, #4C1D3D 0%, #2A0E22 55%, #12040E 100%)',
    glowColor: 'rgba(133, 46, 78, 0.45)',
    swatchColors: ['#7A2242', '#5A1730', '#3B0E1F'],
    description: 'Tông mận rượu vang quyến rũ tinh tế',
  },
  {
    id: 'indigo',
    name: 'Midnight Indigo',
    emoji: '🌌',
    gradient: 'radial-gradient(circle at 50% 30%, #201548 0%, #110A2B 55%, #050312 100%)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    swatchColors: ['#3A235C', '#271742', '#160B28'],
    description: 'Tông tím chàm đêm sâu huyền bí',
  },
  {
    id: 'espresso',
    name: 'Espresso Velvet',
    emoji: '☕',
    gradient: 'radial-gradient(circle at 50% 30%, #2D1A1A 0%, #1A0D0D 55%, #0C0404 100%)',
    glowColor: 'rgba(180, 80, 80, 0.35)',
    swatchColors: ['#4A2B2B', '#331B1B', '#1F0F0F'],
    description: 'Tông cà phê Espresso ấm áp cao cấp',
  },
  {
    id: 'emerald',
    name: 'Forest Sanctuary',
    emoji: '🌿',
    gradient: 'radial-gradient(circle at 50% 30%, #0E281E 0%, #081711 55%, #030A07 100%)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    swatchColors: ['#1C4D38', '#123626', '#091E15'],
    description: 'Tông xanh lục bảo rừng thẳm tĩnh lặng',
  },
  {
    id: 'aurora',
    name: 'Aurora Nebula',
    emoji: '✨',
    gradient: 'radial-gradient(circle at 50% 30%, #27103E 0%, #150724 55%, #07020F 100%)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    swatchColors: ['#4A206B', '#31124A', '#1C082E'],
    description: 'Tông cực quang vũ trụ mơ mộng',
  },
  {
    id: 'obsidian',
    name: 'Stealth Obsidian',
    emoji: '🖤',
    gradient: 'linear-gradient(180deg, #0f0f11 0%, #050506 50%, #000000 100%)',
    glowColor: 'rgba(255, 255, 255, 0.15)',
    swatchColors: ['#3F3F46', '#27272A', '#18181B'],
    description: 'Tông đen thuần tối giản sang trọng',
  },
];

const CANVAS_STORAGE_KEY = 'locket_canvas_theme_v1';

export function getStoredCanvasTheme(): string {
  if (typeof window === 'undefined') return 'wine';
  try {
    const stored = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (stored && CANVAS_THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch (e) {}
  return 'wine';
}

export function saveStoredCanvasTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANVAS_STORAGE_KEY, themeId);
    applyCanvasThemeToDocument(themeId);
  } catch (e) {}
}

export function applyCanvasThemeToDocument(themeId: string): void {
  if (typeof window === 'undefined') return;
  const theme = CANVAS_THEMES.find((t) => t.id === themeId) || CANVAS_THEMES[0];
  const root = document.documentElement;

  root.style.setProperty('--canvas-bg-gradient', theme.gradient);
  root.style.setProperty('--canvas-glow-color', theme.glowColor);
}
