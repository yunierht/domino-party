/** Provider adapter. A ticket/receipt confirms handoff, never device delivery. */
export type PushMessage={token:string;eventId:string;invitationId:string;kind:'invited'|'accepted';name:string;game:'domino'|'poker'};
export type PushTicket={token:string;receipt?:string;invalid?:boolean;retry?:boolean;error?:string};
export function validPushToken(token:string){return /^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]{8,200}\]$/.test(token);}
async function call(path:string,body:unknown,fetcher:typeof fetch,accessToken?:string){
 const response=await fetcher('https://exp.host/--/api/v2/push/'+path,{method:'POST',headers:{'content-type':'application/json',...(accessToken?{authorization:'Bearer '+accessToken}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10_000)});
 if(response.status===429||response.status>=500)throw Error('push_retry');if(!response.ok)throw Error('push_configuration');
 const reader=response.body?.getReader();if(!reader)throw Error('push_response');let raw='',bytes=0;const decoder=new TextDecoder();for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>65536){await reader.cancel();throw Error('push_response');}raw+=decoder.decode(chunk.value,{stream:true});}raw+=decoder.decode();return JSON.parse(raw) as {data?:unknown};
}
export async function sendPush(messages:PushMessage[],fetcher:typeof fetch=fetch,accessToken?:string):Promise<PushTicket[]>{
 if(!messages.length||messages.length>16||messages.some(m=>!validPushToken(m.token)))throw Error('invalid_push');
 const raw=await call('send',messages.map(m=>({to:m.token,title:'Domino Social Club',body:m.kind==='accepted'?m.name+' aceptó tu invitación':m.name+' te invita a jugar '+(m.game==='poker'?'Poker':'Dominó'),data:{type:'play-invitation',invitationId:m.invitationId,eventId:m.eventId},sound:'default',channelId:'game-invitations',ttl:3600})),fetcher,accessToken);
 if(!Array.isArray(raw.data)||raw.data.length!==messages.length)throw Error('push_response');
 const data=raw.data;return messages.map((m,index)=>{const t=data[index] as {status?:string;id?:string;details?:{error?:string}};return {token:m.token,...(t.status==='ok'&&typeof t.id==='string'?{receipt:t.id}:t.details?.error==='DeviceNotRegistered'?{invalid:true}:['MessageRateExceeded'].includes(t.details?.error??'')?{retry:true}:t.status==='error'?{error:t.details?.error??'push_rejected'}:{retry:true})};});
}
export async function pushReceipts(ids:string[],fetcher:typeof fetch=fetch,accessToken?:string){
 if(!ids.length||ids.length>16)throw Error('invalid_push');const raw=await call('getReceipts',{ids},fetcher,accessToken);
 if(!raw.data||typeof raw.data!=='object'||Array.isArray(raw.data))throw Error('push_response');
 return raw.data as Record<string,{status?:string;details?:{error?:string}}>;
}
