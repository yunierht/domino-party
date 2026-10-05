import {useEffect,useRef,useState} from 'react';
import type {Game} from './engine';
export const DOMINO_RESULT_VISIBLE_MS=3000;
/** Wait for presentation/consumption, then continue once without changing scoring. */
export function useDominoResultTransition(game:Game|null,paused:boolean,settled:boolean,onNext:()=>void){
 const [presented,setPresented]=useState<Game|null>(null);const transitioned=useRef<Game|null>(null);const next=useRef(onNext);next.current=onNext;
 useEffect(()=>{setPresented(null);if(!game?.result||paused)return;const timer=setTimeout(()=>setPresented(game),DOMINO_RESULT_VISIBLE_MS);return()=>clearTimeout(timer);},[game,paused]);
 useEffect(()=>{if(!game?.result||paused||presented!==game||!settled||transitioned.current===game)return;transitioned.current=game;next.current();},[game,paused,presented,settled]);
 return !!game?.result&&presented!==game;
}
