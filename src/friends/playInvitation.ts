/** Durable agreement. Room lifetime, transport and presence are separate policies. */
export const ACCEPT_MS=7*24*60*60_000;
export const READY_MS=30_000;
export type PlayGame='domino'|'poker';
export type PlayInvitation={id:string;from:string;to:string|null;game:PlayGame;createdAt:number;acceptBy:number;acceptedAt:number|null;state:'pending'|'accepted'|'preparing'|'ready'|'connected'|'declined'|'cancelled';revision:number;generation:number;allocation:string|null;room:string|null;creationHash:string|null;entered:string[];readiness:Record<string,number>};
const profile=(s:string)=>/^F-[A-F0-9]{8}$/.test(s);
export function createPlayInvitation(id:string,from:string,to:string|null,game:PlayGame,now:number):PlayInvitation{
 if(!/^[a-f0-9]{64}$/.test(id)||!profile(from)||to!==null&&!profile(to)||!['domino','poker'].includes(game)||!Number.isSafeInteger(now))throw Error('invalid_invitation');
 if(from===to)throw Error('self_request');
 return {id,from,to,game,createdAt:now,acceptBy:now+ACCEPT_MS,acceptedAt:null,state:'pending',revision:1,generation:0,allocation:null,room:null,creationHash:null,entered:[],readiness:{}};
}
function participant(p:PlayInvitation,actor:string){if(actor!==p.from&&actor!==p.to)throw Error('not_participant');}
function open(p:PlayInvitation){if(p.state==='cancelled')throw Error('invitation_cancelled');if(p.state==='declined')throw Error('invitation_declined');}
export function acceptPlayInvitation(p:PlayInvitation,actor:string,now:number):PlayInvitation{
 if(!profile(actor))throw Error('invalid_friend_code');if(actor===p.from)throw Error('self_request');if(p.to&&p.to!==actor)throw Error('invitation_used');open(p);
 if(p.acceptedAt!==null)return p;
 if(p.acceptBy<=now)throw Error('invitation_expired');
 return {...p,to:actor,state:'accepted',acceptedAt:now,revision:p.revision+1};
}
export function declinePlayInvitation(p:PlayInvitation,actor:string,now:number):PlayInvitation{if(!profile(actor))throw Error('invalid_friend_code');if(actor===p.from)throw Error('self_request');if(p.to&&p.to!==actor)throw Error('invitation_used');if(p.state==='declined'&&p.to===actor)return p;open(p);if(p.acceptedAt!==null)throw Error('invitation_changed');if(p.acceptBy<=now)throw Error('invitation_expired');return {...p,to:actor,state:'declined',readiness:{},revision:p.revision+1};}
export function readyPlayInvitation(p:PlayInvitation,actor:string,ready:boolean,now:number):PlayInvitation{
 participant(p,actor);open(p);if(p.acceptedAt===null)throw Error('acceptance_required');if(p.state==='connected')return p;
 return {...p,readiness:{...p.readiness,[actor]:ready?now+READY_MS:0},revision:p.revision+1};
}
export function allocatePlayRoom(p:PlayInvitation,actor:string,now:number):PlayInvitation{
 participant(p,actor);open(p);if(actor!==p.from)throw Error('host_only');if(p.acceptedAt===null)throw Error('acceptance_required');
 // A lost reply always recovers the same allocation, even if its readiness lease elapsed.
 if(p.allocation)return p;
 if(!p.to||(p.readiness[p.from]??0)<=now||(p.readiness[p.to]??0)<=now)throw Error('not_ready');
 const generation=p.generation+1;return {...p,state:'preparing',generation,allocation:p.id+':'+generation,room:null,revision:p.revision+1};
}
export function bindPlayCreation(p:PlayInvitation,actor:string,allocation:string,hash:string):PlayInvitation{participant(p,actor);open(p);if(actor!==p.from)throw Error('host_only');if(p.allocation!==allocation||!allocation)throw Error('allocation_changed');if(!/^[a-f0-9]{64}$/.test(hash))throw Error('invalid_request');if(p.creationHash){if(p.creationHash!==hash)throw Error('creation_changed');return p;}return {...p,creationHash:hash,revision:p.revision+1};}
export function attachPlayRoom(p:PlayInvitation,actor:string,allocation:string,room:string,_now:number):PlayInvitation{
 participant(p,actor);open(p);if(actor!==p.from)throw Error('host_only');if(p.allocation!==allocation||!allocation)throw Error('allocation_changed');if(!/^[A-F0-9]{10}$/.test(room))throw Error('invalid_code');
 if(p.room){if(p.room!==room)throw Error('room_conflict');return p;}
 return {...p,state:'ready',room,revision:p.revision+1};
}
export function resetPlayRoom(p:PlayInvitation,actor:string,allocation:string):PlayInvitation{
 participant(p,actor);open(p);if(actor!==p.from)throw Error('host_only');if(p.allocation!==allocation)throw Error('allocation_changed');
 return {...p,state:'accepted',allocation:null,room:null,creationHash:null,entered:[],readiness:{},revision:p.revision+1};
}
export function completePlayInvitation(p:PlayInvitation,actor:string,room:string):PlayInvitation{
 participant(p,actor);open(p);if(p.state==='connected'&&p.room===room)return p;if(p.state!=='ready'||p.room!==room)throw Error('room_changed');const entered=[...new Set([...(p.entered??[]),actor])];return {...p,state:entered.length===2?'connected':'ready',entered,revision:p.revision+1};
}
export function cancelPlayInvitation(p:PlayInvitation,actor:string,_now:number,decline=false):PlayInvitation{
 participant(p,actor);if(p.state==='cancelled'||p.state==='declined')return p;if(p.state==='connected')throw Error('already_connected');
 return {...p,state:decline?'declined':'cancelled',readiness:{},revision:p.revision+1};
}
export function projectPlayInvitation(p:PlayInvitation,actor:string,now:number){participant(p,actor);return {...p,serverNow:now,state:p.state==='pending'&&p.acceptBy<=now?'expired' as const:p.state};}
