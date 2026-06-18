// Visual themes. Each theme is a full palette + sizing scale so switching it
// restyles the entire app. Themes other than "modern" also paint a textured
// background (see components/Background.tsx), recreated from reference images.

export type ThemeName = 'dark' | 'cubano' | 'usa' | 'carbon';

/** Which textured background a theme paints behind the app. */
export type BackgroundKind = 'carbon' | 'cubano' | 'usa' | undefined;

export interface Theme {
  name: ThemeName;
  dark: boolean;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    onPrimary: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    danger: string;
    /** Two-stop gradient used for headers / hero scoreboard. */
    gradient: [string, string];
    /** Accent for the second team, to visually separate the two sides. */
    teamA: string;
    teamB: string;
  };
  radius: number;
  /** Multiplier applied to every font size and to control heights. */
  scale: number;
  /** Optional serif feel for some themes. */
  fontFamily?: string;
  /** Textured background painted behind all screens. */
  background?: BackgroundKind;
}

// Plain solid dark theme (no textured background).
const dark: Theme = {
  name: 'dark',
  dark: true,
  colors: {
    bg: '#0C0E12',
    surface: '#161A22',
    surfaceAlt: '#212733',
    primary: '#5B8DEF',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#8A93A6',
    border: '#2A303C',
    success: '#22C55E',
    danger: '#EF4444',
    gradient: ['#5B8DEF', '#22D3EE'],
    teamA: '#5B8DEF',
    teamB: '#F472B6',
  },
  radius: 16,
  scale: 1,
};

// Image 2 — black carbon halftone.
const carbon: Theme = {
  name: 'carbon',
  dark: true,
  colors: {
    bg: '#070709',
    surface: '#14161B',
    surfaceAlt: '#1D2026',
    primary: '#22D3EE',
    onPrimary: '#06121A',
    text: '#F4F4F5',
    textMuted: '#73737D',
    border: '#26262C',
    success: '#22C55E',
    danger: '#FB7185',
    gradient: ['#22D3EE', '#A78BFA'],
    teamA: '#22D3EE',
    teamB: '#A78BFA',
  },
  radius: 14,
  scale: 1,
  background: 'carbon',
};

// Image 3 — Cuban–American domino board (flag motif).
const cubano: Theme = {
  name: 'cubano',
  dark: true,
  colors: {
    bg: '#0E1722',
    surface: '#172230',
    surfaceAlt: '#21303F',
    primary: '#C2283B',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#9FB0C0',
    border: '#2A3A4A',
    success: '#2E9E5B',
    danger: '#C2283B',
    gradient: ['#1E5AA8', '#C2283B'],
    teamA: '#1E5AA8',
    teamB: '#C2283B',
  },
  radius: 14,
  scale: 1.05,
  background: 'cubano',
};

// USA domino board (stars & stripes flag motif), sibling to cubano.
const usa: Theme = {
  name: 'usa',
  dark: true,
  colors: {
    bg: '#0A0F1C',
    surface: '#141B2C',
    surfaceAlt: '#1E2740',
    primary: '#B22234',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#9FB0C0',
    border: '#2A3450',
    success: '#2E9E5B',
    danger: '#B22234',
    gradient: ['#3C3B6E', '#B22234'],
    teamA: '#3C5BA8',
    teamB: '#B22234',
  },
  radius: 14,
  scale: 1.05,
  background: 'usa',
};

export const THEMES: Record<ThemeName, Theme> = { dark, cubano, usa, carbon };

