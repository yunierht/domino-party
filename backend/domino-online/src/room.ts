import { deal, play, drawOrPass, legalEnds, matchWinner } from '../../../src/computer/engine.ts';
import type { Game, Player, End, ScoringMode } from '../../../src/computer/engine.ts';

// Transport policy defaults, independent of the frozen rules engine.
export const LEASE_MS = 30_000;
export const GRACE_MS = 120_000;
export const WAITING_MS = 15 * 60_000;
export const TURN_MS = 30_000;
export const RESULT_MS = 3_000;
type TurnClock = { deadline: number | null; remainingMs: number; manualPaused: boolean; boneyardOpen?:true };
type ResultClock = {deadline:number|null;remainingMs:number;heldBy:Player[]};
export type AttentionKind='wave'|'knock'|'look';
type Attention={id:string;from:Player;kind:AttentionKind;sentAt:number;expiresAt:number};
export function avatarId(value: unknown): string {
  if (typeof value !== 'string' || !['yuni','yoi','diego','rafael','lucia','rigo','mateo','kenji','oliver','amara','lina','sofia','selfie'].includes(value)) throw new Error('invalid_avatar');
  return value;
}
function avatarPhoto(avatar:string,photo:unknown,enabled:boolean):string|null {
  if(avatar!=='selfie'){if(photo!==undefined)throw new Error('invalid_avatar_photo');return null;}
  if(!enabled)throw new Error('invalid_avatar');
  if(typeof photo!=='string'||photo.length>96*1024||!photo.startsWith('data:image/jpeg;base64,'))throw new Error('invalid_avatar_photo');
  const data=photo.slice(23),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  if(!/^\/9j\/(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('invalid_avatar_photo');
  const length=data.length/4*3-(data.endsWith('==')?2:data.endsWith('=')?1:0);
  const byte=(index:number)=>{const bit=index*8,offset=Math.floor(bit/6);return((alphabet.indexOf(data[offset])<<6)|alphabet.indexOf(data[offset+1]))>>(4-bit%6)&255;};
  if(length<5||byte(length-2)!==255||byte(length-1)!==217)throw new Error('invalid_avatar_photo');
  return photo;
}
export type Intent = { type: 'play'; tileId: string; end: End }
  | { type: 'draw'; slot: string } | { type: 'pass' };
type Seat = { secretHash: string; name: string; leaseUntil: number; absentSince: number | null; closeAt: number | null };
export interface Room {
  code: string; epoch: string; revision: number;
  manualCode?:string;manualCodeExpires?:number;
  phase: 'waiting' | 'playing' | 'paused' | 'completed' | 'closed';
  seats: { human: Seat; computer: Seat | null };
  approved: boolean; createdAt: number; game: Game | null; slotIds: string[];
  winner: Player | null; closeReason: string | null;
  target: number; mode: ScoringMode; roundReady: Player[]; lobbyReady: Player[];
  invitation?: { avatars: { human: string; computer: string | null }; turnTimer?:true;autoNextRound?:true;quickActions?:true;customAvatars?:true;photos?:Record<Player,string|null> };
  turnClock?: TurnClock;
  resultClock?:ResultClock;
  attention?:Attention;
  attentionSentAt?:Partial<Record<Player,number>>;
}
export function actor(room: Room, hash: string): Player {
  if (room.seats.human.secretHash === hash) return 'human';
  if (room.seats.computer?.secretHash === hash) return 'computer';
  throw new Error('unauthorized');
}
function open(room: Room) { if (room.phase === 'closed') throw new Error('closed'); }
function hostOnly(room: Room, hash: string) { if (actor(room, hash) !== 'human') throw new Error('host_only'); }
function seat(hash: string, name: string, now: number): Seat {
  if (!name.trim() || name.length > 40 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('invalid_name');
  return { secretHash: hash, name: name.trim(), leaseUntil: now + LEASE_MS, absentSince: null, closeAt: null };
}
export function createRoom(code: string, epoch: string, hash: string, name: string, now: number, target = 100, mode: ScoringMode = 'points', invitation?: {avatar:string;turnTimer?:boolean;autoNextRound?:boolean;quickActions?:boolean;customAvatars?:boolean;avatarPhoto?:string}): Room {
  if (!Number.isSafeInteger(target) || target < 1 || target > 10000 || !['points','wins'].includes(mode)) throw new Error('invalid_settings');
  const avatar=invitation?avatarId(invitation.avatar):undefined,photo=invitation?avatarPhoto(avatar!,invitation.avatarPhoto,invitation.customAvatars===true):null;
  return { code, epoch, revision: 0, phase: 'waiting', seats: { human: seat(hash, name, now), computer: null },
    approved: false, createdAt: now, game: null, slotIds: [], winner: null, closeReason: null, target, mode, roundReady: [], lobbyReady: [],
    ...(invitation ? {invitation:{avatars:{human:avatar!,computer:null},...(invitation.turnTimer?{turnTimer:true as const}:{}),...(invitation.autoNextRound?{autoNextRound:true as const}:{}),...(invitation.quickActions?{quickActions:true as const}:{}),...(invitation.customAvatars?{customAvatars:true as const,photos:{human:photo,computer:null}}:{})}} : {}) };
}
export function joinRoom(room: Room, hash: string, name: string, now: number, acceptance?: {avatar:string;acceptInvitation:boolean;avatarPhoto?:string}, random:()=>number=Math.random): Room {
  open(room);
  if (room.seats.computer?.secretHash === hash || room.seats.human.secretHash === hash) return room;
  if (room.seats.computer) throw new Error('room_full');
  if (room.phase !== 'waiting') throw new Error('already_started');
  let next:Room={ ...room, revision: room.revision + 1, seats: { ...room.seats, computer: seat(hash, name, now) } };
  if (room.invitation) {
    if (!acceptance?.acceptInvitation) throw new Error('invitation_acceptance_required');
    const avatar=avatarId(acceptance.avatar),photo=avatarPhoto(avatar,acceptance.avatarPhoto,room.invitation.customAvatars===true);
    next={...next,approved:true,lobbyReady:['human','computer'],invitation:{...room.invitation,avatars:{human:room.invitation.avatars.human,computer:avatar},
      ...(room.invitation.customAvatars?{photos:{human:room.invitation.photos?.human??null,computer:photo}}:{})}};
    return startRoom(next,room.seats.human.secretHash,now,random);
  }
  if(acceptance?.avatar==='selfie'||acceptance?.avatarPhoto!==undefined)throw new Error('invalid_avatar');
  return next;
}
export function approveGuest(room: Room, hash: string): Room {
  open(room); hostOnly(room, hash);
  if (room.phase !== 'waiting' || !room.seats.computer) throw new Error('no_pending_guest');
  return room.approved ? room : { ...room, approved: true, revision: room.revision + 1 };
}
export function startRoom(room: Room, hash: string, now: number, random: () => number): Room {
  open(room); hostOnly(room, hash);
  if (!room.approved || !room.seats.computer) throw new Error('guest_not_approved');
  if (room.lobbyReady.length !== 2) throw new Error('both_not_ready');
  if (room.phase !== 'waiting') throw new Error('already_started');
  if (room.seats.human.leaseUntil <= now || room.seats.computer.leaseUntil <= now) throw new Error('not_connected');
  const game = deal(room.seats.human.name, room.target, random, undefined, room.mode);
  return synchronizeClock(room,{ ...room, game, slotIds: [...game.stockSlots], phase: 'playing', revision: room.revision + 1 },now);
}
export function readyRoom(room: Room, hash: string, now: number, random: () => number): Room {
  open(room); const player=actor(room,hash);
  if (room.phase!=='waiting' || !room.approved) throw new Error('guest_not_approved');
  if (room.lobbyReady.includes(player)) return room;
  const next={...room,lobbyReady:[...room.lobbyReady,player],revision:room.revision+1};
  return next.lobbyReady.length===2 ? startRoom(next,next.seats.human.secretHash,now,random) : next;
}
export function act(room: Room, hash: string, intent: Intent, now=Date.now()): Room {
  open(room); const player = actor(room, hash);
  if (room.phase === 'paused') throw new Error('paused');
  if (room.phase !== 'playing' || !room.game) throw new Error('not_playing');
  const game = room.game;
  let next: Game;
  if (intent.type === 'play') next = play(game, player, intent.tileId, intent.end);
  else if (intent.type === 'draw') {
    const index = room.slotIds.findIndex((_, i) => intent.slot === `slot-${i}`);
    const stockIndex = game.stock.findIndex(t => t.id === room.slotIds[index]);
    if (stockIndex < 0) throw new Error('invalid_slot');
    next = drawOrPass(game, player, stockIndex);
  } else {
    if (game.stock.length) throw new Error('cannot_pass');
    next = drawOrPass(game, player);
  }
  if (next === game) throw new Error('illegal_action');
  const winner = matchWinner(next);
  const updated=synchronizeClock(room,{ ...room, attention:undefined, game: next, winner, phase: winner ? 'completed' : 'playing', revision: room.revision + 1 },now);
  // Only the first successful selection after opening resumes a fresh clock.
  // Further draws from an already visible tray keep that running deadline.
  return intent.type==='draw' && room.turnClock?.boneyardOpen
    ? {...updated,turnClock:{deadline:now+TURN_MS,remainingMs:TURN_MS,manualPaused:false}} : updated;
}
export function nextRound(room: Room, hash: string, random: () => number, now=Date.now()): Room {
  open(room); const player = actor(room, hash);
  if (room.phase !== 'playing' || !room.game?.result || room.winner) throw new Error('round_not_finished');
  if (room.invitation?.autoNextRound) throw new Error('auto_round_waiting');
  if (!room.invitation && room.roundReady.includes(player)) return room;
  const roundReady = [...room.roundReady, player];
  if (!room.invitation && roundReady.length < 2) return { ...room, roundReady, revision: room.revision + 1 };
  return dealFollowingRound(room,random,now);
}
function dealFollowingRound(room:Room,random:()=>number,now:number):Room {
  const game = deal(room.seats.human.name, room.target, random, room.game!, room.mode);
  return synchronizeClock(room,{ ...room, game, slotIds: [...game.stockSlots], roundReady: [], revision: room.revision + 1 },now);
}
const remaining = (clock:TurnClock,now:number) => clock.deadline===null ? clock.remainingMs : Math.max(0,Math.min(TURN_MS,clock.deadline-now));
function synchronizeClock(before:Room,after:Room,now:number):Room {
  const next=synchronizeResultClock(before,synchronizeTurnClock(before,after,now),now);
  return next.attention && (['closed','completed'].includes(next.phase) || next.game?.result || before.game?.turn!==next.game?.turn || before.game?.round!==next.game?.round)
    ? {...next,attention:undefined} : next;
}
function synchronizeTurnClock(before:Room,after:Room,now:number):Room {
  if (!after.invitation?.turnTimer) return after.turnClock?{...after,turnClock:undefined}:after;
  if (!after.game || after.game.result || !['playing','paused'].includes(after.phase)) {
    return after.turnClock ? {...after,turnClock:undefined} : after;
  }
  let clock=before.turnClock;
  if (!clock || before.game?.round!==after.game.round || before.game?.turn!==after.game.turn) {
    clock={deadline:after.phase==='paused'?null:now+TURN_MS,remainingMs:TURN_MS,manualPaused:false};
  } else if (after.phase==='paused' && clock.deadline!==null) {
    // A delayed presence alarm freezes at the logical disconnect, not delivery time.
    const pauseAt=Math.min(now,...Object.values(after.seats).flatMap(s=>s?.absentSince===null||!s?[]:[s.absentSince]));
    clock={...clock,deadline:null,remainingMs:remaining(clock,pauseAt)};
  } else if (after.phase==='playing' && clock.deadline===null && !clock.manualPaused && !clock.boneyardOpen) {
    clock={...clock,deadline:now+clock.remainingMs};
  }
  return clock===after.turnClock ? after : {...after,turnClock:clock};
}
/** Advance once per server observation. A late alarm cannot consume unseen turns. */
export function advanceRoom(room:Room,now:number,random:()=>number=Math.random):Room {
  const presence=advancePresence(room,now);
  let next=synchronizeClock(room,presence,now);
  if (next!==presence && next.revision===room.revision) next={...next,revision:next.revision+1};
  if (next.phase==='playing' && next.game?.result && !next.winner && next.resultClock?.deadline!=null && next.resultClock.deadline<=now) {
    return dealFollowingRound(next,random,now);
  }
  if (next.phase==='playing' && next.game && !next.game.result && next.turnClock?.deadline!==null
    && next.turnClock?.deadline!==undefined && next.turnClock.deadline<=now) {
    const player=next.game.turn;
    next={...next,attention:undefined,revision:next.revision+1,game:{...next.game,turn:player==='human'?'computer':'human',passes:0,last:{player,kind:'pass'}},
      turnClock:{deadline:now+TURN_MS,remainingMs:TURN_MS,manualPaused:false}};
  }
  return next;
}
const resultRemaining=(clock:ResultClock,now:number)=>clock.deadline===null?clock.remainingMs:Math.max(0,Math.min(RESULT_MS,clock.deadline-now));
function synchronizeResultClock(before:Room,after:Room,now:number):Room {
  if (!after.invitation?.autoNextRound || !after.game?.result || after.winner || !['playing','paused'].includes(after.phase)) {
    return after.resultClock?{...after,resultClock:undefined}:after;
  }
  let clock=before.resultClock??{deadline:now+RESULT_MS,remainingMs:RESULT_MS,heldBy:[]};
  const heldBy=clock.heldBy.filter(player=>after.seats[player]?.absentSince===null);
  if (heldBy.length!==clock.heldBy.length) clock={...clock,heldBy};
  if (after.phase==='paused' && clock.deadline!==null) {
    const pauseAt=Math.min(now,...Object.values(after.seats).flatMap(s=>s?.absentSince===null||!s?[]:[s.absentSince]));
    clock={...clock,deadline:null,remainingMs:resultRemaining(clock,pauseAt)};
  } else if (after.phase==='playing' && clock.deadline===null && !clock.heldBy.length) {
    clock={...clock,deadline:now+clock.remainingMs};
  }
  return clock===after.resultClock?after:{...after,resultClock:clock};
}
export function holdResult(room:Room,hash:string,hold:boolean,now:number):Room {
  const player=actor(room,hash),clock=room.resultClock;
  if (!room.invitation?.autoNextRound || room.phase!=='playing' || !room.game?.result || room.winner || !clock) throw new Error('round_not_finished');
  if (clock.heldBy.includes(player)===hold) return room;
  const heldBy=hold?[...clock.heldBy,player]:clock.heldBy.filter(seat=>seat!==player),remainingMs=resultRemaining(clock,now);
  return {...room,revision:room.revision+1,resultClock:{remainingMs,heldBy,deadline:heldBy.length?null:now+remainingMs}};
}
export function sendAttention(room:Room,hash:string,kind:AttentionKind,now:number,id:string):Room {
  const player=actor(room,hash);
  if (!room.invitation?.quickActions || room.phase!=='playing' || !room.game || room.game.result || room.winner
    || Object.values(room.seats).some(seat=>!seat || seat.absentSince!==null)) throw new Error('not_playing');
  if (player===room.game.turn) throw new Error('attention_own_turn');
  if (!['wave','knock','look'].includes(kind)) throw new Error('invalid_request');
  const previous=room.attentionSentAt?.[player];
  if (previous!==undefined && now<previous+3000) throw new Error('attention_cooldown');
  return {...room,revision:room.revision+1,attention:{id,from:player,kind,sentAt:now,expiresAt:now+3000},
    attentionSentAt:{...room.attentionSentAt,[player]:now}};
}
export function setTurnTimerPaused(room:Room,hash:string,paused:boolean,now:number):Room {
  const player=actor(room,hash);
  if (!room.invitation?.turnTimer || room.phase!=='playing' || !room.game || room.game.result || !room.turnClock) throw new Error('not_playing');
  if (room.game.turn!==player) throw new Error('not_your_turn');
  const clock=room.turnClock;
  if (clock.boneyardOpen) throw new Error('boneyard_open');
  if (clock.manualPaused===paused) return room;
  const remainingMs=remaining(clock,now);
  return {...room,revision:room.revision+1,turnClock:{manualPaused:paused,remainingMs,deadline:paused?null:now+remainingMs}};
}
export function setBoneyardOpen(room:Room,hash:string,opened:boolean,now:number):Room {
  const player=actor(room,hash),game=room.game,clock=room.turnClock;
  if (!room.invitation?.turnTimer || room.phase!=='playing' || !game || game.result || !clock) throw new Error('not_playing');
  if (game.turn!==player) throw new Error('not_your_turn');
  if (!opened && !clock.boneyardOpen) return room;
  if (!game.stock.length || game.hands[player].some(tile=>legalEnds(game,player,tile).length)) throw new Error('cannot_draw');
  if (opened && clock.boneyardOpen) return room;
  // Opening replaces manual pause. Drawing or cancelling resumes thirty seconds.
  return {...room,revision:room.revision+1,turnClock:{deadline:opened?null:now+TURN_MS,
    remainingMs:TURN_MS,manualPaused:false,...(opened?{boneyardOpen:true as const}:{})}};
}
export function advancePresence(room: Room, now: number): Room {
  if (room.phase === 'closed' || room.phase === 'completed') return room;
  if (room.phase === 'waiting') return now < room.createdAt + WAITING_MS ? room
    : { ...room, phase: 'closed', closeReason: 'waiting_expired', revision: room.revision + 1 };
  const next = structuredClone(room);
  for (const player of ['human','computer'] as const) {
    const s = next.seats[player];
    if (s && s.absentSince === null && now >= s.leaseUntil) {
      s.absentSince = s.leaseUntil; s.closeAt = s.leaseUntil + GRACE_MS;
    }
  }
  if (Object.values(next.seats).some(s => s?.closeAt !== null && s && now >= s.closeAt!)) {
    next.phase = 'closed'; next.closeReason = 'reconnect_timeout'; next.winner = null;
  } else next.phase = Object.values(next.seats).some(s => s?.absentSince !== null) ? 'paused' : 'playing';
  const changed = next.phase !== room.phase || (['human','computer'] as const).some(p => next.seats[p]?.absentSince !== room.seats[p]?.absentSince);
  if (!changed) return room;
  next.revision++; return next;
}
export function heartbeat(room: Room, hash: string, now: number, random:()=>number=Math.random): Room {
  const current = advanceRoom(room, now,random); open(current);
  const player = actor(current, hash);
  const next = structuredClone(current), s = next.seats[player]!;
  const wasAbsent = s.absentSince !== null;
  s.leaseUntil = now + LEASE_MS; s.absentSince = null; s.closeAt = null;
  if (next.phase === 'paused' && !Object.values(next.seats).some(item => item?.absentSince !== null)) next.phase = 'playing';
  if (wasAbsent) next.revision++;
  return advanceRoom(synchronizeClock(current,next,now),now,random);
}
export function disconnect(room: Room, hash: string, now: number, random:()=>number=Math.random): Room {
  const current = advanceRoom(room, now,random); open(current);
  const player = actor(current, hash);
  // An invitation can start on acceptance, so explicit departure must invalidate
  // the inviter's lease immediately even before a game exists. Legacy lobbies
  // keep their existing ready/approval policy.
  if (current.phase === 'waiting' && current.invitation) {
    if (current.seats[player]!.leaseUntil <= now) return current;
    const next = structuredClone(current);
    next.seats[player]!.leaseUntil = now; next.revision++;
    return next;
  }
  if (current.phase === 'waiting' || current.phase === 'completed' || current.seats[player]!.absentSince !== null) return current;
  const next = structuredClone(current);
  next.seats[player]!.absentSince = now; next.seats[player]!.closeAt = now + GRACE_MS;
  next.phase = 'paused'; next.revision++; return synchronizeClock(current,next,now);
}
export function deadline(room: Room): number | null {
  if (room.phase === 'closed' || room.phase === 'completed') return null;
  if (room.phase === 'waiting') return room.createdAt + WAITING_MS;
  return Math.min(...Object.values(room.seats).filter((s): s is Seat => !!s).map(s => s.closeAt ?? s.leaseUntil),
    room.phase==='playing' && room.invitation?.turnTimer ? room.turnClock?.deadline??Infinity : Infinity,
    room.phase==='playing' && room.invitation?.autoNextRound ? room.resultClock?.deadline??Infinity : Infinity);
}
export function project(room: Room, hash: string, now=Date.now()) {
  const player = actor(room, hash), rival = player === 'human' ? 'computer' : 'human', g = room.game;
  const legalMoves=g && room.phase==='playing' ? g.hands[player].flatMap(tile=>{
    const ends=legalEnds(g,player,tile); return ends.length ? [{tileId:tile.id,ends}] : [];
  }) : [];
  return { protocol: 1, code: room.code, epoch: room.epoch, revision: room.revision, phase: room.phase,
    ...(room.manualCode&&room.manualCodeExpires!>now&&['waiting','playing','paused'].includes(room.phase)?{manualCode:room.manualCode}:{}),
    ...(room.invitation ? {presentation:{avatars:room.invitation.avatars,openingId:g?.openingId??null,
      ...(room.invitation.customAvatars?{avatarPhotos:room.invitation.photos??{human:null,computer:null}}:{}),
      ...(room.invitation.quickActions?{attention:room.attention??null}:{}),
      ...(room.invitation.autoNextRound?{resultClock:room.resultClock&&g?.result&&!room.winner&&['playing','paused'].includes(room.phase)?{
        durationMs:RESULT_MS,remainingMs:resultRemaining(room.resultClock,now),deadline:room.resultClock.deadline,serverNow:now,heldBy:room.resultClock.heldBy}:null}:{}),
      ...(room.invitation.turnTimer?{turnClock:room.turnClock&&g&&!g.result&&['playing','paused'].includes(room.phase)?{
        durationMs:TURN_MS,remainingMs:remaining(room.turnClock,now),deadline:room.turnClock.deadline,serverNow:now,
        paused:room.phase==='paused'||room.turnClock.manualPaused||!!room.turnClock.boneyardOpen}:null}:{})}} : {}),
    seat: player, names: { human: room.seats.human.name, computer: room.seats.computer?.name ?? null },
    approved: room.approved, closeReason: room.closeReason, winner: room.winner,
    reconnectDeadline: Object.values(room.seats).map(s => s?.closeAt ?? null),
    round: g?.round ?? 0, turn: g?.turn ?? null, board: g?.board ?? [], hand: g?.hands[player] ?? [],
    opponentCount: g?.hands[rival].length ?? 0,
    stock: room.slotIds.flatMap((id, i) => g?.stock.some(t => t.id === id) ? [`slot-${i}`] : []),
    scores: g?.scores ?? null, wins: g?.wins ?? null, mode: room.mode, target: room.target,
    result: g?.result ?? null, roundReady: room.roundReady, lobbyReady:room.lobbyReady,
    legalMoves, canDraw:!!g && room.phase==='playing' && !g.result && g.turn===player && !legalMoves.length && !!g.stock.length,
    canPass:!!g && room.phase==='playing' && !g.result && g.turn===player && !legalMoves.length && !g.stock.length,
    last: !g?.last ? null : g.last.kind === 'draw' ? { player: g.last.player, kind: 'draw' } : g.last };
}
