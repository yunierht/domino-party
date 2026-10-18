import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {playCardDeal,prepareCardAudio} from '../sound/sounds';
/** Consume each dealt card once; polling, showdown and preference toggles never replay it. */
export function useOnlinePokerCardSound({handKey,boardCount,enabled,sound,ready}:{handKey:string;boardCount:number;enabled:boolean;sound:boolean;ready:boolean}){
 const [foreground,setForeground]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 const seen=useRef({key:'',count:0});
 useEffect(()=>{const sub=AppState.addEventListener('change',value=>setForeground(value==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(ready&&sound)prepareCardAudio();},[ready,sound]);
 useEffect(()=>{
  if(!ready)return;
  const current=seen.current,first=current.key!==handKey,total=4+boardCount,from=first?0:current.count;
  seen.current={key:handKey,count:total};
  if(!enabled||!foreground||!sound||from>=total)return;
  const stops:(()=>void)[]=[],timers:ReturnType<typeof setTimeout>[]=[];
  for(let i=from;i<total;i++)timers.push(setTimeout(()=>stops.push(playCardDeal()),80+(i-from)*140));
  return()=>{timers.forEach(clearTimeout);stops.forEach(stop=>stop());};
 },[handKey,boardCount,enabled,foreground,sound,ready]);
}
