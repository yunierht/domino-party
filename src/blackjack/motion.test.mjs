import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {create,act} from 'react-test-renderer';import {readFileSync} from 'node:fs';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('chip sounds stop on pause or mute and do not replay the same flight',async()=>{
 let plays=0,stops=0;const {useChipSound}=load('./useChipSound.ts',{react:React,'./chipSound':{playChipMove(){plays++;return()=>stops++;}}});
 function Probe(p){useChipSound(p.id,'bet',p.enabled,p.paused);return null;}let r;
 await act(()=>{r=create(React.createElement(Probe,{id:1,enabled:true,paused:false}));});assert.equal(plays,1);
 await act(()=>r.update(React.createElement(Probe,{id:1,enabled:true,paused:true})));assert.equal(stops,1);
 await act(()=>r.update(React.createElement(Probe,{id:1,enabled:true,paused:false})));assert.equal(plays,1);
 await act(()=>r.update(React.createElement(Probe,{id:2,enabled:false,paused:false})));assert.equal(plays,1);
 await act(()=>r.update(React.createElement(Probe,{id:2,enabled:true,paused:false})));assert.equal(plays,1);await act(()=>r.unmount());
});
function load(file,deps){const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(id=>{if(!(id in deps))throw Error(id);return deps[id];},m,m.exports);return m.exports;}
function animation(reduced){const jobs=[];let progress;const rn={Text:'Text',View:'View',Pressable:'Pressable',AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced},Easing:{cubic:x=>x,out:x=>x},Animated:{View:'AnimatedView',Value:class{interpolate(){return 0;}setValue(){}addListener(fn){progress=fn;return 1;}removeListener(){progress=null;}},timing(_v,config){const job={config,start(fn){job.finish=fn;},stop(){job.stopped=true;}};jobs.push(job);return job;}}};return {rn,jobs,progress(p){progress?.({value:p});}};}
test('chip flight finishes once, reports progress and cancellation suppresses late completion',async()=>{
 const h=animation(false);const {ChipFlight}=load('./ChipFlight.tsx',{react:React,'react-native':h.rn,'../poker/CasinoChip':{ChipStack:'ChipStack'},'./BettingTray':{DenominationChip:'DenominationChip'},'./useChipSound':{useChipSound(){}}});let completed=0,progress=0;let r;const flight={id:1,amount:50,kind:'win',from:{x:100,y:500},to:{x:30,y:60}};
 await act(()=>{r=create(React.createElement(ChipFlight,{flight,paused:false,onComplete:()=>completed++,onProgress:p=>progress=p}));});assert.equal(h.jobs.length,1);await act(()=>h.progress(.5));assert.equal(progress,.5);
 await act(()=>r.update(React.createElement(ChipFlight,{flight,paused:true,onComplete:()=>completed++})));assert.equal(h.jobs[0].stopped,true);await act(()=>h.jobs[0].finish({finished:true}));assert.equal(completed,0);
 await act(()=>r.update(React.createElement(ChipFlight,{flight,paused:false,onComplete:()=>completed++})));await act(()=>h.jobs[1].finish({finished:true}));assert.equal(completed,1);await act(()=>r.unmount());
});
test('reduced motion finishes without animation and paused flight waits',async()=>{
 const h=animation(true);const {ChipFlight}=load('./ChipFlight.tsx',{react:React,'react-native':h.rn,'../poker/CasinoChip':{ChipStack:'ChipStack'},'./BettingTray':{DenominationChip:'DenominationChip'},'./useChipSound':{useChipSound(){}}});let completed=0;let r;const flight={id:1,amount:10,kind:'bet',from:{x:10,y:500},to:{x:100,y:300}};
 await act(()=>{r=create(React.createElement(ChipFlight,{flight,paused:true,onComplete:()=>completed++}));});assert.equal(completed,0);await act(()=>r.update(React.createElement(ChipFlight,{flight,paused:false,onComplete:()=>completed++})));assert.equal(completed,1);assert.equal(h.jobs.length,0);await act(()=>r.unmount());
});
test('floating actions enter, remain mounted disabled, and hidden exit cannot activate',async()=>{
 const h=animation(false);const {FloatingAction}=load('./FloatingAction.tsx',{react:React,'react-native':h.rn});let called=0,r;const props={id:'test',label:'DEAL',side:'right',bottom:100,onPress:()=>called++};await act(()=>{r=create(React.createElement(FloatingAction,{...props,visible:true,enabled:false}));});assert.equal(h.jobs.length,1);assert.equal(r.root.findByType('Pressable').props.disabled,true);await act(()=>r.root.findByType('Pressable').props.onPress());assert.equal(called,0);await act(()=>r.update(React.createElement(FloatingAction,{...props,visible:false,enabled:true})));await act(()=>r.root.findByType('Pressable').props.onPress());assert.equal(called,0);await act(()=>h.jobs[1].finish({finished:true}));assert.equal(r.toJSON(),null);await act(()=>r.unmount());
});
test('card sound schedules one excerpt per new card; mute and pause cancel',async()=>{
 let played=0,stopped=0;const timers=new Map();let next=0;const oldSet=setTimeout,oldClear=clearTimeout;globalThis.setTimeout=fn=>{timers.set(++next,fn);return next;};globalThis.clearTimeout=id=>timers.delete(id);
 const {useBlackjackCardSound}=load('./useBlackjackCardSound.ts',{react:React,'../sound/sounds':{playCardDeal(){played++;return()=>stopped++;}}});function Probe({g,enabled=true,paused=false}){useBlackjackCardSound(g,enabled,paused);return null;}let r;const g={player:[1,2],dealer:[3,4],phase:'player'};
 try{await act(()=>{r=create(React.createElement(Probe,{g}));});assert.equal(timers.size,4);await act(()=>{[...timers.values()].forEach(fn=>fn());timers.clear();});assert.equal(played,4);const nextG={...g,player:[1,2,5]};await act(()=>r.update(React.createElement(Probe,{g:nextG})));assert.equal(stopped,4);assert.equal(timers.size,1);await act(()=>r.update(React.createElement(Probe,{g:nextG,paused:true})));assert.equal(timers.size,0);await act(()=>r.update(React.createElement(Probe,{g:{...nextG,player:[1,2,5,6]},enabled:false})));assert.equal(timers.size,0);assert.equal(played,4);}finally{await act(()=>r.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
