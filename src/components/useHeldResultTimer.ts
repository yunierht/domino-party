import {useEffect,useRef,useState} from 'react';
/** Hold preserves remaining presentation time; existing interruptions restart the period. */
export function useHeldResultTimer<T extends object>(key:T|null,paused:boolean,duration:number,holding=false,holdRef?:{current:boolean},preserveCompletion=false){
 const [completed,setCompleted]=useState<T|null>(null);
 const clock=useRef({key,paused,remaining:duration});
 useEffect(()=>{
  if(clock.current.key!==key||(clock.current.paused!==paused&&!(preserveCompletion&&completed===key))){clock.current={key,paused,remaining:duration};setCompleted(null);}else clock.current.paused=paused;
  if(!key||paused||holding||holdRef?.current||(preserveCompletion&&completed===key))return;
  const started=Date.now();const budget=clock.current.remaining;let cancelled=false;
  const timer=setTimeout(()=>{if(cancelled)return;clock.current.remaining=0;if(!holdRef?.current)setCompleted(key);},budget);
  return()=>{cancelled=true;clearTimeout(timer);clock.current.remaining=Math.max(0,budget-(Date.now()-started));};
 },[key,paused,duration,holding]);
 return !!key&&completed===key&&!holding&&!holdRef?.current;
}
