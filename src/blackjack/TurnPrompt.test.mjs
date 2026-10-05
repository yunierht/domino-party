import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {create,act} from 'react-test-renderer';import {readFileSync} from 'node:fs';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('heartbeat runs only for human attention and cancels on automatic state, hidden view, reduced motion and unmount',async()=>{
 const loops=[],values=[];let reduce;const rn={Text:'Text',AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:(_event,fn)=>{reduce=fn;return{remove(){}};}},Animated:{View:'AnimatedView',Value:class{constructor(v){values.push(v);}setValue(v){values.push(v);}},timing:(_v,config)=>config,delay:ms=>({delay:ms}),sequence:jobs=>jobs,loop:jobs=>{const loop={jobs,start(){this.started=true;},stop(){this.stopped=true;}};loops.push(loop);return loop;}}};
 const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./TurnPrompt.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(id=>({react:React,'react-native':rn})[id],m,m.exports);const {TurnPrompt}=m.exports;let r;
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;const timers=new Map();let clock=0,id=0;
 globalThis.setTimeout=(fn,ms)=>{timers.set(++id,{fn,at:clock+ms});return id;};globalThis.clearTimeout=n=>timers.delete(n);
 const tick=async ms=>{clock+=ms;await act(()=>{for(const [key,job] of timers)if(job.at<=clock){timers.delete(key);job.fn();}});};
 const props={visible:true,label:'Dealer’s Turn',attention:false};
 try{
 await act(()=>{r=create(React.createElement(TurnPrompt,props));});assert.equal(loops.length,0);assert.equal(timers.size,0);
 const human={...props,label:'Your Turn',attention:true};await act(()=>r.update(React.createElement(TurnPrompt,human)));await tick(3599);assert.equal(loops.length,0);assert.equal(values.at(-1),1);
 await act(()=>r.update(React.createElement(TurnPrompt,human)));await tick(1);assert.equal(loops.length,1);assert.equal(loops[0].started,true);assert.equal(loops[0].jobs.filter(j=>j.toValue>1).length,1);assert.equal(loops[0].jobs.filter(j=>j.toValue).length,2);assert.equal(loops[0].jobs.reduce((sum,j)=>sum+(j.duration??j.delay??0),0),3600);
 await act(()=>r.update(React.createElement(TurnPrompt,{...props,label:'Dealing…'})));assert.equal(loops[0].stopped,true);assert.equal(values.at(-1),1);
 await act(()=>r.update(React.createElement(TurnPrompt,{...props,label:'Place Your Bet',attention:true})));await tick(1000);assert.equal(loops.length,1);
 await act(()=>r.update(React.createElement(TurnPrompt,{...props,label:'Press Deal',attention:true})));assert.equal(timers.size,1);await tick(2599);assert.equal(loops.length,1);await tick(1001);assert.equal(loops.length,2);
 await act(()=>r.update(React.createElement(TurnPrompt,{...props,attention:true,visible:false})));assert.equal(loops[1].stopped,true);assert.equal(r.toJSON(),null);assert.equal(timers.size,0);
 await act(()=>r.update(React.createElement(TurnPrompt,{...props,attention:true})));assert.equal(timers.size,1);await act(()=>reduce(true));assert.equal(timers.size,0);await tick(3600);assert.equal(loops.length,2);assert.equal(values.at(-1),1);
 await act(()=>reduce(false));assert.equal(timers.size,1);await act(()=>r.unmount());assert.equal(timers.size,0);await tick(3600);assert.equal(loops.length,2);
 }finally{await act(()=>r?.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});