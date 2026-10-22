import type {LiveConnection} from './contract.ts';

/** The credential travels in the upgrade header, never in the URL or an error string. */
export function roomSocket(endpoint:string,path:string,token:string,onView:(value:unknown)=>void,onClose:()=>void,Socket:typeof WebSocket=globalThis.WebSocket):LiveConnection{
 const url=new URL(endpoint+path);
 if(!/^\/rooms\/[A-F0-9]{10}\/(?:socket|events)$/.test(url.pathname)||url.search||url.hash||url.username||url.password||!['http:','https:'].includes(url.protocol)||!/^[a-f0-9]{64}$/.test(token)||!Socket)throw Error('connection_error');
 url.protocol=url.protocol==='https:'?'wss:':'ws:';
 const socket=new Socket(url.toString(),['domino.v1','domino-auth.'+token]);let closed=false;
 const fail=()=>{if(closed)return;closed=true;try{socket.close();}catch{}onClose();};
 socket.onmessage=event=>{
  if(closed)return;
  try{if(typeof event.data!=='string'||event.data.length>512*1024)throw Error();const message=JSON.parse(event.data);if(message?.type!=='snapshot'||!message.view)throw Error();onView(message.view);}catch{fail();}
 };
 socket.onerror=fail;socket.onclose=fail;
 return{close(){if(closed)return;closed=true;socket.onmessage=null;socket.onerror=null;socket.onclose=null;socket.close();},heartbeat(){if(closed||socket.readyState!==1)throw Error('connection_error');socket.send(JSON.stringify({type:'heartbeat'}));}};
}
