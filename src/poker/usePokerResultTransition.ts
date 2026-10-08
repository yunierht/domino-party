import {useEffect,useRef} from 'react';
import {useHeldResultTimer} from '../components/useHeldResultTimer';
import type {PokerGame} from './engine';
import {bankruptSeat,continuePoker} from './rebuy';
export const POKER_RESULT_VISIBLE_MS=3000;
/** Presentation never pays. A settled hand advances only once, after the visible result and collection. */
export function usePokerResultTransition(game:PokerGame|null,paused:boolean,collected:boolean,onNext:(next:PokerGame)=>void,holding=false,holdRef?:{current:boolean}){
 const done=useHeldResultTimer(game?.result?game:null,paused,POKER_RESULT_VISIBLE_MS,holding,holdRef);const transitioned=useRef<PokerGame|null>(null);const next=useRef(onNext);next.current=onNext;
 useEffect(()=>{if(holding||holdRef?.current){if(transitioned.current===game)transitioned.current=null;return;}if(!game?.result||paused||!done||!collected||bankruptSeat(game)||transitioned.current===game)return;transitioned.current=game;next.current(continuePoker(game));},[game,paused,done,collected,holding]);
 return !!game?.result&&!done;
}
