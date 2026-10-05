import {useEffect} from 'react';
import {playCardDeal,prepareCardAudio} from '../sound/sounds';
/** Audio follows the card flight without drawing a dealer hand. */
export function CardDealSound({active,sound,delay=0}:{active:boolean;sound:boolean;delay?:number}){
 useEffect(()=>{if(sound)prepareCardAudio();},[sound]);
 useEffect(()=>{if(!active||!sound)return;let stop:(()=>void)|undefined;const timer=setTimeout(()=>{stop=playCardDeal();},delay+80);return()=>{clearTimeout(timer);stop?.();};},[active,sound,delay]);
 return null;
}
