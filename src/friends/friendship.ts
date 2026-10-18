/** Pure consent rules; no game engine, transport, navigation or platform state. */
export type GameInvitation={id:string;from:string;room:string;expires:number;game?:'domino'|'poker';status:'pending'|'accepted'|'declined'|'connected'|'cancelled'};
export type Friendship={from:string;to:string;status:'pending'|'accepted'|'declined'|'removed';invitation:GameInvitation|null};
export const friendCode=(v:unknown):v is string=>typeof v==='string'&&/^F-[A-F0-9]{8}$/.test(v);
function participant(s:Friendship,actor:string){if(actor!==s.from&&actor!==s.to)throw Error('not_participant');}
export function requestFriendship(s:Friendship|null,from:string,to:string,_now:number):Friendship{
 if(!friendCode(from)||!friendCode(to))throw Error('invalid_friend_code');if(from===to)throw Error('self_request');
 if(s){participant(s,from);participant(s,to);if(s.status==='accepted'||s.status==='pending'&&s.from===from)return s;if(s.status==='pending')throw Error('request_pending');}
 return {from,to,status:'pending',invitation:null};
}
export function respondFriendship(s:Friendship,actor:string,accept:boolean,_now:number):Friendship{
 participant(s,actor);if(actor!==s.to)throw Error('recipient_only');
 if(s.status!=='pending'){if(s.status===(accept?'accepted':'declined'))return s;throw Error('request_changed');}
 return {...s,status:accept?'accepted':'declined',invitation:null};
}
export function sendGameInvitation(s:Friendship,actor:string,id:string,room:string,now:number,game:'domino'|'poker'='domino'):Friendship{
 participant(s,actor);if(s.status!=='accepted')throw Error('friends_required');if(!/^[A-F0-9]{10}$/.test(room)||!id||id.length>64)throw Error('invalid_invitation');
 if(s.invitation?.id===id){if(s.invitation.from!==actor||s.invitation.room!==room||(s.invitation.game??'domino')!==game)throw Error('invitation_changed');return s;}
 if(s.invitation&&['pending','accepted'].includes(s.invitation.status)&&s.invitation.expires>now){if(s.invitation.from===actor&&s.invitation.room===room&&(s.invitation.game??'domino')===game)return s;throw Error('invitation_pending');}
 return {...s,invitation:{id,from:actor,room,game,expires:now+300000,status:'pending'}};
}
export function respondGameInvitation(s:Friendship,actor:string,id:string,accept:boolean,now:number):Friendship{
 participant(s,actor);const i=s.invitation;if(!i||i.id!==id)throw Error('invitation_changed');if(i.from===actor)throw Error('recipient_only');if(i.expires<=now)throw Error('invitation_expired');
 if(i.status!=='pending'){if(i.status===(accept?'accepted':'declined'))return s;throw Error('invitation_changed');}
 return {...s,invitation:{...i,status:accept?'accepted':'declined'}};
}
export function friendView(s:Friendship,actor:string,now:number){
 participant(s,actor);const i=s.invitation;const visible=i&&(i.status==='pending'||i.status==='accepted')&&i.expires>now?{id:i.id,room:i.room,game:i.game??'domino',expires:i.expires,status:i.status}:null;return {outgoing:visible&&i?.from===actor?visible:null,status:s.status==='pending'?(s.from===actor?'outgoing':'incoming'):s.status==='accepted'?'accepted':'none',invitation:i&&(i.status==='pending'||i.status==='accepted')&&i.from!==actor&&i.expires>now?{id:i.id,room:i.room,game:i.game??'domino',expires:i.expires,status:i.status}:null};
}

export function completeGameInvitation(s:Friendship,actor:string,id:string):Friendship{participant(s,actor);const i=s.invitation;if(!i||i.id!==id)throw Error('invitation_changed');if(i.from===actor)throw Error('recipient_only');if(i.status==='connected')return s;if(i.status!=='accepted')throw Error('acceptance_required');return {...s,invitation:{...i,status:'connected'}};}

export function connectRoomFriendship(s:Friendship|null,a:string,b:string):Friendship{if(!friendCode(a)||!friendCode(b)||a===b)throw Error('invalid_friend_code');if(s){participant(s,a);participant(s,b);if(s.status==='accepted')return s;}return {from:a,to:b,status:'accepted',invitation:null};}
export function cancelGameInvitation(s:Friendship,actor:string,id:string):Friendship{participant(s,actor);const i=s.invitation;if(!i||i.id!==id||i.from!==actor)throw Error('invitation_changed');if(i.status!=='pending')return s;return {...s,invitation:{...i,status:'cancelled'}};}

export function removeFriendship(s:Friendship,actor:string):Friendship{participant(s,actor);if(s.status==='removed')return s;if(s.status!=='accepted')throw Error('friends_required');return {...s,status:'removed',invitation:null};}
