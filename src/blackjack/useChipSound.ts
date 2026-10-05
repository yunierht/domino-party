import {useEffect,useRef} from 'react';
import {playChipMove} from './chipSound';
export function useChipSound(id:number,kind:'bet'|'win',enabled:boolean,paused:boolean){
 const played=useRef<number|null>(null);
 useEffect(()=>{
  if(paused||played.current===id)return;
  played.current=id;
  if(enabled)return playChipMove(kind);
 },[id,kind,enabled,paused]);
}
