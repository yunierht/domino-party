// Visual themes. Each theme is a full palette + sizing scale so switching it
// restyles the entire app. "grande" bumps the scale for older players.

export type ThemeName = 'modern' | 'cubano' | 'grande';

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
  /** Optional serif feel for the vintage theme. */
  fontFamily?: string;
}

const modern: Theme = {
  name: 'modern',
  dark: true,
  colors: {
    bg: '#0F1115',
    surface: '#1A1E27',
    surfaceAlt: '#232936',
    primary: '#6C5CE7',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#8A93A6',
    border: '#2C3340',
    success: '#22C55E',
    danger: '#EF4444',
    gradient: ['#6C5CE7', '#00B4D8'],
    teamA: '#6C5CE7',
    teamB: '#00B4D8',
  },
  radius: 18,
  scale: 1,
};

const cubano: Theme = {
  name: 'cubano',
  dark: false,
  colors: {
    bg: '#F3E7C9',
    surface: '#FBF3DD',
    surfaceAlt: '#EFDEB3',
    primary: '#B11E2B', // domino red
    onPrimary: '#FFF8E7',
    text: '#3A2417',
    textMuted: '#8A6B4F',
    border: '#D8B98A',
    success: '#2E7D32',
    danger: '#B11E2B',
    gradient: ['#1E5AA8', '#B11E2B'], // Cuban blue -> red
    teamA: '#1E5AA8',
    teamB: '#B11E2B',
  },
  radius: 10,
  scale: 1.02,
  fontFamily: undefined,
};

const grande: Theme = {
  name: 'grande',
  dark: false,
  colors: {
    bg: '#FFFFFF',
    surface: '#F4F6FA',
    surfaceAlt: '#E8ECF3',
    primary: '#0B61D1',
    onPrimary: '#FFFFFF',
    text: '#101418',
    textMuted: '#4A5663',
    border: '#C2CCD9',
    success: '#147A34',
    danger: '#C81E1E',
    gradient: ['#0B61D1', '#0B8FD1'],
    teamA: '#0B61D1',
    teamB: '#C81E1E',
  },
  radius: 16,
  scale: 1.35, // big text & controls for readability
};

export const THEMES: Record<ThemeName, Theme> = { modern, cubano, grande };
