type Clock={now:()=>number;set:(fn:()=>void,ms:number)=>unknown;clear:(id:any)=>void};
/** One15s schedule per active local wait, even when two counters render it. */
export function createTurnReminders(clock:Clock={now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}){
 const entries=new Map<string,{listeners:Set<()=>void>;timer:unknown;active:boolean;interval:number;version:number}>();
 return{subscribe(key:string,notify:()=>void,interval=15000){let entry=entries.get(key);if(!entry){entry={listeners:new Set(),timer:null,active:true,interval,version:0};entries.set(key,entry);}const listener=()=>notify();entry.listeners.add(listener);const captured=entry;if(captured.interval!==interval){clock.clear(captured.timer);captured.timer=null;captured.interval=interval;captured.version++;}
 const version=captured.version;const tick=()=>{if(version!==captured.version||!captured.active||!captured.listeners.size)return;captured.listeners.values().next().value?.();if(captured.active&&captured.listeners.size)captured.timer=clock.set(tick,captured.interval);};
 if(captured.timer===null)captured.timer=clock.set(tick,captured.interval);
 return()=>{captured.listeners.delete(listener);if(!captured.listeners.size){captured.active=false;clock.clear(captured.timer);entries.delete(key);}};
 }};
}
export const turnReminders=createTurnReminders();
