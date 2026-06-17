import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeName, THEMES } from './themes';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  /** Scale a base font/size by the active theme's scale factor. */
  s: (n: number) => number;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('modern');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadJSON<ThemeName>(KEYS.theme, 'modern').then((name) => {
      if (THEMES[name]) setThemeNameState(name);
      setReady(true);
    });
  }, []);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    saveJSON(KEYS.theme, name);
  };

  const theme = THEMES[themeName];
  const s = (n: number) => Math.round(n * theme.scale);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, s, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
