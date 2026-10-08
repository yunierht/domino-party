import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('tracking back chain is Game to Setup to Home, including native Back and no scoring dependencies',async()=>{
 let current,nativeBack,r;const m={exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./NavContext.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>id==='react'?React:id==='react-native'?{BackHandler:{addEventListener:(_,cb)=>{nativeBack=cb;return {remove(){}};}}}:undefined,m,m.exports);
 function Probe(){current=m.exports.useNav();return React.createElement('Screen',{screen:current.screen});}
 await act(()=>{r=create(React.createElement(m.exports.NavProvider,null,React.createElement(Probe)));});
 try{
  await act(()=>current.go('game'));assert.equal(current.screen,'game');await act(()=>current.openSetup());assert.equal(current.screen,'newMatch');assert.equal(current.setupMode,'edit');await act(()=>current.goHome());assert.equal(current.screen,'home');
  await act(()=>current.go('game'));await act(()=>{assert.equal(nativeBack(),true);});assert.equal(current.screen,'newMatch');await act(()=>{assert.equal(nativeBack(),true);});assert.equal(current.screen,'home');
  await act(()=>current.go('settings'));assert.equal(nativeBack(),false);
  await act(()=>current.openSetup());await act(()=>current.back());await act(()=>current.go('game'));assert.equal(current.screen,'game');await act(()=>current.goHome());assert.equal(current.screen,'home');
  await act(()=>current.go('newMatch'));assert.equal(current.setupMode,'new');await act(()=>current.openSetup());assert.equal(current.setupMode,'edit');await act(()=>current.openSetup('new'));assert.equal(current.setupMode,'new');
 }finally{await act(()=>r.unmount());}
});
