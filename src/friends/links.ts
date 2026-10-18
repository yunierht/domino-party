/** Friend intent has its own key: never parsed as a room or watch code. */
export function parseFriendLink(raw:string,origin:string,scheme:string):string|null{
 try{const u=new URL(raw),base=new URL(origin);if(!((u.protocol==='https:'&&u.origin===base.origin&&u.pathname==='/friend')||(u.protocol===scheme+':'&&u.hostname==='friend'&&!u.port&&['','/'].includes(u.pathname))))return null;
 if(u.username||u.password||u.hash||[...u.searchParams.keys()].length!==1)return null;const token=u.searchParams.get('invite');return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}catch{return null;}
}
export function friendLink(origin:string,token:string){if(!/^[a-f0-9]{64}$/.test(token))throw Error('invalid_invitation');const u=new URL('/friend',origin);u.searchParams.set('invite',token);return u.toString();}
