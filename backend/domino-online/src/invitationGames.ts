import type {Room} from './room';
/** Read-only invitation presence; never advances clocks, joins or returns private state. */
export function invitationAvailable(room:Room|null,now:number){
 if(!room||room.phase==='closed'||room.phase==='completed')return false;
 if(room.phase==='waiting'&&now-room.createdAt>=15*60_000)return false;
 return !Object.values(room.seats).some(seat=>seat?.closeAt!==null&&seat?.closeAt!==undefined&&seat.closeAt<=now);
}
export async function invitationGames(env:Cloudflare.Env,code:string,actor:string){
 const games:('domino'|'poker')[]=[];
 for(const game of ['domino','poker'] as const){
  let canonical=code;
  if(/^\d{6}$/.test(code)){const found=await env.MANUAL_CODES.getByName(game==='poker'?'poker-manual-v1':'manual-v1').resolve(code,actor);if(found.error==='rate_limited')throw Error('rate_limited');if(!found.room)continue;canonical=found.room;}
  const room=game==='poker'?env.POKER_ROOMS.getByName(canonical):env.ROOMS.getByName(canonical);
  if(await room.invitationAvailable())games.push(game);
 }
 return {games};
}
