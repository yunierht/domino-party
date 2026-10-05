import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {create,act} from 'react-test-renderer';import {readFileSync} from 'node:fs';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('each Blackjack round schedules its initial cards after clear, including a paused betting screen',async()=>{
 const jobs=new Map();let serial=0;const oldSet=setTimeout,oldClear=clearTimeout;globalThis.setTimeout=(fn,ms)=>{jobs.set(++serial,{fn,ms});return serial;};globalThis.clearTimeout=id=>jobs.delete(id);
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./useBlackjackCardSound.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>({react:React,'../sound/sounds':{prepareCardAudio(){},playCardDeal:()=>()=>{}}})[id],m,m.exports);
 function Probe(p){m.exports.useBlackjackCardSound(p.g,true,p.paused);return null;}const g={player:[1,2],dealer:[3,4],phase:'player'};let r;
 try{await act(()=>{r=create(React.createElement(Probe,{g,paused:false}));});assert.equal(jobs.size,4);await act(()=>r.update(React.createElement(Probe,{g:null,paused:true})));assert.equal(jobs.size,0);await act(()=>r.update(React.createElement(Probe,{g:{...g},paused:false})));assert.equal(jobs.size,4,'new four-card round must not compare with the previous round');}finally{await act(()=>r.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
