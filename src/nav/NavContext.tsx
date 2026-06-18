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
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ScreenName[]>(['home']);

  const go = (screen: ScreenName) => setStack((s) => [...s, screen]);
  const back = () =>
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  return (
    <NavContext.Provider
      value={{
        screen: stack[stack.length - 1],
        go,
        back,
        canGoBack: stack.length > 1,
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
