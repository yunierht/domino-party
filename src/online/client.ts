import {retireCancelledInvitation} from './cancelInvitation.ts';
import {parseGameTransfer,saveTransferredSession} from './gameTransfer.ts';
import type {GameTransfer} from './gameTransfer.ts';
import {parseIceConfiguration} from './iceConfiguration.ts';
import {SessionGeneration} from './sessionGeneration.ts';
import {parseView} from './contract.ts';
import type {Action,OnlineView,Session,Vault,Transport,LiveConnection} from './contract.ts';
import type {VoiceRequest,VoiceReply} from './voiceProtocol';
export interface ClientState {view:OnlineView|null;busy:boolean;status:'idle'|'connected'|'disconnected';error:string|null;canResume:boolean}
export class OnlineClient{
  private session:Session|null=null;
 private cancelledCreates=new Set<string>();
  private lifetime:SessionGeneration;
  private listeners=new Set<(state:ClientState)=>void>();
  private live:LiveConnection|null=null;
  private liveKey='';private liveVersion=0;private liveHealthy=false;
  private liveRetryAt=0;private liveFailures=0;private livePulseAt=0;private liveOpenedAt=0;private liveReceivedAt=0;
  private stopLive(){this.liveVersion++;const old=this.live;this.live=null;this.liveKey='';this.liveHealthy=false;old?.close();}
  private ensureLive(){
    const s=this.session;if(!this.transport.watch||!s?.code||s.cancelledInvitation||['closed','completed'].includes(this.state.view?.phase??''))return;
    const key=s.token+':'+s.code;
    if(this.live&&this.liveKey===key)return;
    if(Date.now()<this.liveRetryAt)return;
    this.stopLive();const version=this.liveVersion,generation=this.lifetime.capture();this.liveKey=key;this.liveOpenedAt=Date.now();
    const current=()=>version===this.liveVersion&&this.lifetime.current(generation)&&this.session?.token===s.token&&this.session?.code===s.code;
    const failed=()=>{if(!current())return;this.stopLive();this.liveRetryAt=Date.now()+Math.min(30000,1000*2**Math.min(this.liveFailures++,5));};
    try{this.live=this.transport.watch('/rooms/'+s.code+'/socket',s.token,value=>{
      if(!current())return;
      try{this.accept(value,generation);if(!this.liveHealthy)this.livePulseAt=Date.now();this.liveReceivedAt=Date.now();this.liveHealthy=true;this.liveFailures=0;if(['closed','completed'].includes(this.state.view?.phase??''))this.stopLive();}
      catch{failed();}
    },failed);}catch{failed();}
  }
  private resultHoldIntent:{held:boolean;token:string;code:string;epoch:string;round:number}|null=null;
  private sendingResultHold=false;
  state:ClientState={view:null,busy:false,status:'idle',error:null,canResume:false};
  private vault:Vault;private transport:Transport;private credential:()=>Promise<string>;private endpoint:string;
  constructor(vault:Vault,transport:Transport,credential:()=>Promise<string>,endpoint:string){this.vault=vault;this.lifetime=new SessionGeneration(vault);this.transport=transport;this.credential=credential;this.endpoint=endpoint;}
 async exchangeGame(input:Record<string,unknown>){const generation=this.lifetime.capture(),s=this.requireSession();if(!s.code)throw Error('no_session');const raw=await this.transport.request('/rooms/'+s.code+'/transfer',s.token,input);this.lifetime.assert(generation);return parseGameTransfer(raw);}
 async proposeGame(target:'domino'|'poker'){const generation=this.lifetime.capture(),s=this.requireSession();if(!s.code)throw Error('no_session');this.accept(await this.transport.request('/rooms/'+s.code,s.token),generation);const v=this.state.view;if(!v)throw Error('no_session');return this.exchangeGame({type:'propose',id:await this.credential(),target,epoch:v.epoch,revision:v.revision});}
 async saveGameTransfer(t:GameTransfer,vault:import('../online/contract').Vault){const generation=this.lifetime.capture(),s=this.requireSession();const v=this.state.view;if(!v||t.epoch!==v.epoch)throw Error('stale_epoch');await saveTransferredSession(this.transport,s,t,vault,()=>this.lifetime.assert(generation),v.seat);}
  subscribe(listener:(state:ClientState)=>void){this.listeners.add(listener);listener(this.state);return()=>{this.listeners.delete(listener);};}
  private emit(patch:Partial<ClientState>){this.state={...this.state,...patch};for(const listener of this.listeners)listener(this.state);}
  private accept(raw:unknown,generation:number){this.lifetime.assert(generation);const view=parseView(raw);const old=this.state.view;
    if(this.session?.code&&view.code!==this.session.code)throw Error('invalid_snapshot');
    if(old&&(view.epoch!==old.epoch||view.seat!==old.seat))throw Error('invalid_snapshot');
    if(!old||view.revision>=old.revision)this.emit({view,status:'connected',error:null});
  }
  private async persist(session:Session,generation:number){await this.lifetime.storage(()=>this.vault.write(session),generation);this.session=session;this.emit({canResume:true});}
  private requireSession(){if(!this.session)throw Error('no_session');return this.session;}
  private async readSaved(generation:number){const session=await this.lifetime.storage(()=>this.vault.read(),generation);if(session){if(session.endpoint!==this.endpoint)throw Error('endpoint_changed');if(!/^[a-f0-9]{64}$/.test(session.token))throw Error('storage_error');}this.session=session;this.emit({canResume:!!session&&!session.cancelledInvitation,...(!session||session.cancelledInvitation?{view:null}:{})});if(session?.cancelledInvitation)void this.retireInvitation(session);}
  async load(){const generation=this.lifetime.capture();try{await this.readSaved(generation);}catch{if(this.lifetime.current(generation))this.emit({error:'storage_error'});}}
  /** Room identity only; recovery credentials stay private. */
  get savedRoomCode(){return this.session?.code??this.session?.pendingJoin;}
  private async run(task:(generation:number)=>Promise<void>,newSession=false){if(this.state.busy)return;const generation=newSession?this.lifetime.advance():this.lifetime.capture();if(newSession){this.stopLive();this.liveRetryAt=0;this.liveFailures=0;this.resultHoldIntent=null;this.sendingResultHold=false;}this.emit({busy:true,error:null});try{await task(generation);}catch(error){if(this.lifetime.current(generation))this.emit({error:error instanceof Error?error.message:'connection_error',status:'disconnected'});}finally{if(this.lifetime.current(generation)){this.emit({busy:false});void this.flushResultHold();}}}
  async create(name:string,target:number,mode:'points'|'wins',invitation?:{avatar:string;turnTimer?:boolean;autoNextRound?:boolean;quickActions?:boolean;customAvatars?:boolean;hostReturn?:boolean;avatarPhoto?:string}){await this.run(async generation=>{
    const token=await this.credential();this.lifetime.assert(generation);this.emit({view:null});
    await this.persist({endpoint:this.endpoint,token,name,pendingCreate:{target,mode,...(invitation?{invitation}:{})}}, generation);
    await this.recover(generation);
  },true);}
 // Probe only after explicit acceptance; never replace a saved seat on an uncertain read.
 private async reuseInvitation(target:string,generation:number){
  const saved=this.session;if(!saved||saved.cancelledInvitation)return false;
  if(saved.pendingJoin===target){await this.recover(generation);return true;}
  if(!saved.code)return false;
  let view:ReturnType<typeof parseView>;
  try{view=parseView(await this.transport.request('/rooms/'+saved.code,saved.token));}
  catch(error){this.lifetime.assert(generation);if(['not_found','room_missing','unauthorized'].includes(error instanceof Error?error.message:''))return false;throw error;}
  this.lifetime.assert(generation);
  if(view.code!==target&&view.manualCode!==target)return false;
  this.accept(view,generation);await this.recover(generation);return true;
 }
  async join(name:string,code:string,acceptance?:{avatar:string;acceptInvitation:boolean;avatarPhoto?:string}){await this.run(async generation=>{
    if(await this.reuseInvitation(code,generation))return;
    if(!/^(?:\d{6}|[A-F0-9]{10})$/.test(code))throw Error('invalid_code');
    const token=await this.credential();this.lifetime.assert(generation);this.emit({view:null});
    await this.persist({endpoint:this.endpoint,token,name,pendingJoin:code,...(acceptance?{acceptance}:{})}, generation);await this.recover(generation);
  },true);}
  private async recover(generation:number){this.lifetime.assert(generation);let s=this.requireSession();
    if(s.cancelledInvitation){this.emit({view:null,busy:false,status:'idle',error:null,canResume:false});return;}
    if(s.pendingCreate){const view=parseView(await this.transport.request('/rooms',s.token,{name:s.name,...s.pendingCreate}));
      if(!this.lifetime.current(generation)&&this.cancelledCreates.delete(s.token))void this.retireInvitation({...s,cancelledInvitation:true},view);this.lifetime.assert(generation);
      s={endpoint:s.endpoint,token:s.token,name:s.name,code:view.code};await this.persist(s, generation);this.accept(view, generation);}
    if(s.pendingJoin){const view=parseView(await this.transport.request(`${/^\d{6}$/.test(s.pendingJoin)?'/manual':'/rooms'}/${s.pendingJoin}/join`,s.token,{name:s.name,...s.acceptance}));
      s={endpoint:s.endpoint,token:s.token,name:s.name,code:view.code};await this.persist(s, generation);this.accept(view, generation);}
    if(s.pendingCommand)await this.sendPending(generation);
    if(s.code)this.accept(await this.transport.request(`/rooms/${s.code}/heartbeat`,s.token,{}), generation);
    const v=this.state.view;
    if(!this.resultHoldIntent&&v?.presentation?.resultClock?.heldBy.includes(v.seat))this.setResultHeld(false);
    this.ensureLive();
  }
  async resume(){await this.run(async generation=>{await this.readSaved(generation);await this.recover(generation);});}
 async iceConfiguration(){const generation=this.lifetime.capture(),saved=this.requireSession(),view=this.state.view;if(!saved.code||!view||view.phase!=='playing')throw Error('not_playing');const raw=await this.transport.request('/rooms/'+saved.code+'/ice',saved.token,{epoch:view.epoch});this.lifetime.assert(generation);return parseIceConfiguration(raw,process.env.EXPO_PUBLIC_ONLINE_MODE??'lan');}
  async voice(request:VoiceRequest):Promise<VoiceReply>{const generation=this.lifetime.capture(),session=this.requireSession();if(!session.code)throw Error('no_session');const reply=await this.transport.request(`/rooms/${session.code}/voice`,session.token,request) as VoiceReply;this.lifetime.assert(generation);return reply;}
  async refresh(){if(this.state.busy||!this.session?.code||this.session.cancelledInvitation||this.session.pendingCommand||['closed','completed'].includes(this.state.view?.phase??''))return;
    if(this.live&&!this.liveHealthy&&Date.now()-this.liveOpenedAt>6000){this.stopLive();this.liveRetryAt=Date.now()+30000;}
    if(this.liveHealthy&&Date.now()-this.liveReceivedAt>=25000){this.stopLive();this.liveRetryAt=Date.now()+1000;}
    this.ensureLive();
    if(this.liveHealthy&&this.live){
      if(Date.now()-this.livePulseAt>=10000){try{this.live.heartbeat();this.livePulseAt=Date.now();}catch{this.stopLive();this.liveRetryAt=Date.now()+1000;}}
      if(this.liveHealthy)return;
    }
    const generation=this.lifetime.capture(),session=this.session;
    try{const raw=await this.transport.request(`/rooms/${session.code}/heartbeat`,session.token,{});if(this.lifetime.current(generation)&&this.session?.token===session.token&&this.session.code===session.code){this.accept(raw, generation);void this.flushResultHold();}}
    catch(error){if(this.lifetime.current(generation)&&this.session?.token===session.token)this.emit({status:'disconnected',error:error instanceof Error?error.message:'connection_error'});}}
  async command(action:Action){await this.run(async generation=>{
    const s=this.requireSession(),v=this.state.view;if(!v||!s.code)throw Error('no_session');
    if(s.pendingCommand){await this.recover(generation);return;}
    const id=await this.credential();
    await this.persist({...s,pendingCommand:{commandId:id,epoch:v.epoch,revision:v.revision,round:v.round,action}}, generation);
    await this.sendPending(generation);
  });}
  /** Coalesces physical press/release intent so release cannot be dropped behind a busy request. */
  setResultHeld(held:boolean){
    const v=this.state.view,s=this.session;if(!s?.code||!v?.result||!v.presentation?.resultClock)return;
    this.resultHoldIntent={held,token:s.token,code:s.code,epoch:v.epoch,round:v.round};
    void this.flushResultHold();
  }
  private async flushResultHold(){
    if(this.sendingResultHold||this.state.busy||this.state.status!=='connected')return;
    const generation=this.lifetime.capture();this.sendingResultHold=true;
    try{while(this.lifetime.current(generation)&&this.resultHoldIntent&&!this.state.busy&&this.state.status==='connected'){
      const intent=this.resultHoldIntent,v=this.state.view,s=this.session;
      if(!s||s.token!==intent.token||!v?.result||v.code!==intent.code||v.epoch!==intent.epoch||v.round!==intent.round||!v.presentation?.resultClock){this.resultHoldIntent=null;return;}
      if(v.phase!=='playing'||v.presentation.resultClock.heldBy.includes(v.seat)===intent.held)return;
      await this.command({type:intent.held?'holdResult':'releaseResult'});
      // A newer physical state is handled next; uncertain ACKs wait for normal session recovery.
      if(!this.lifetime.current(generation)||this.state.error)return;
      const current=this.state.view;
      if(this.resultHoldIntent===intent&&current?.presentation?.resultClock?.heldBy.includes(current.seat)!==intent.held)return;
    }}finally{if(this.lifetime.current(generation))this.sendingResultHold=false;}
  }
  private async sendPending(generation:number,rebaseLobby=true){this.lifetime.assert(generation);const s=this.requireSession(),p=s.pendingCommand;if(!p||!s.code)return;
    try{const raw=await this.transport.request(`/rooms/${s.code}/commands`,s.token,{commandId:p.commandId,epoch:p.epoch,revision:p.revision,round:p.round,...p.action});
      this.accept(raw, generation);await this.persist({...s,pendingCommand:undefined}, generation);}
    catch(error){this.lifetime.assert(generation);const message=error instanceof Error?error.message:'';
      if(rebaseLobby&&message==='stale_revision'&&['approve','ready'].includes(p.action.type)){
        const latest=parseView(await this.transport.request(`/rooms/${s.code}`,s.token));this.accept(latest, generation);
        if(latest.epoch===p.epoch&&latest.round===p.round&&latest.phase==='waiting'){
          await this.persist({...s,pendingCommand:{...p,commandId:await this.credential(),revision:latest.revision}}, generation);
          await this.sendPending(generation, false);return;
        }
        if(latest.phase==='playing'&&p.action.type==='ready'){
          await this.persist({...s,pendingCommand:undefined}, generation);return;
        }
      }
      if(rebaseLobby&&message==='stale_revision'&&['holdResult','releaseResult'].includes(p.action.type)){
        const latest=parseView(await this.transport.request(`/rooms/${s.code}`,s.token));this.accept(latest, generation);
        if(latest.epoch===p.epoch&&latest.round===p.round&&latest.phase==='playing'&&latest.result&&latest.presentation?.resultClock){
          await this.persist({...s,pendingCommand:{...p,commandId:await this.credential(),revision:latest.revision}}, generation);await this.sendPending(generation, false);return;
        }
        await this.persist({...s,pendingCommand:undefined}, generation);return;
      }
      if(['stale_revision','stale_epoch','stale_round','illegal_action','paused','closed','guest_not_approved','command_conflict','cannot_pass','cannot_draw','not_your_turn','not_playing','invalid_request','boneyard_open','auto_round_waiting','attention_cooldown','attention_own_turn','invalid_slot','both_not_ready','transfer_pending'].includes(message)){
        await this.persist({...s,pendingCommand:undefined}, generation);this.accept(await this.transport.request(`/rooms/${s.code}`,s.token), generation);
      }throw error;
    }
  }
 private retireInvitation(session:Session,lateRoom?:ReturnType<typeof parseView>){return retireCancelledInvitation({session,vault:this.vault,transport:this.transport,prefix:'',parse:parseView,credential:this.credential,storage:task=>this.lifetime.storage(task)},lateRoom);}
 async cancelInvitation(){
  if(this.state.view&&this.state.view.phase!=='waiting')return;
  const saved=this.session;if(saved?.pendingCreate)this.cancelledCreates.add(saved.token);this.stopLive();this.lifetime.advance();this.resultHoldIntent=null;this.sendingResultHold=false;
  const cancelled=saved?{...saved,cancelledInvitation:true as const}:null;this.session=cancelled;
  this.emit({view:null,busy:false,status:'idle',error:null,canResume:false});
  await this.lifetime.storage(()=>cancelled?this.vault.write(cancelled):this.vault.clear());
  if(cancelled?.code)void this.retireInvitation(cancelled);
 }
  private async notifyDisconnect(s:Session|null){if(s?.code&&!s.cancelledInvitation)try{await this.transport.request(`/rooms/${s.code}/disconnect`,s.token,{});}catch{/* lease handles transport loss */}}
  async disconnect(){this.stopLive();const s=this.session,generation=this.lifetime.advance();if(this.resultHoldIntent)this.resultHoldIntent={...this.resultHoldIntent,held:false};this.sendingResultHold=false;this.emit({busy:false,status:'disconnected'});await this.notifyDisconnect(s);if(this.lifetime.current(generation))this.emit({status:'disconnected'});}
  async forget(){this.stopLive();const s=this.session,generation=this.lifetime.advance();this.session=null;this.resultHoldIntent=null;this.sendingResultHold=false;this.emit({view:null,busy:false,canResume:false,error:null,status:'idle'});const clearing=this.lifetime.storage(()=>this.vault.clear());await Promise.all([clearing,this.notifyDisconnect(s)]);if(this.lifetime.current(generation))this.emit({view:null,busy:false,canResume:false,error:null,status:'idle'});}
}
