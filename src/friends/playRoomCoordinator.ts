import type {PlayView} from './playClient';
import type {PlayInvitation,PlayGame} from './playInvitation';import type {Session,Vault} from '../online/contract';
export type RoomView={code:string;phase:string;seat:'human'|'computer';names:{computer:string|null};lobbyReady?:string[];approved?:boolean};
export type RoomPort={state:{view:RoomView|null;error:string|null;status:string};load():Promise<void>;resume():Promise<void>;create():Promise<void>;join(room:string):Promise<void>;approve():Promise<void>;leave():Promise<void>;disconnect():Promise<void>};
export type StagedRoom={invitation:PlayView;session:Session;view:RoomView;vault:Vault};
export type ActiveRoom={game:PlayGame;session:Session;view:RoomView};
type API={read(id:string):Promise<PlayView>;allocate(id:string):Promise<PlayView>;attach(id:string,allocation:string,room:string,token:string):Promise<PlayView>;reset(id:string,allocation:string,room:string,token:string):Promise<PlayView>};
type Dependencies={api:API;stage(id:string,generation:number):Vault;active(game:PlayGame):Vault;port(game:PlayGame,vault:Vault):RoomPort};
const terminal=(error:unknown)=>error instanceof Error&&['not_found','room_missing','closed','room_closed'].includes(error.message);
/** Staging never touches the active vault or game context. One in-flight prepare per agreement. */
export class PlayRoomCoordinator{
 private deps:Dependencies;private work=new Map<string,Promise<StagedRoom|null>>();
 constructor(deps:Dependencies){this.deps=deps;}
 prepare(id:string,actor:string){const running=this.work.get(id);if(running)return running;const next=this.prepareOnce(id,actor).finally(()=>this.work.delete(id));this.work.set(id,next);return next;}
 private async prepareOnce(id:string,actor:string):Promise<StagedRoom|null>{
 let p=await this.deps.api.read(id);if(!['accepted','preparing','ready','connected'].includes(p.state))throw Error('agreement_unavailable');
 if(actor!==p.from&&actor!==p.to)throw Error('not_participant');
 if(!p.allocation){if(actor!==p.from)return null;p=await this.deps.api.allocate(id);}
 const vault=this.deps.stage(id,p.generation),client=this.deps.port(p.game,vault);await client.load();let saved=await vault.read();
 if(saved)await client.resume();else if(actor===p.from)await client.create();else if(p.room)await client.join(p.room);else return null;
 saved=await vault.read();if(!saved)throw Error('storage_error');
 if(client.state.error){if(terminal(Error(client.state.error))&&(p.room||saved.code)){if(actor!==p.from)return null;await this.deps.api.reset(id,p.allocation!,p.room??saved.code!,saved.token);await vault.clear();return null;}throw Error(client.state.error);}
 let view=client.state.view;if(!view)throw Error('room_unavailable');
 if(['closed','completed'].includes(view.phase)){if(actor!==p.from)return null;await this.deps.api.reset(id,p.allocation!,view.code,saved.token);await vault.clear();return null;}
 if(actor===p.from&&!p.room)p=await this.deps.api.attach(id,p.allocation!,view.code,saved.token);
 if(actor===p.from&&view.phase==='waiting'&&view.names.computer){await client.approve();view=client.state.view;if(client.state.error)throw Error(client.state.error);}
 if(!view||view.code!==p.room)throw Error('room_changed');
 if(view.phase!=='playing')return null;
 return {invitation:p,session:saved,view,vault};
 }
 async activeRooms():Promise<ActiveRoom[]>{const rooms:ActiveRoom[]=[];for(const game of ['domino','poker'] as const){const vault=this.deps.active(game),session=await vault.read();if(!session||session.cancelledInvitation)continue;if(session.pendingCreate||session.pendingJoin||session.pendingCommand)throw Error('active_room_uncertain');if(!session.code)continue;const client=this.deps.port(game,vault);await client.load();await client.resume();if(client.state.error){if(terminal(Error(client.state.error)))continue;throw Error('active_room_uncertain');}const view=client.state.view;if(view&&['waiting','playing','paused'].includes(view.phase))rooms.push({game,session,view});}return rooms;}
 async enter(staged:StagedRoom,approved:ActiveRoom[],current:()=>boolean){
 if(!current())throw Error('intent_changed');const p=await this.deps.api.read(staged.invitation.id);if(!current()||p.allocation!==staged.invitation.allocation||p.room!==staged.session.code||!['ready','connected'].includes(p.state))throw Error('intent_changed');
 if(!p.to||[p.from,p.to].some(actor=>!(p.entered??[]).includes(actor)&&(p.readiness[actor]??0)<=(p.serverNow??Date.now())))throw Error('friend_offline');
 const target=this.deps.port(p.game,staged.vault);await target.load();await target.resume();if(target.state.error||target.state.view?.phase!=='playing')throw Error('friend_offline');
 const active=await this.activeRooms();for(const room of active){if(room.session.code===p.room)continue;const approval=approved.find(a=>a.game===room.game&&a.session.code===room.session.code&&a.session.token===room.session.token);if(!approval)throw Error('active_room_changed');}
 if(!current())throw Error('intent_changed');
 for(const room of active){if(room.session.code===p.room)continue;const vault=this.deps.active(room.game),before=await vault.read();if(before?.token!==room.session.token||before.code!==room.session.code)throw Error('active_room_changed');const old=this.deps.port(room.game,vault);await old.load();await old.resume();await old.leave();if(old.state.error||old.state.view?.phase!=='closed')throw Error('leave_unconfirmed');}
 if(!current())throw Error('intent_changed');const session=await staged.vault.read();if(!session||session.code!==p.room)throw Error('storage_error');await this.deps.active(p.game).write(session);return session;
 }
}
