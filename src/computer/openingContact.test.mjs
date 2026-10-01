import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(path,deps={}) {const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(id=>deps[id],m,m.exports);return m.exports;}
const engine=load('./engine.ts');
function harness(){
 const animations=[],contacts=[];let prefs={ready:true,tileSound:true,vibration:false};let preparation;
 class Value{interpolate(c){return c;}}
 const timing=()=>{const a={start(cb){this.cb=cb;},stop(){}};animations.push(a);return a;};
 const deps={react:React,'react-native':{View:'View',Text:'Text',Pressable:'Pressable',Easing:{linear:0,cubic:1,out:x=>x,in:x=>x},Animated:{View:'AnimatedView',Value,timing,sequence:timing}},'expo-haptics':{},'./DominoTile':{DominoTile:()=>null},'./boardLayout':{chainSlot:()=>({x:0,y:0,scale:1}),endpointOffsets:()=>({left:0,right:1})},'./tableTheme':{TABLE:{}},'./TileCelebration':{TileCelebration:()=>null},'../state/PrefsContext':{usePrefs:()=>prefs},'../sound/sounds':{playTileContact:()=>contacts.push('contact'),prepareTileContact:()=>preparation},'./DrinkGift':{useReducedMotion:()=>false}};
 const {AnchoredBoard}=load('./AnchoredBoard.tsx',deps);
 const element=g=>React.createElement(AnchoredBoard,{key:g.round,board:g.board,openingId:g.openingId,arrivingId:g.last?.tile?.id,metrics:{},available:[],onEnd(){}});
 return {animations,contacts,element,setPrefs:p=>prefs=p,setPreparation:p=>preparation=p};
}
for(const actor of ['human','computer'])for(const enabled of [true,false])test(`opening, following move, next hand and restore: ${actor}, sound=${enabled}`,async()=>{
 const h=harness();h.setPrefs({ready:true,tileSound:enabled});
 let g={...engine.deal('You',100,()=>.5),openingRule:'winner',turn:actor,hands:{human:[{id:'6-6',a:6,b:6},{id:'5-6',a:5,b:6},{id:'4-6',a:4,b:6}],computer:[{id:'3-6',a:3,b:6},{id:'2-6',a:2,b:6},{id:'1-6',a:1,b:6}]}};
 let r;await act(()=>{r=create(h.element(g));});
 const move=async(player)=>{const index=h.animations.length;g=player==='computer'?engine.computerStep(g):engine.play(g,player,g.hands[player].find(t=>engine.legalEnds(g,player,t).length).id,'right');await act(()=>r.update(h.element(g)));assert.equal(h.contacts.length,enabled?g.board.length-1:0);await act(()=>h.animations[index].cb({finished:true}));await act(()=>r.update(h.element(g)));};
 await move(actor);assert.equal(h.contacts.length,enabled?1:0);
 await move(engine.other(actor));assert.equal(h.contacts.length,enabled?2:0);
 await act(()=>r.unmount());let index=h.animations.length;await act(()=>{r=create(h.element(g));});for(const a of h.animations.slice(index))if(a.cb)await act(()=>a.cb({finished:true}));assert.equal(h.contacts.length,enabled?2:0,'restoration is silent');
 g={...g,round:2,board:[],openingId:null,last:null,turn:actor};await act(()=>r.update(h.element(g)));index=h.animations.length;g=engine.play(g,actor,g.hands[actor][0].id,'right');await act(()=>r.update(h.element(g)));await act(()=>h.animations[index].cb({finished:true}));assert.equal(h.contacts.length,enabled?3:0);await act(()=>r.unmount());
});
for(const enabled of [true,false])test(`cold preference load waits before opening landing, saved sound=${enabled}`,async()=>{
 const h=harness();h.setPrefs({ready:false,tileSound:false});let g={...engine.deal('You',100,()=>.5),openingRule:'winner',turn:'human'};let r;await act(()=>{r=create(h.element(g));});g=engine.play(g,'human',g.hands.human[0].id,'right');await act(()=>r.update(h.element(g)));assert.equal(h.animations.length,0);assert.equal(h.contacts.length,0);h.setPrefs({ready:true,tileSound:enabled});await act(()=>r.update(h.element(g)));assert.equal(h.contacts.length,0);await act(()=>h.animations[0].cb({finished:true}));assert.equal(h.contacts.length,enabled?1:0);h.setPrefs({ready:true,tileSound:!enabled});await act(()=>r.update(h.element(g)));await act(()=>h.animations[0].cb({finished:true}));assert.equal(h.contacts.length,enabled?1:0,'no late toggle or duplicate callback replay');await act(()=>r.unmount());
});
for(const cancelled of [false,true])test(`opening waits for silent preparation; cancelled=${cancelled}`,async()=>{
 const h=harness();let release;h.setPreparation(new Promise(r=>release=r));let g={...engine.deal('You',100,()=>.5),openingRule:'winner',turn:'human'};let r;await act(()=>{r=create(h.element(g));});g=engine.play(g,'human',g.hands.human[0].id,'right');await act(()=>r.update(h.element(g)));assert.equal(h.animations[0].cb,undefined,'landing must not precede preparation');assert.equal(h.contacts.length,0);
 if(cancelled)await act(()=>r.unmount());await act(()=>release());if(cancelled){assert.equal(h.animations[0].cb,undefined);assert.equal(h.contacts.length,0);}else{await act(()=>h.animations[0].cb({finished:true}));assert.equal(h.contacts.length,1);await act(()=>h.animations[0].cb({finished:true}));assert.equal(h.contacts.length,1);await act(()=>r.unmount());}
});
