import type {EventConnection} from './profileEvents.ts';
export function friendEvents(origin:string,path:string,token:string,onRevision:(revision:number)=>void,onClose:()=>void,Socket:typeof WebSocket=globalThis.WebSocket):EventConnection{
 if(!/^\/profiles\/F-[A-F0-9]{8}\/events$/.test(path)||!/^[a-f0-9]{64}$/.test(token)||!Socket)throw Error('connection_error');
 const url=new URL(origin+path);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('connection_error');url.protocol=url.protocol==='https:'?'wss:':'ws:';
 const ws=new Socket(url.toString(),['friends.v1','friends-auth.'+token]);let closed=false;
 const fail=()=>{if(closed)return;closed=true;try{ws.close();}catch{}onClose();};
 ws.onmessage=event=>{if(closed)return;try{if(typeof event.data!=='string'||event.data.length>256)throw Error();const message=JSON.parse(event.data);if(!['changed','alive'].includes(message?.type)||!Number.isSafeInteger(message.revision)||message.revision<0)throw Error();onRevision(message.revision);}catch{fail();}};
 ws.onclose=fail;ws.onerror=fail;
 return{close(){if(closed)return;closed=true;ws.onmessage=null;ws.onclose=null;ws.onerror=null;ws.close();},heartbeat(){if(closed||ws.readyState!==1)throw Error('connection_error');ws.send(JSON.stringify({type:'heartbeat'}));}};
}
