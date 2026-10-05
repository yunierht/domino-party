import {useEffect,useRef} from 'react';
import type {Round} from './engine';
import {playCardDeal} from '../sound/sounds';
/** Reuses Poker's approved card excerpt without changing the shared audio layer. */
export function useBlackjackCardSound(g:Round|null,enabled:boolean,paused:boolean){
 const previous=useRef<Round|null>(null);
 useEffect(()=>{
  if(!g||paused)return;
  const before=previous.current;previous.current=g;
  if(!enabled)return;
  const count=!before?g.player.length+g.dealer.length:Math.max(0,g.player.length+g.dealer.length-before.player.length-before.dealer.length)||(before.phase==='player'&&g.phase!=='player'?1:0);
  let alive=true;const stops:(()=>void)[]=[];
  const timers=Array.from({length:count},(_,i)=>setTimeout(()=>{if(alive)stops.push(playCardDeal());},i*140+80));
  return()=>{alive=false;timers.forEach(clearTimeout);stops.forEach(stop=>stop());};
 },[g,enabled,paused]);
}
