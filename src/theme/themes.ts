// Visual themes. Each theme is a full palette + sizing scale so switching it
// restyles the entire app. Themes other than "modern" also paint a textured
// background (see components/Background.tsx), recreated from reference images.

export type ThemeName = 'dark' | 'casino' | 'cubano' | 'usa' | 'carbon';

/** Which textured background a theme paints behind the app. */
export type BackgroundKind = 'carbon' | 'sportCarbon' | 'casino' | 'cubano' | 'usa' | undefined;

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

// Sport carbon fiber theme inspired by performance car interiors.
const dark: Theme = {
  name: 'dark',
  dark: true,
  colors: {
    bg: '#040506',
    surface: '#0D1013',
    surfaceAlt: '#171B20',
    primary: '#E4B452',
    onPrimary: '#16100A',
    text: '#F6F1E7',
    textMuted: '#A6A19A',
    border: '#343A42',
    success: '#72B86B',
    danger: '#D34A3F',
    gradient: ['#F1C46B', '#B8832F'],
    teamA: '#E4B452',
    teamB: '#D34A3F',
  },
  radius: 14,
  scale: 1,
  background: 'sportCarbon',
};

// Image 2 — black carbon halftone.
const carbon: Theme = {
  name: 'carbon',
  dark: true,
  colors: {
    bg: '#050607',
    surface: '#101215',
    surfaceAlt: '#1A1D21',
    primary: '#D7A63D',
    onPrimary: '#241608',
    text: '#F3EDE0',
    textMuted: '#9B978E',
    border: '#33363B',
    success: '#82B86D',
    danger: '#AA463B',
    gradient: ['#E3B757', '#8B581F'],
    teamA: '#D7A63D',
    teamB: '#AA463B',
  },
  radius: 14,
  scale: 1,
  background: 'carbon',
};

// Green felt casino theme, inspired by poker table cloth and brass trim.
const casino: Theme = {
  name: 'casino',
  dark: true,
  colors: {
    bg: '#04130D',
    surface: '#0B2418',
    surfaceAlt: '#123522',
    primary: '#D6AE54',
    onPrimary: '#171006',
    text: '#F5EFE1',
    textMuted: '#A9B9A8',
    border: '#2B5A3C',
    success: '#5ED17A',
    danger: '#C9473F',
    gradient: ['#E7C777', '#9E6E24'],
    teamA: '#D6AE54',
    teamB: '#C9473F',
  },
  radius: 14,
  scale: 1,
  background: 'casino',
};

// Image 3 — Cuban–American domino board (flag motif).
const cubano: Theme = {
  name: 'cubano',
  dark: true,
  colors: {
    bg: '#0E1722',
    surface: '#172230',
    surfaceAlt: '#21303F',
    primary: '#D2515F',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#9FB0C0',
    border: '#2A3A4A',
    success: '#2E9E5B',
    danger: '#D2515F',
    gradient: ['#2E69B8', '#D2515F'],
    teamA: '#2E69B8',
    teamB: '#D2515F',
  },
  radius: 14,
  scale: 1,
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
    primary: '#CB4F5B',
    onPrimary: '#FFFFFF',
    text: '#F2F4F8',
    textMuted: '#9FB0C0',
    border: '#2A3450',
    success: '#2E9E5B',
    danger: '#CB4F5B',
    gradient: ['#3D4C96', '#CB4F5B'],
    teamA: '#4A66B5',
    teamB: '#CB4F5B',
  },
  radius: 14,
  scale: 1,
  background: 'usa',
};

export const THEMES: Record<ThemeName, Theme> = { dark, casino, cubano, usa, carbon };
