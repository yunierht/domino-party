import React,{createContext,useContext,useState,useCallback} from 'react';
import type {Round} from './engine';
import {initialSession,beginRound,updateRound,canDoubleDown,doubleDownSession,repeatBetAmount,advanceCompletedRound} from './session';
const Context=createContext<{collected:Round|null;setCollected:React.Dispatch<React.SetStateAction<Round|null>>;celebrated:Round|null;setCelebrated:React.Dispatch<React.SetStateAction<Round|null>>;game:Round|null;setGame:React.Dispatch<React.SetStateAction<Round|null>>;chips:number;dealerChips:number;bet:number;wins:number;losses:number;pushes:number;autoStart:(completed:Round)=>void;canDouble:boolean;doubleDown:()=>void;repeatBet:number;startRound:(amount:number)=>void;refill:()=>void;name:string;setName:(v:string)=>void;dealerId:string;setDealerId:(v:string)=>void}|null>(null);
export function BlackjackProvider({children}:{children:React.ReactNode}){
 const [collected,setCollected]=useState<Round|null>(null);
 const [celebrated,setCelebrated]=useState<Round|null>(null);
 const [session,setSession]=useState(initialSession);const [name,setName]=useState('');const [dealerId,setDealerId]=useState('mateo');
 const setGame=useCallback<React.Dispatch<React.SetStateAction<Round|null>>>(change=>setSession(s=>updateRound(s,typeof change==='function'?change(s.game):change)),[]);
 const startRound=useCallback((amount:number)=>setSession(s=>beginRound(s,amount)),[]);
 const autoStart=useCallback((completed:Round)=>setSession(s=>advanceCompletedRound(s,completed)),[]);
 const doubleDown=useCallback(()=>setSession(doubleDownSession),[]);
 const refill=useCallback(()=>setSession(s=>s.chips<10&&(!s.game||s.game.result)?{...s,chips:s.chips+1000}:s),[]);
 return <Context.Provider value={{...session,autoStart,canDouble:canDoubleDown(session),doubleDown,repeatBet:repeatBetAmount(session),collected,setCollected,celebrated,setCelebrated,setGame,startRound,refill,name,setName,dealerId,setDealerId}}>{children}</Context.Provider>;
}
export function useBlackjack(){const v=useContext(Context);if(!v)throw Error('BlackjackProvider required');return v;}
