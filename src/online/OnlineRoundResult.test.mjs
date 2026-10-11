import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const deps={react:React,'react-native':{View:'View'},
  '../poker/PokerResultBanner':{PokerResultBanner:'ResultBanner'},
  '../components/ResultHoldButton':{ResultHoldButton:'HoldButton'}};
const m={exports:{}};
new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./OnlineRoundResult.tsx',import.meta.url),'utf8'),
  {compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);

const base={winnerName:'Andy',tie:false,matchComplete:false,enabled:true,es:true,roundKey:'room:epoch:1',holding:false};
test('winner celebrates; Hold pauses and release remains possible while a command is busy',async()=>{
 const calls=[];let r;const props={...base,onHold:()=>calls.push('hold'),onRelease:()=>calls.push('release')};
 await act(()=>{r=create(React.createElement(m.exports.OnlineRoundResult,props));});
 try{
  assert.deepEqual(r.root.findByType('ResultBanner').props.result,{title:'Andy ganó',detail:'',tone:'win'});
  const key=r.root.findByType('HoldButton').props.presentationKey;
  await act(()=>r.root.findByType('HoldButton').props.onHold());
  await act(()=>r.update(React.createElement(m.exports.OnlineRoundResult,{...props,enabled:false,holding:true,es:false})));
  assert.equal(r.root.findByType('ResultBanner').props.result.title,'Andy won');
  assert.equal(r.root.findByType('HoldButton').props.disabled,true);
  assert.equal(r.root.findByType('HoldButton').props.holding,true);
  assert.equal(r.root.findByType('HoldButton').props.presentationKey,key,'polls preserve the round identity');
  await act(()=>r.root.findByType('HoldButton').props.onHold());
  await act(()=>r.root.findByType('HoldButton').props.onRelease());
  assert.deepEqual(calls,['hold','release']);
  await act(()=>r.update(React.createElement(m.exports.OnlineRoundResult,{...props,roundKey:'room:epoch:2'})));
  assert.notEqual(r.root.findByType('HoldButton').props.presentationKey,key);
 }finally{await act(()=>r.unmount());}
});
test('a tie has no confetti; a completed match exposes no active Hold or next-round action',async()=>{
 let calls=0,r;const props={...base,tie:true,onHold:()=>calls++,onRelease:()=>{}};
 await act(()=>{r=create(React.createElement(m.exports.OnlineRoundResult,props));});
 try{
  assert.deepEqual(r.root.findByType('ResultBanner').props.result,{title:'Empate',detail:'',tone:'push'});
  assert.equal(r.root.findByType('HoldButton').props.visible,true);
  await act(()=>r.update(React.createElement(m.exports.OnlineRoundResult,{...props,tie:false,matchComplete:true})));
  assert.equal(r.root.findByType('ResultBanner').props.result.title,'Andy ganó la partida');
  assert.equal(r.root.findByType('HoldButton').props.visible,false);
  assert.equal(r.root.findByType('HoldButton').props.disabled,true);
  await act(()=>r.root.findByType('HoldButton').props.onHold());assert.equal(calls,0);
  assert.equal(r.root.findAllByType('Pressable').length,0);
 }finally{await act(()=>r.unmount());}
});
