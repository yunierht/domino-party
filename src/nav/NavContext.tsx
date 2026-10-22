import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {BackHandler} from 'react-native';
import type { Match } from '../types';

export type ScreenName =
  | 'home'
  | 'newMatch'
  | 'game'
  | 'computerGame'
  | 'onlineInvitation'
  | 'pokerLobby'
  | 'pokerOnline'
  | 'blackjackOnline'
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
  pendingBlackjackCode:string|null;
  openBlackjackOnline:(code?:string)=>void;
  clearBlackjackCode:()=>void;
  pendingPokerCode:string|null;
  openPokerOnline:(code?:string)=>void;
  clearPokerCode:()=>void;
  screen: ScreenName;
  settingsReturnScreen:ScreenName;
  go: (screen: ScreenName) => void;
  back: () => void;
  openSetup:(mode?:'new'|'edit')=>void;
  setupMode:'new'|'edit';
  goHome:()=>void;
  returnFromOnlineDomino:(fallback?:'computerGame'|'blackjackTable')=>void;
  canGoBack: boolean;
  /** A game code from a deep link, to auto-join on the Watch screen. */
  pendingWatchCode: string | null;
  /** Jump to the Watch screen and auto-join the given code (from a link). */
  openWatch: (code: string) => void;
  /** Clear the pending code once consumed. */
  clearWatchCode: () => void;
  onlineInvitation:{code:string|null;transferred?:boolean;joined?:boolean;confirmGuest?:boolean}|null;
  openOnlineTransfer:()=>void;
  openJoinedDomino:(confirmGuest?:boolean)=>void;
  openOnlineInvitation:(code:string|null)=>void;
  /** Open the normal History UI for a followed history space in read-only mode. */
  watchHistory: { fallback: Match; historySpaceId?: string } | null;
  openWatchHistory: (match: Match) => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [pendingBlackjackCode,setPendingBlackjackCode]=useState<string|null>(null);
  const [pendingPokerCode,setPendingPokerCode]=useState<string|null>(null);
  const [stack, setStackState] = useState<ScreenName[]>(['home']);
  const stackRef=useRef(stack),entryVersion=useRef(0);
  const setStack=(next:ScreenName[]|((previous:ScreenName[])=>ScreenName[]))=>{const value=typeof next==='function'?next(stackRef.current):next;stackRef.current=value;setStackState(value);};
  const [setupMode,setSetupMode]=useState<'new'|'edit'>('new');
  const [pendingWatchCode, setPendingWatchCode] = useState<string | null>(null);
  const [onlineInvitation,setOnlineInvitation]=useState<{code:string|null;transferred?:boolean;joined?:boolean;confirmGuest?:boolean}|null>(null);
  const [watchHistory, setWatchHistory] = useState<{
    fallback: Match;
    historySpaceId?: string;
  } | null>(null);

  const go = (screen: ScreenName) => {if(screen==='blackjackOnline')screen='blackjackLobby';if(screen==='newMatch')setSetupMode('new');setStack((s) => [...s, screen]);};
  const back = () =>
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const openSetup=(mode:'new'|'edit'='edit')=>{setSetupMode(mode==='new'?'new':'edit');setStack(['home','newMatch']);};
  const onlineReturn=useRef<'computerGame'|'blackjackTable'|null>(null);
  const goHome=()=>{entryVersion.current++;onlineReturn.current=null;setOnlineInvitation(null);setStack(['home']);};
  const openDomino=(entry:NonNullable<typeof onlineInvitation>)=>{
    const current=stackRef.current,top=current[current.length-1],origin=top==='settings'?current[current.length-2]:top;
    if(origin!=='onlineInvitation')onlineReturn.current=origin==='computerGame'||origin==='blackjackTable'?origin:null;
    entryVersion.current++;
    setOnlineInvitation(entry);setStack(['home','onlineInvitation']);
  };
  const renderedEntryVersion=entryVersion.current;
  const returnFromOnlineDomino=(fallback?:'computerGame'|'blackjackTable')=>{if(renderedEntryVersion!==entryVersion.current)return;entryVersion.current++;const target=onlineReturn.current??fallback;setOnlineInvitation(null);onlineReturn.current=null;setStack(target?['home',target]:['home']);};
  useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{const active=stack[stack.length-1];if(active==='settings'&&['computerGame','pokerLobby','blackjackLobby','pokerOnline','blackjackTable','onlineInvitation'].includes(stack[stack.length-2])){back();return true;}if(active==='game'){openSetup();return true;}if(active==='newMatch'){goHome();return true;}return false;});return()=>sub.remove();},[stack]);

  const openWatch = (code: string) => {
    setPendingWatchCode(code.toUpperCase().trim());
    setStack((s) => (s[s.length - 1] === 'watch' ? s : [...s, 'watch']));
  };

  return (
    <NavContext.Provider
      value={{
        pendingBlackjackCode,clearBlackjackCode:()=>setPendingBlackjackCode(null),openBlackjackOnline:()=>{setPendingBlackjackCode(null);setStack(s=>s[s.length-1]==='blackjackLobby'?s:[...s,'blackjackLobby']);},
        pendingPokerCode,clearPokerCode:()=>setPendingPokerCode(null),openPokerOnline:(code)=>{setPendingPokerCode(code??null);setStack(s=>s[s.length-1]==='pokerOnline'?s:[...s,'pokerOnline']);},
        settingsReturnScreen:stack.length>1?stack[stack.length-2]:'home',
        screen: stack[stack.length - 1],
        go,
        back,
        openSetup,goHome,setupMode,returnFromOnlineDomino,
        canGoBack: stack.length > 1,
        pendingWatchCode,
        openWatch,
        clearWatchCode: () => setPendingWatchCode(null),
        openJoinedDomino:(confirmGuest=false)=>openDomino({code:null,joined:true,confirmGuest}),
        onlineInvitation,openOnlineTransfer:()=>openDomino({code:null,transferred:true}),
        openOnlineInvitation:code=>openDomino({code}),
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
