import {useEffect,useState} from 'react';
import {analyzePoker,oddsPercentages,validPokerCards,type PublicPokerCards} from './pokerOdds';
/** Public snapshot only; a result from an old street must never remain on the hand hint. */
export function usePokerWinEstimate(cards:PublicPokerCards,enabled:boolean){
 const key=JSON.stringify([cards.hero,cards.board]),valid=enabled&&validPokerCards(cards);
 const [value,setValue]=useState<{key:string;win:number;exact:boolean}|null>(null);
 useEffect(()=>{
  if(!valid)return;let cancelled=false;
  void analyzePoker(cards,{cancelled:()=>cancelled}).then(result=>{if(!cancelled)setValue({key,win:oddsPercentages(result).win,exact:result.exact});}).catch(()=>{if(!cancelled)setValue(null);});
  return()=>{cancelled=true;};
 },[key,valid]);
 return valid&&value?.key===key?{win:value.win,exact:value.exact}:null;
}