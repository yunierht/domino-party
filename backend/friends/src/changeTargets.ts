import {friendCode} from '../../../src/friends/friendship.ts';
/** Presence timestamps and rate counters alone must never cause a notification loop. */
export function changeTargets(before:unknown,value:unknown,now:number,connected=false){
 const p=before as Record<string,any>|null,v=value as Record<string,any>;
 if(v&&friendCode(v.code)&&typeof v.hash==='string'&&Array.isArray(v.peers)){
  const stable=(x:Record<string,any>)=>JSON.stringify({...x,seen:0,window:0,used:0});
  const changed=!p||stable(p)!==stable(v)||!connected&&((p.seen??0)>now-20000)!==((v.seen??0)>now-20000);
  return{self:changed,peers:changed?[...new Set([...(p?.peers??[]),...v.peers])].filter(friendCode):[]};
 }
 if(v&&friendCode(v.from)&&friendCode(v.to)&&typeof v.status==='string'&&JSON.stringify(p)!==JSON.stringify(v))return{self:false,peers:[v.from,v.to]};
 return{self:false,peers:[] as string[]};
}
