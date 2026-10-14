import {useCallback,useEffect,useRef,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import type {Game} from './engine';
import {expireLocalTurn,syncLocalClock} from './localTurnClock';
import type {LocalClock} from './localTurnClock';
export function useLocalTurnClock(game:Game|null,setGame:Dispatch<SetStateAction<Game|null>>,paused:boolean,boneyardOpen:boolean,sharedRef?:{current:LocalClock|null}){
 const ownRef=useRef<LocalClock|null>(null),ref=sharedRef??ownRef,[,refresh]=useState(0),now=performance.now(),latest=useRef({game,paused,boneyardOpen});latest.current={game,paused,boneyardOpen};
 ref.current=syncLocalClock(ref.current,game,now,paused,boneyardOpen);
 useEffect(()=>{const p=latest.current;ref.current=syncLocalClock(ref.current,p.game,performance.now(),p.paused,p.boneyardOpen);return()=>{const c=ref.current;if(c?.deadline!=null)ref.current={...c,remainingMs:Math.max(0,c.deadline-performance.now()),deadline:null};};},[ref]);
 const guardedSetGame=useCallback((update:SetStateAction<Game|null>)=>{setGame(current=>{if(current){const expired=expireLocalTurn(current,ref.current,performance.now());if(expired!==current)return expired;}return typeof update==='function'?update(current):update;});},[setGame,ref]);
 const allowAction=()=>{if(game&&expireLocalTurn(game,ref.current,performance.now())!==game){guardedSetGame(current=>current);return false;}return true;};
 const pause=(value:boolean)=>{const current=ref.current;if(!current)return;ref.current=syncLocalClock(current,game,performance.now(),paused,boneyardOpen);if(ref.current)ref.current={...ref.current,manualPaused:value};refresh(n=>n+1);};
 const c=ref.current;
 useEffect(()=>{if(paused||!c||c.deadline===null)return;const timer=setTimeout(()=>{const p=latest.current;if(!p.paused)guardedSetGame(current=>current);},Math.max(0,c.deadline-performance.now()));return()=>clearTimeout(timer);},[c?.deadline,paused,guardedSetGame]);
 return{setGame:guardedSetGame,allowAction,pause:()=>{if(allowAction())pause(true);},resume:()=>pause(false),clock:c?{durationMs:30000,remainingMs:c.remainingMs,deadline:c.deadline,serverNow:now,paused:c.deadline===null}:null};
}
