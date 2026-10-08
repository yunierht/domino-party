import {useEffect,useRef} from 'react';
import {useHeldResultTimer} from '../components/useHeldResultTimer';
import type {Game} from './engine';
export const DOMINO_RESULT_VISIBLE_MS=3000;
/** Wait for presentation/consumption, then continue once without changing scoring. */
export function useDominoResultTransition(game:Game|null,paused:boolean,settled:boolean,onNext:()=>void,holding=false,holdRef?:{current:boolean}){
 const done=useHeldResultTimer(game?.result?game:null,paused,DOMINO_RESULT_VISIBLE_MS,holding,holdRef);const transitioned=useRef<Game|null>(null);const next=useRef(onNext);next.current=onNext;
 useEffect(()=>{if(holding||holdRef?.current){if(transitioned.current===game)transitioned.current=null;return;}if(!game?.result||paused||!done||!settled||transitioned.current===game)return;transitioned.current=game;next.current();},[game,paused,done,settled,holding]);
 return !!game?.result&&!done;
}
