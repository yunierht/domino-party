import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
import {updateVoiceCall,expireVoiceCall} from '../../backend/domino-online/src/voiceCall.ts';
const m={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(new URL('./voiceController.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);const {VoiceController}=m.exports;
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function pair(){
 let call=null,now=1000,next=0;const events=[],queue=[];
 const sides=['human','computer'].map(seat=>{
  const counts={acquired:0,stopped:0,closed:0,muted:false},callbacks=[];let acquireOverride=null;
  const media={mute:value=>{counts.muted=value;},stop:()=>counts.stopped++,peer:cb=>{callbacks.push(cb);return{offer:async()=> 'offer',answer:async()=> 'answer',remote:async(type,sdp)=>events.push([seat,type,sdp]),ice:async()=>{},close:()=>counts.closed++};}};
  const relay=async req=>{
   call=expireVoiceCall(call,now);const message=req.message;
   if(message&&!('target' in message))call=updateVoiceCall(call,{seat,sessionId:req.sessionId},message,now);
   else if(message)queue.push({id:++next,message});
   const peer=call?.status==='accepted'?(seat===call.caller?call.calleeSession:call.callerSession):null;
   return {call,peer,messages:queue.filter(e=>e.id>req.after&&e.message.target===req.sessionId)};
  };
  let id=0;const controller=new VoiceController('e',seat,relay,{available:()=>true,acquire:async()=>{counts.acquired++;return acquireOverride?await acquireOverride():media;}},()=>`${seat==='human'?'1':'2'}2345678-1234-1234-1234-${String(++id).padStart(12,'0')}`);
  return{controller,counts,callbacks,media,acquire:fn=>{acquireOverride=fn;}};
 });
 return{a:sides[0],b:sides[1],events,expire:()=>{now=31000;},close:async()=>{await Promise.all(sides.map(s=>s.controller.suspend()));}};
}
test('passive invitation never captures receiver media; explicit acceptance enables continuous voice and mute',async()=>{
 const p=pair();p.a.controller.listen();p.b.controller.listen();await settle();
 try{
  assert.equal(p.b.counts.acquired,0);await p.a.controller.start();assert.equal(p.a.controller.state.phase,'calling');assert.equal(p.a.counts.muted,true);
  await p.b.controller.pump();assert.equal(p.b.controller.state.phase,'incoming');assert.equal(p.b.counts.acquired,0);
  await p.b.controller.accept();assert.equal(p.b.counts.acquired,1);await p.a.controller.pump();await p.b.controller.pump();await p.a.controller.pump();
  assert.deepEqual(p.events,[['computer','offer','offer'],['human','answer','answer']]);
  p.a.callbacks[0].connection('connected');p.b.callbacks[0].connection('connected');assert.equal(p.a.controller.state.phase,'connected');
  p.a.controller.toggleMute();assert.equal(p.a.counts.muted,true);p.a.controller.toggleMute();assert.equal(p.a.counts.muted,false);
  await p.a.controller.stop();await p.b.controller.pump();assert.equal(p.b.counts.stopped,1);assert.equal(p.b.controller.state.phase,'ended');
 }finally{await p.close();}
});
test('reject, cancel and expiration dismiss invitations without activating receiver microphone',async()=>{
 for(const action of ['reject','cancel','expire']){const p=pair();p.a.controller.listen();p.b.controller.listen();await settle();try{
  await p.a.controller.start();await p.b.controller.pump();
  if(action==='reject')await p.b.controller.reject();else if(action==='cancel')await p.a.controller.stop();else p.expire();
  await p.a.controller.pump();await p.b.controller.pump();assert.equal(p.b.counts.acquired,0);assert.equal(p.a.counts.stopped,1);assert.notEqual(p.b.controller.state.phase,'incoming');
 }finally{await p.close();}}
});
test('simultaneous calls require explicit acceptance and release losing caller media',async()=>{
 const p=pair();p.a.controller.listen();p.b.controller.listen();await settle();try{
  await Promise.all([p.a.controller.start(),p.b.controller.start()]);assert.equal(p.a.controller.state.phase,'calling');assert.equal(p.b.controller.state.phase,'incoming');assert.equal(p.b.counts.stopped,1);
  assert.equal(p.b.callbacks.length,0);await p.b.controller.accept();await p.a.controller.pump();assert.equal(p.a.controller.state.phase,'connecting');
 }finally{await p.close();}
});
test('late acquisition after cancellation stops its stream, and denied acceptance never connects',async()=>{
 const p=pair();let resolve;p.a.acquire(()=>new Promise(r=>{resolve=r;}));const pending=p.a.controller.start();await p.a.controller.stop();resolve(p.a.media);await pending;assert.equal(p.a.counts.stopped,1);assert.equal(p.a.controller.state.phase,'off');await p.close();
 const q=pair();q.a.controller.listen();q.b.controller.listen();await settle();try{
  await q.a.controller.start();await q.b.controller.pump();q.b.acquire(async()=>{throw Error('microphone_denied');});await q.b.controller.accept();assert.equal(q.b.controller.state.phase,'error');assert.equal(q.b.callbacks.length,0);await q.a.controller.pump();assert.equal(q.a.counts.stopped,1);
 }finally{await q.close();}
});
test('cancelling a call with a delayed acknowledgement also cancels the server invitation',async()=>{
 let resolve;const requests=[],uuid='12345678-1234-1234-1234-123456789abc';
 const media={mute(){},stop(){},peer(){throw Error('no accepted call');}};
 const controller=new VoiceController('e','human',async req=>{requests.push(req);return req.message?.type==='call'?await new Promise(r=>{resolve=r;}):{peer:null,messages:[],call:null};},{available:()=>true,acquire:async()=>media},()=>uuid);
 const pending=controller.start();await settle();await controller.stop();resolve({peer:null,messages:[],call:{id:uuid,caller:'human',callerSession:uuid,calleeSession:null,status:'ringing',expiresAt:30000,reason:null}});await pending;
 assert.equal(requests.at(-1).message.type,'cancel');assert.equal(controller.state.phase,'off');
});
test('an accepted call that never connects releases capture after twenty seconds',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const p=pair();p.a.controller.listen();p.b.controller.listen();await settle();try{
  await p.a.controller.start();await p.b.controller.pump();await p.b.controller.accept();await p.a.controller.pump();
  t.mock.timers.tick(20000);assert.equal(p.a.counts.stopped,1);assert.equal(p.b.counts.stopped,1);assert.equal(p.a.controller.state.error,'voice_connection_failed');
 }finally{await p.close();t.mock.timers.reset();}
});

test('local five-minute cap releases microphone and peer even when signaling becomes unreachable',async t=>{t.mock.timers.enable({apis:['setTimeout']});const p=pair();p.a.controller.listen();p.b.controller.listen();await settle();try{await p.a.controller.start();await p.b.controller.pump();await p.b.controller.accept();await p.a.controller.pump();await p.b.controller.pump();await p.a.controller.pump();p.a.callbacks[0].connection('connected');p.b.callbacks[0].connection('connected');t.mock.timers.tick(299999);assert.equal(p.a.counts.stopped,0);t.mock.timers.tick(1);await settle();assert.equal(p.a.counts.stopped,1);assert.equal(p.a.counts.closed,1);assert.equal(p.a.controller.state.phase,'ended');assert.equal(p.a.controller.state.error,'duration_limit');}finally{await p.close();t.mock.timers.reset();}});

test('unsupported native runtime reports voice_unavailable without capturing or creating a ringing call',async()=>{let captures=0;const requests=[];const controller=new VoiceController('new-table-epoch','computer',async req=>{requests.push(req);return {call:null,peer:null,messages:[]}}, {available:()=>false,acquire:async()=>{captures++;throw Error('must_not_capture')}},()=> '12345678-1234-1234-1234-123456789abc');await controller.start();assert.equal(controller.state.phase,'error');assert.equal(controller.state.error,'voice_unavailable');assert.equal(captures,0);assert.ok(requests.every(r=>r.message?.type!=='call'));await controller.suspend();});
