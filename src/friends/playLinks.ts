const ID=/^[a-f0-9]{64}$/;
export function playLink(origin:string,id:string){if(!ID.test(id))throw Error('invalid_invitation');const url=new URL('/play',origin);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('invalid_endpoint');url.searchParams.set('invite',id);return url.href;}
export function parsePlayLink(raw:string,origin:string,scheme='dominoparty'){
 try{const u=new URL(raw),base=new URL(origin);if(!(((u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))&&u.origin===base.origin&&u.pathname==='/play')||(u.protocol===scheme+':'&&u.hostname==='play'&&!u.port&&['','/'].includes(u.pathname))))return null;if(u.username||u.password||u.hash||[...u.searchParams.keys()].length!==1)return null;const id=u.searchParams.get('invite');return id&&ID.test(id)?id:null;}catch{return null;}
}
export function notificationIntent(data:unknown){if(!data||typeof data!=='object')return null;const o=data as Record<string,unknown>;return o.type==='play-invitation'&&typeof o.invitationId==='string'&&ID.test(o.invitationId)&&typeof o.eventId==='string'&&o.eventId.length<=100?{id:o.invitationId,eventId:o.eventId}:null;}
