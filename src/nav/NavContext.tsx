import React, { createContext, useContext, useEffect, useState } from 'react';
import {BackHandler} from 'react-native';
import type { Match } from '../types';

export type ScreenName =
  | 'home'
  | 'newMatch'
  | 'game'
  | 'computerGame'
  | 'pokerLobby'
  | 'blackjackLobby'
  | 'blackjackTable'
  | 'history'
  | 'stats'
  | 'settings'
  | 'watch'
  | 'watchHistory'
  | 'howto'
  | 'privacy';

interface NavContextValue {
  screen: ScreenName;
  go: (screen: ScreenName) => void;
  back: () => void;
  openSetup:(mode?:'new'|'edit')=>void;
  setupMode:'new'|'edit';
  goHome:()=>void;
  canGoBack: boolean;
  /** A game code from a deep link, to auto-join on the Watch screen. */
  pendingWatchCode: string | null;
  /** Jump to the Watch screen and auto-join the given code (from a link). */
  openWatch: (code: string) => void;
  /** Clear the pending code once consumed. */
  clearWatchCode: () => void;
  /** Open the normal History UI for a followed history space in read-only mode. */
  watchHistory: { fallback: Match; historySpaceId?: string } | null;
  openWatchHistory: (match: Match) => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ScreenName[]>(['home']);
  const [setupMode,setSetupMode]=useState<'new'|'edit'>('new');
  const [pendingWatchCode, setPendingWatchCode] = useState<string | null>(null);
  const [watchHistory, setWatchHistory] = useState<{
    fallback: Match;
    historySpaceId?: string;
  } | null>(null);

  const go = (screen: ScreenName) => {if(screen==='newMatch')setSetupMode('new');setStack((s) => [...s, screen]);};
  const back = () =>
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const openSetup=(mode:'new'|'edit'='edit')=>{setSetupMode(mode==='new'?'new':'edit');setStack(['home','newMatch']);};
  const goHome=()=>setStack(['home']);
  useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{const active=stack[stack.length-1];if(active==='game'){openSetup();return true;}if(active==='newMatch'){goHome();return true;}return false;});return()=>sub.remove();},[stack]);

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
        openSetup,goHome,setupMode,
        canGoBack: stack.length > 1,
        pendingWatchCode,
        openWatch,
        clearWatchCode: () => setPendingWatchCode(null),
        watchHistory,
        openWatchHistory: (match) => {
          setWatchHistory({ fallback: match, historySpaceId: match.historySpaceId });
          setStack((s) => [...s, 'watchHistory']);
        },
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
