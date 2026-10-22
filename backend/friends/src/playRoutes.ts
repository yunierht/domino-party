import {invitationLanding} from './invitationLanding';
import release from '../../../config/social-club-update.json';
import {validPushToken} from './pushTransport';
const idPattern=/^[a-f0-9]{64}$/;
const text=(v:unknown)=>{if(typeof v!=='string'||v.length>300)throw Error('invalid_request');return v;};
export function playLanding(url:URL,userAgent=''){
 if(url.pathname==='/.well-known/assetlinks.json'&&!url.search)return Response.json([{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:release.android.package,sha256_cert_fingerprints:release.android.sha256}}],{headers:{'cache-control':'public, max-age=300'}});
 if(url.pathname==='/.well-known/apple-app-site-association'&&!url.search)return Response.json({applinks:{apps:[],details:[{appID:release.ios.teamId+'.'+release.ios.bundleIdentifier,paths:['/play']}] }},{headers:{'cache-control':'public, max-age=300'}});
 if(url.pathname!=='/play')return null;const id=url.searchParams.get('invite');if(!id||!idPattern.test(id)||[...url.searchParams.keys()].length!==1)throw Error('invalid_invitation');return invitationLanding('play',id,userAgent);}

async function roomRead(env:Env,game:string,room:string,token:string){if(!/^[A-F0-9]{10}$/.test(room)||!idPattern.test(token))throw Error('invalid_request');const response=await env.ONLINE.fetch(new Request(env.ONLINE_ORIGIN+(game==='poker'?'/poker':'')+'/rooms/'+room,{headers:{authorization:'Bearer '+token}}));const raw=await response.json() as {error?:string;code?:string;phase?:string;seat?:string;names?:{computer?:string}};return {response,view:raw};}
async function addReference(env:Env,actor:string,id:string){const me=env.FRIENDS.getByName('profile:'+actor),refs=await me.playReferences();if(!refs.includes(id)&&refs.length>=100){for(const ref of refs){try{const p=await env.PLAY_INVITATIONS.getByName(ref).read(actor);if(['expired','connected','cancelled','declined'].includes(p.state))await me.removePlayReference(ref);}catch(e){if(e instanceof Error&&['not_found','not_participant'].includes(e.message))await me.removePlayReference(ref);else throw e;}}}await me.addPlayReference(id);}
/** New versioned routes; legacy friendship and immediate room APIs remain unchanged. */
export async function playRoute(url:URL,method:string,o:Record<string,unknown>,hash:string,env:Env){
 const m=/^\/profiles\/(F-[A-F0-9]{8})\/(play(?:\/([a-f0-9]{64})(?:\/(preview|accept|decline|ready|allocate|bind|attach|reset|complete|cancel))?)?|devices)$/.exec(url.pathname);if(!m)return null;
 if(!env.PLAY_INVITATIONS)throw Error('play_not_configured');const actor=m[1],me=env.FRIENDS.getByName('profile:'+actor);const readingList=method==='GET'&&m[2]==='play'&&!m[3];const listRefs=readingList?await me.authenticatedPlayReferences(hash):null;const who=readingList?null:await me.authenticate(hash);
 if(method!=='GET'&&method!=='POST')throw Error('not_found');if(method==='POST')await me.throttle(Date.now());
 if(m[2]==='devices'){
 if(method!=='POST')throw Error('not_found');const token=text(o.token),installation=text(o.installation);if(!validPushToken(token)||!idPattern.test(installation)||!['android','ios'].includes(String(o.platform)))throw Error('invalid_push');
 const tokenOwner=env.FRIENDS.getByName('device:'+await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)).then(b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('')));await tokenOwner.claimDevice(actor,installation);await me.registerDevice(installation,token,o.enabled!==false);return {ok:true};
 }
 const id=m[3],operation=m[4];
 if(!id){if(method==='GET'){const invitations=[];for(const ref of listRefs!){try{const p=await env.PLAY_INVITATIONS.getByName(ref).read(actor);const peer=p.from===actor?p.to:p.from;const card=peer?await env.FRIENDS.getByName('profile:'+peer).profile():null;invitations.push({...p,peer:card});}catch(e){if(!(e instanceof Error)||!['not_found','not_participant'].includes(e.message))throw e;}}return {invitations};}
 const requested=text(o.id);if(!idPattern.test(requested)||!['domino','poker'].includes(String(o.game)))throw Error('invalid_invitation');const to=o.to===null?null:text(o.to);if(to!==null){if(!/^F-[A-F0-9]{8}$/.test(to)||to===actor)throw Error('invalid_friend_code');await env.FRIENDS.getByName('profile:'+to).profile();const relationship=env.FRIENDS.getByName('pair:'+[actor,to].sort().join(':'));if((await relationship.relation(actor,Date.now())).status!=='accepted')throw Error('friends_required');}
 await addReference(env,actor,requested);const p=await env.PLAY_INVITATIONS.getByName(requested).create(requested,actor,to,o.game as 'domino'|'poker',who!.name);if(to)await addReference(env,to,requested);return p;
 }
 const node=env.PLAY_INVITATIONS.getByName(id);
 if(operation==='preview'&&method==='GET'){const p=await node.preview();if(p.state==='accepted'){try{return {...await node.read(actor),peer:await env.FRIENDS.getByName('profile:'+p.from).profile()};}catch{throw Error('invitation_used');}}return {...p,peer:await env.FRIENDS.getByName('profile:'+p.from).profile()};}
 if(method==='GET'&&!operation)return node.read(actor);if(method!=='POST')throw Error('not_found');
 if(operation==='accept'){await addReference(env,actor,id);const p=await node.accept(actor,who!.name);await addReference(env,p.from,id);
 const other=env.FRIENDS.getByName('profile:'+p.from),relationship=env.FRIENDS.getByName('pair:'+[actor,p.from].sort().join(':'));if(!await relationship.connectInvitation(p.from,actor,p.createdAt))throw Error('invitation_used');await me.addPeer(p.from);await other.addPeer(actor);return p;}
 if(operation==='decline'){await addReference(env,actor,id);return node.decline(actor);}
 if(operation==='ready'){if(typeof o.ready!=='boolean')throw Error('invalid_request');return node.ready(actor,o.ready);}
 if(operation==='allocate')return node.allocate(actor);
 if(operation==='cancel')return node.cancel(actor,o.decline===true);
 const p=await node.read(actor),token=text(o.roomToken);if(!idPattern.test(token))throw Error('invalid_request');const creationHash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)).then(b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join(''));
 if(operation==='bind')return node.bind(actor,text(o.allocation),creationHash);
 if(operation==='attach'||operation==='reset'){if(p.creationHash!==creationHash)throw Error('creation_changed');}
 const room=text(o.room);const {response,view}=await roomRead(env,p.game,room,token);
 if(operation==='reset'){if(p.from!==actor)throw Error('host_only');if(p.room!==null&&p.room!==room)throw Error('room_changed');if(response.ok&&(view.seat!=='human'||view.code!==room||!['closed','completed'].includes(view.phase??'')))throw Error('active_room');if(!response.ok&&(p.room!==room||!['not_found','room_missing','closed','room_closed'].includes(view.error??'')))throw Error('room_unavailable');return node.reset(actor,text(o.allocation));}
 if(!response.ok||view.code!==room)throw Error('room_unavailable');
 if(operation==='attach'){if(p.from!==actor||view.seat!=='human'||view.phase!=='waiting'||view.names?.computer)throw Error('room_unavailable');return node.attach(actor,text(o.allocation),room);}
 if(operation==='complete'){if(p.room!==room||!['playing','paused'].includes(view.phase??'')||view.seat!==(actor===p.from?'human':'computer'))throw Error('room_unavailable');return node.complete(actor,room);}
 throw Error('not_found');
}
