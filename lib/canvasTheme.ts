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
    glowColor: 'rgba(163, 55, 87, 0.45)',
    swatchColors: ['#A33757', '#852E4E', '#4C1D3D'],
    description: 'Tông mận rượu vang quyến rũ (chuẩn bảng màu bạn yêu thích)',
  },
  {
    id: 'indigo',
    name: 'Midnight Indigo',
    emoji: '🌌',
    gradient: 'radial-gradient(circle at 50% 30%, #201548 0%, #110A2B 55%, #050312 100%)',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    swatchColors: ['#818CF8', '#4F46E5', '#201548'],
    description: 'Tông tím chàm đêm sâu huyền bí',
  },
  {
    id: 'espresso',
    name: 'Espresso Velvet',
    emoji: '☕',
    gradient: 'radial-gradient(circle at 50% 30%, #2D1A1A 0%, #1A0D0D 55%, #0C0404 100%)',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    swatchColors: ['#F87171', '#991B1B', '#2D1A1A'],
    description: 'Tông cà phê Espresso ấm áp cao cấp',
  },
  {
    id: 'emerald',
    name: 'Forest Sanctuary',
    emoji: '🌿',
    gradient: 'radial-gradient(circle at 50% 30%, #0E281E 0%, #081711 55%, #030A07 100%)',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    swatchColors: ['#34D399', '#059669', '#0E281E'],
    description: 'Tông xanh lục bảo rừng thẳm tĩnh lặng',
  },
  {
    id: 'aurora',
    name: 'Aurora Nebula',
    emoji: '✨',
    gradient: 'radial-gradient(circle at 50% 30%, #27103E 0%, #150724 55%, #07020F 100%)',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    swatchColors: ['#C084FC', '#7E22CE', '#27103E'],
    description: 'Tông cực quang vũ trụ mơ mộng',
  },
  {
    id: 'obsidian',
    name: 'Stealth Obsidian',
    emoji: '🖤',
    gradient: 'linear-gradient(180deg, #0f0f11 0%, #050506 50%, #000000 100%)',
    glowColor: 'rgba(255, 255, 255, 0.15)',
    swatchColors: ['#D4D4D8', '#52525B', '#09090B'],
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
