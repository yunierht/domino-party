import {parseBlackjackView} from './onlineContract.ts';
import type {BlackjackOnlineAction,BlackjackOnlineView,BlackjackSession,BlackjackVault} from './onlineContract';
import type {Transport} from '../online/contract';
import type {VoiceRequest,VoiceReply} from '../online/voiceProtocol';
export interface BlackjackClientState {view:BlackjackOnlineView|null;busy:boolean;status:'idle'|'connected'|'disconnected';error:string|null;canResume:boolean}
export class BlackjackOnlineClient {
 private session:BlackjackSession|null=null;private listeners=new Set<(state:BlackjackClientState)=>void>();
 private refreshing=false;
 state:BlackjackClientState={view:null,busy:false,status:'idle',error:null,canResume:false};
 private vault:BlackjackVault;private transport:Transport;private credential:()=>Promise<string>;private endpoint:string;
 constructor(vault:BlackjackVault,transport:Transport,credential:()=>Promise<string>,endpoint:string){this.vault=vault;this.transport=transport;this.credential=credential;this.endpoint=endpoint;}
 subscribe(fn:(state:BlackjackClientState)=>void){this.listeners.add(fn);fn(this.state);return()=>{this.listeners.delete(fn);};}
 private emit(patch:Partial<BlackjackClientState>){this.state={...this.state,...patch};for(const fn of this.listeners)fn(this.state);}
 private accept(raw:unknown){const view=parseBlackjackView(raw),old=this.state.view;if(this.session?.code&&view.code!==this.session.code||old&&(old.epoch!==view.epoch||old.seat!==view.seat))throw Error('invalid_snapshot');if(!old||view.revision>=old.revision)this.emit({view,status:'connected',error:null});}
 private async persist(session:BlackjackSession){await this.vault.write(session);this.session=session;this.emit({canResume:true});}
 private require(){if(!this.session)throw Error('no_session');return this.session;}
 private async run(task:()=>Promise<void>){if(this.state.busy)return;this.emit({busy:true,error:null});try{await task();}catch(e){this.emit({error:e instanceof Error?e.message:'connection_error',status:'disconnected'});}finally{this.emit({busy:false});}}
 async load(){try{const value=await this.vault.read() as BlackjackSession|null;if(value){if(value.endpoint!==this.endpoint||!/^[a-f0-9]{64}$/.test(value.token))throw Error('storage_error');this.session=value;this.emit({canResume:true});}}catch{this.emit({error:'storage_error'});}}
 async create(name:string,avatar:string,avatarPhoto?:string){await this.run(async()=>{this.emit({view:null});await this.persist({endpoint:this.endpoint,token:await this.credential(),name,pendingCreate:{target:100,mode:'points',invitation:{avatar,...(avatarPhoto?{avatarPhoto}:{})}}});await this.recover();});}
 async join(name:string,code:string,avatar:string,avatarPhoto?:string){await this.run(async()=>{if(!/^(?:\d{6}|[A-F0-9]{10})$/.test(code))throw Error('invalid_code');this.emit({view:null});await this.persist({endpoint:this.endpoint,token:await this.credential(),name,pendingJoin:code,acceptance:{avatar,acceptInvitation:true,...(avatarPhoto?{avatarPhoto}:{})}});await this.recover();});}
 private async recover(){let s=this.require();
  if(s.pendingCreate){const v=parseBlackjackView(await this.transport.request('/blackjack/rooms',s.token,{name:s.name,...s.pendingCreate.invitation}));s={endpoint:s.endpoint,token:s.token,name:s.name,code:v.code};await this.persist(s);this.accept(v);}
  if(s.pendingJoin){const v=parseBlackjackView(await this.transport.request(`/blackjack/${/^\d{6}$/.test(s.pendingJoin)?'manual':'rooms'}/${s.pendingJoin}/join`,s.token,{name:s.name,...s.acceptance}));s={endpoint:s.endpoint,token:s.token,name:s.name,code:v.code};await this.persist(s);this.accept(v);}
  if(s.pendingBlackjackCommand)await this.sendPending();s=this.require();
  if(s.code&&!['closed','completed'].includes(this.state.view?.phase??''))this.accept(await this.transport.request(`/blackjack/rooms/${s.code}/heartbeat`,s.token,{}));
 }
 async resume(){await this.run(()=>this.recover());}
 async refresh(){
  if(this.state.busy||this.refreshing||!this.session?.code||this.session.pendingBlackjackCommand)return;
  const session=this.session;this.refreshing=true;
  try{const raw=await this.transport.request(`/blackjack/rooms/${session.code}/heartbeat`,session.token,{});
   if(this.session?.token===session.token&&this.session.code===session.code){this.accept(raw);}
  }catch(error){if(this.session?.token===session.token&&this.session.code===session.code)this.emit({status:'disconnected',error:error instanceof Error?error.message:'connection_error'});}
  finally{this.refreshing=false;}
 }
 async command(action:BlackjackOnlineAction){await this.run(async()=>{const s=this.require(),v=this.state.view;if(!s.code||!v)throw Error('no_session');if(s.pendingBlackjackCommand){await this.recover();return;}await this.persist({...s,pendingBlackjackCommand:{commandId:await this.credential(),epoch:v.epoch,revision:v.revision,round:v.round,action}});await this.sendPending();});}
 private async sendPending(rebase=true){const s=this.require(),p=s.pendingBlackjackCommand;if(!p||!s.code)return;
  try{this.accept(await this.transport.request(`/blackjack/rooms/${s.code}/commands`,s.token,{commandId:p.commandId,epoch:p.epoch,revision:p.revision,round:p.round,...p.action}));await this.persist({...s,pendingBlackjackCommand:undefined});}
  catch(e){const code=e instanceof Error?e.message:'';let refreshed:BlackjackOnlineView|undefined;
   if(code==='stale_revision'&&rebase&&(p.action.type==='bet'||p.action.type==='nextHand')){
    const latest=parseBlackjackView(await this.transport.request(`/blackjack/rooms/${s.code}`,s.token));refreshed=latest;this.accept(latest);
    const same=latest.epoch===p.epoch&&latest.round===p.round&&latest.phase==='playing';
    const safe=same&&(p.action.type==='bet'?latest.legal.canBet&&!latest.players[latest.seat].confirmed&&p.action.amount<=latest.legal.maxBet:latest.stage==='complete'&&!latest.roundReady.includes(latest.seat));
    if(safe){await this.persist({...s,pendingBlackjackCommand:{...p,commandId:await this.credential(),revision:latest.revision}});await this.sendPending(false);return;}
   }
   if(['stale_revision','stale_epoch','stale_round','illegal_action','paused','closed','not_playing','not_your_turn','Invalid raise','Not your turn','Must call or fold','Nothing to call','attention_cooldown','attention_own_turn','command_conflict','round_not_finished','invalid_request','bank_reserve','invalid_bet'].includes(code)){
    await this.persist({...s,pendingBlackjackCommand:undefined});this.accept(refreshed??await this.transport.request(`/blackjack/rooms/${s.code}`,s.token));
   }throw e;
  }
 }
 async voice(request:VoiceRequest):Promise<VoiceReply>{const s=this.require();if(!s.code)throw Error('no_session');return this.transport.request(`/blackjack/rooms/${s.code}/voice`,s.token,request) as Promise<VoiceReply>;}
 async disconnect(){const s=this.session;if(s?.code)try{await this.transport.request(`/blackjack/rooms/${s.code}/disconnect`,s.token,{});}catch{}this.emit({status:'disconnected'});}
 async forget(){await this.disconnect();await this.vault.clear();this.session=null;this.emit({view:null,status:'idle',canResume:false,error:null});}
}
