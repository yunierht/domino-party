import React,{createContext,useContext,useState,useCallback} from 'react';
import type {Round} from './engine';
import {initialSession,beginRound,updateRound} from './session';
const Context=createContext<{celebrated:Round|null;setCelebrated:React.Dispatch<React.SetStateAction<Round|null>>;game:Round|null;setGame:React.Dispatch<React.SetStateAction<Round|null>>;chips:number;dealerChips:number;bet:number;wins:number;losses:number;pushes:number;startRound:(amount:number)=>void;refill:()=>void;name:string;setName:(v:string)=>void;dealerId:string;setDealerId:(v:string)=>void}|null>(null);
export function BlackjackProvider({children}:{children:React.ReactNode}){
 const [celebrated,setCelebrated]=useState<Round|null>(null);
 const [session,setSession]=useState(initialSession);const [name,setName]=useState('');const [dealerId,setDealerId]=useState('mateo');
 const setGame=useCallback<React.Dispatch<React.SetStateAction<Round|null>>>(change=>setSession(s=>updateRound(s,typeof change==='function'?change(s.game):change)),[]);
 const startRound=useCallback((amount:number)=>setSession(s=>beginRound(s,amount)),[]);
 const refill=useCallback(()=>setSession(s=>s.chips<10&&(!s.game||s.game.result)?{...s,chips:s.chips+1000}:s),[]);
 return <Context.Provider value={{...session,celebrated,setCelebrated,setGame,startRound,refill,name,setName,dealerId,setDealerId}}>{children}</Context.Provider>;
}
export function useBlackjack(){const v=useContext(Context);if(!v)throw Error('BlackjackProvider required');return v;}
