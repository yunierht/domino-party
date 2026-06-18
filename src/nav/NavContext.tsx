import React, { createContext, useContext, useState } from 'react';

export type ScreenName =
  | 'home'
  | 'newMatch'
  | 'game'
  | 'history'
  | 'settings'
  | 'watch'
  | 'howto'
  | 'privacy';

interface NavContextValue {
  screen: ScreenName;
  go: (screen: ScreenName) => void;
  back: () => void;
  canGoBack: boolean;
  /** A game code from a deep link, to auto-join on the Watch screen. */
  pendingWatchCode: string | null;
  /** Jump to the Watch screen and auto-join the given code (from a link). */
  openWatch: (code: string) => void;
  /** Clear the pending code once consumed. */
  clearWatchCode: () => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ScreenName[]>(['home']);
  const [pendingWatchCode, setPendingWatchCode] = useState<string | null>(null);

  const go = (screen: ScreenName) => setStack((s) => [...s, screen]);
  const back = () =>
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const openWatch = (code: string) => {
    setPendingWatchCode(code.toUpperCase().trim());
    setStack((s) => (s[s.length - 1] === 'watch' ? s : [...s, 'watch']));
  };

  return (
    <NavContext.Provider
      value={{
        screen: stack[stack.length - 1],
        go,
        back,
        canGoBack: stack.length > 1,
        pendingWatchCode,
        openWatch,
        clearWatchCode: () => setPendingWatchCode(null),
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
