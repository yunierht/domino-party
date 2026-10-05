import {useEffect,useRef,useState} from 'react';
import type {PokerGame} from './engine';
import {bankruptSeat,continuePoker} from './rebuy';
export const POKER_RESULT_VISIBLE_MS=2000;
/** Presentation never pays. A settled hand advances only once, after the visible result and collection. */
export function usePokerResultTransition(game:PokerGame|null,paused:boolean,collected:boolean,onNext:(next:PokerGame)=>void){
 const [presented,setPresented]=useState<PokerGame|null>(null);const transitioned=useRef<PokerGame|null>(null);const next=useRef(onNext);next.current=onNext;
 useEffect(()=>{setPresented(null);if(!game?.result||paused)return;const timer=setTimeout(()=>setPresented(game),POKER_RESULT_VISIBLE_MS);return()=>clearTimeout(timer);},[game,paused]);
 useEffect(()=>{if(!game?.result||paused||presented!==game||!collected||bankruptSeat(game)||transitioned.current===game)return;transitioned.current=game;next.current(continuePoker(game));},[game,paused,presented,collected]);
 return !!game?.result&&presented!==game;
}
