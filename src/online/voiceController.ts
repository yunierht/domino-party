import type {VoiceCall,VoiceIce,VoiceMessage,VoiceReply,VoiceRequest} from './voiceProtocol';
export interface VoicePeer {offer():Promise<string>;answer():Promise<string>;remote(type:'offer'|'answer',sdp:string):Promise<void>;ice(candidate:VoiceIce):Promise<void>;close():void}
export interface VoiceMedia {mute(value:boolean):void;stop():void;peer(callbacks:{ice:(candidate:VoiceIce)=>void;connection:(state:string)=>void}):VoicePeer}
export interface VoicePlatform {available():boolean;acquire():Promise<VoiceMedia>;fixture?:boolean}
export interface VoiceState {phase:'off'|'starting'|'calling'|'incoming'|'connecting'|'connected'|'ended'|'error';muted:boolean;error:string|null}
export class VoiceController {
 state:VoiceState={phase:'off',muted:false,error:null};
 private listeners=new Set<(value:VoiceState)=>void>();private media:VoiceMedia|null=null;private pc:VoicePeer|null=null;
 private generation=0;private peerGeneration=0;private operation=0;private operating=false;private listening=false;
 private sessionId='';private remoteId:string|null=null;private call:VoiceCall|null=null;private consent:string|null=null;private dismissed:string|null=null;
 private remoteReady=false;private descriptionSent=false;private outgoingIce:VoiceIce[]=[];private incomingIce:VoiceIce[]=[];
 private cursor=0;private timer:ReturnType<typeof setInterval>|null=null;private connectingTimer:ReturnType<typeof setTimeout>|null=null;private pumping=false;
 private callLimitTimer:ReturnType<typeof setTimeout>|null=null;
 private sendQueue:Promise<unknown>=Promise.resolve();
 constructor(private epoch:string,private seat:'human'|'computer',private relay:(request:VoiceRequest)=>Promise<VoiceReply>,private platform:VoicePlatform,private id:()=>string){}
 subscribe(listener:(state:VoiceState)=>void){this.listeners.add(listener);listener(this.state);return()=>{this.listeners.delete(listener);};}
 private emit(patch:Partial<VoiceState>){this.state={...this.state,...patch};for(const listener of this.listeners)listener(this.state);}
 private request(message?:VoiceMessage){return this.relay({epoch:this.epoch,sessionId:this.sessionId,after:this.cursor,...(message?{message}:{})});}
 listen(){if(this.listening)return;this.listening=true;if(!this.sessionId)this.sessionId=this.id();this.timer=setInterval(()=>{void this.pump();},1500);void this.pump();}
 async suspend(){this.listening=false;if(this.timer)clearInterval(this.timer);this.timer=null;await this.stop();}
 private release(){if(this.callLimitTimer)clearTimeout(this.callLimitTimer);this.callLimitTimer=null;this.generation++;this.peerGeneration++;if(this.connectingTimer)clearTimeout(this.connectingTimer);this.connectingTimer=null;this.pc?.close();this.pc=null;this.media?.stop();this.media=null;this.remoteId=null;this.remoteReady=false;this.descriptionSent=false;this.outgoingIce=[];this.incomingIce=[];}
 async start(){
  if(!['off','error','ended'].includes(this.state.phase))return;
  if(!this.sessionId)this.sessionId=this.id();
  const operation=++this.operation;this.operating=true;this.emit({phase:'starting',muted:false,error:null});
  const callId=this.id();this.consent=callId;this.dismissed=null;
  try{
   if(!this.platform.available())throw Error('voice_unavailable');
   const media=await this.platform.acquire();if(operation!==this.operation){media.stop();return;}
   this.media=media;media.mute(true); // no transmission until the receiver accepts
   const reply=await this.request({type:'call',callId});if(operation!==this.operation){try{await this.request({type:'cancel',callId});}catch{}return;}
   await this.apply(reply);
  }catch(error){if(operation===this.operation){this.fail(error);try{await this.request({type:'cancel',callId});}catch{}}}finally{if(operation===this.operation)this.operating=false;}
 }
 async accept(){
  const call=this.call;if(this.state.phase!=='incoming'||!call)return;
  const operation=++this.operation;this.operating=true;this.consent=call.id;this.emit({phase:'starting',muted:false,error:null});
  try{
   if(!this.platform.available())throw Error('voice_unavailable');
   const media=await this.platform.acquire();if(operation!==this.operation){media.stop();return;}
   this.media=media;const reply=await this.request({type:'accept',callId:call.id});if(operation!==this.operation)return;await this.apply(reply);
  }catch(error){if(operation===this.operation)this.fail(error);}finally{if(operation===this.operation)this.operating=false;}
 }
 async reject(){const call=this.call;if(!call||this.state.phase!=='incoming')return;this.dismissed=call.id;await this.stop('reject');}
 toggleMute(){if(!this.media||!['connecting','connected'].includes(this.state.phase))return;const muted=!this.state.muted;this.media.mute(muted);this.emit({muted});}
 async stop(type:'leave'|'reject'='leave'){
  const call=this.call,sessionId=this.sessionId,cursor=this.cursor;
  this.operation++;this.operating=false;this.release();this.call=null;this.consent=null;if(call)this.dismissed=call.id;
  this.emit({phase:'off',muted:false,error:null});
  if(call)try{await this.relay({epoch:this.epoch,sessionId,after:cursor,message:{type:type==='reject'?'reject':call.status==='ringing'&&call.caller===this.seat?'cancel':'leave',callId:call.id}});}catch{/* local capture stopped; server call/voice lease expires */}
 }
 private fail(error:unknown){const message=error instanceof Error?error.message:'voice_error';void this.stop();this.emit({phase:'error',error:message});}
 private send(message:VoiceMessage){const generation=this.generation,sessionId=this.sessionId;this.sendQueue=this.sendQueue.then(async()=>{if(generation!==this.generation)return;await this.relay({epoch:this.epoch,sessionId,after:this.cursor,message});});return this.sendQueue;}
 private async apply(reply:VoiceReply){
  const call=reply.call;
  if(!call){if(this.call){this.release();this.call=null;this.consent=null;this.emit({phase:'ended',error:'disconnected',muted:false});}return;}
  if(call.id===this.dismissed)return;
  if(call.status==='ended'){
   if(this.call?.id===call.id){this.release();this.call=null;this.consent=null;this.dismissed=call.id;this.emit({phase:'ended',error:call.reason,muted:false});}return;
  }
  if(call.status==='ringing'){
   if(call.caller===this.seat&&call.callerSession!==this.sessionId)return;
   this.call=call;
   if(call.caller!==this.seat){this.release();this.consent=null;this.emit({phase:'incoming',error:null,muted:false});}
   else this.emit({phase:'calling',error:null});
   return;
  }
  const ownSession=call.caller===this.seat?call.callerSession:call.calleeSession;
  if(ownSession!==this.sessionId||this.consent!==call.id||!this.media)return;
  if(!this.callLimitTimer)this.callLimitTimer=setTimeout(()=>{void this.stop();this.emit({phase:'ended',error:'duration_limit',muted:false});},300000);
  this.call=call;this.media.mute(this.state.muted);await this.setPeer(reply.peer);
  for(const event of reply.messages){if(event.id<=this.cursor)continue;await this.receive(event.message);this.cursor=event.id;}
 }
 private async setPeer(remoteId:string|null){
  if(remoteId===this.remoteId)return;
  if(!remoteId||!this.media||!this.call)throw Error('voice_peer_missing');
  this.peerGeneration++;const peerGeneration=this.peerGeneration,generation=this.generation;
  this.pc?.close();this.remoteId=remoteId;this.remoteReady=false;this.descriptionSent=false;this.outgoingIce=[];this.incomingIce=[];this.sendQueue=Promise.resolve();
  this.pc=this.media.peer({ice:candidate=>{
   if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;
   if(this.outgoingIce.length>=64){this.fail(Error('voice_capacity'));return;}
   this.outgoingIce.push(candidate);if(this.descriptionSent)void this.flushIce().catch(error=>{if(generation===this.generation)this.fail(error);});
  },connection:state=>{if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;if(state==='connected'){if(this.connectingTimer)clearTimeout(this.connectingTimer);this.connectingTimer=null;this.emit({phase:'connected'});}else if(state==='failed')this.fail(Error('voice_connection_failed'));}});
  this.emit({phase:'connecting'});this.connectingTimer=setTimeout(()=>{if(generation===this.generation)this.fail(Error('voice_connection_failed'));},20000);
  if(this.seat==='human'){
   const sdp=await this.pc.offer();if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;
   await this.send({type:'offer',callId:this.call.id,target:remoteId,sdp});this.descriptionSent=true;await this.flushIce();
  }
 }
 private async flushIce(){if(!this.descriptionSent||!this.call||!this.remoteId)return;while(this.outgoingIce.length){const candidate=this.outgoingIce.shift()!;await this.send({type:'ice',callId:this.call.id,target:this.remoteId,candidate});}}
 private async receive(message:VoiceMessage){
  const pc=this.pc,remoteId=this.remoteId,generation=this.generation,peerGeneration=this.peerGeneration;
  if(!pc||!remoteId||!this.call||!('target' in message)||message.target!==this.sessionId||message.callId!==this.call.id)return;
  if(message.type==='ice'){if(this.remoteReady)await pc.ice(message.candidate);else if(this.incomingIce.length<64)this.incomingIce.push(message.candidate);return;}
  if(message.type==='offer'&&this.seat==='computer'){
   if(this.remoteReady)return;await pc.remote('offer',message.sdp);if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;
   this.remoteReady=true;const sdp=await pc.answer();if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;
   await this.send({type:'answer',callId:this.call.id,target:remoteId,sdp});this.descriptionSent=true;await this.flushIce();
  }else if(message.type==='answer'&&this.seat==='human'){if(this.remoteReady)return;await pc.remote('answer',message.sdp);this.remoteReady=true;}
  if(generation!==this.generation||peerGeneration!==this.peerGeneration)return;
  if(this.remoteReady){for(const candidate of this.incomingIce)await pc.ice(candidate);this.incomingIce=[];}
 }
 async pump(){
  if(this.pumping||this.operating||!this.listening)return;this.pumping=true;const operation=this.operation;
  try{const reply=await this.request();if(operation!==this.operation||!this.listening)return;await this.apply(reply);}
  catch(error){if(operation===this.operation&&this.listening)this.fail(error);}finally{this.pumping=false;}
 }
}
