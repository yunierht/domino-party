import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;

function fixture(){
 const animations=[],sounds=[],listeners=new Set();
 let state,tree;
 class Value{constructor(value){this.value=value;}setValue(value){this.value=value;}}
 const dependencies={
  react:React,
  'react-native':{
   AccessibilityInfo:{
    isReduceMotionEnabled:async()=>false,
    addEventListener(event,callback){assert.equal(event,'reduceMotionChanged');listeners.add(callback);return{remove(){listeners.delete(callback);}};},
   },
   Easing:{linear:0},
   Animated:{Value,timing(value,config){const animation={value,config,stopped:false,start(callback){this.callback=callback;},stop(){this.stopped=true;}};animations.push(animation);return animation;}},
  },
  '../sound/sounds':{playRoundDeal(){const sound={stopped:false};sounds.push(sound);return()=>{sound.stopped=true;};}},
 };
 const module={exports:{}};
 const compiled=ts.transpileModule(readFileSync(new URL('./useOnlineDeal.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',compiled)(id=>{if(!(id in dependencies))throw Error(`Unexpected dependency: ${id}`);return dependencies[id];},module,module.exports);
 function Host({round=1,fresh=true,ready=true,sound=true}){state=module.exports.useOnlineDeal(round,fresh,ready,sound);return null;}
 return{
  animations,sounds,listeners,get state(){return state;},
  async mount(props={}){await act(async()=>{tree=create(React.createElement(Host,props));});},
  async update(props){await act(()=>tree.update(React.createElement(Host,props)));},
  async motion(reduced){await act(()=>{for(const listener of listeners)listener(reduced);});},
  async complete(index,finished=true){await act(()=>animations[index].callback({finished}));},
  async unmount(){await act(()=>tree.unmount());},
 };
}

test('online deal follows live reduced-motion changes across rounds without replaying a completed deal',async()=>{
 const f=fixture();await f.mount();
 try{
  assert.equal(f.state.dealing,true);assert.equal(f.animations.length,1);
  await f.complete(0);assert.equal(f.state.dealing,false);
  await f.motion(true);await f.update({round:2});
  assert.equal(f.state.dealing,false);assert.equal(f.state.progress.value,1);
  assert.equal(f.animations.length,1);assert.equal(f.sounds.length,1);
  await f.motion(false);assert.equal(f.animations.length,1);
  await f.update({round:3});assert.equal(f.state.dealing,true);assert.equal(f.animations.length,2);
  await f.complete(1);assert.equal(f.state.dealing,false);
 }finally{await f.unmount();}
 assert.equal(f.listeners.size,0);
});

test('interrupted online deal stops audio and ignores its late completion before resuming',async()=>{
 const f=fixture();await f.mount();
 try{
  await f.update({round:1,ready:false});
  assert.equal(f.animations[0].stopped,true);assert.equal(f.sounds[0].stopped,true);
  await f.complete(0);assert.equal(f.state.dealing,true);
  await f.update({round:1,ready:true});assert.equal(f.animations.length,2);
  await f.complete(1);assert.equal(f.state.dealing,false);
  await f.update({round:2});assert.equal(f.state.dealing,true);
 }finally{await f.unmount();}
 assert.equal(f.animations.at(-1).stopped,true);assert.equal(f.sounds.at(-1).stopped,true);
 assert.equal(f.listeners.size,0);
});

test('a remote opening releases the deal gate and reduced motion interrupts a new deal safely',async()=>{
 const f=fixture();await f.mount();
 try{
  await f.update({round:1,fresh:false});
  assert.equal(f.state.dealing,false);assert.equal(f.animations[0].stopped,true);
  await f.complete(0);assert.equal(f.state.dealing,false);
  await f.update({round:2});assert.equal(f.state.dealing,true);
  await f.motion(true);
  assert.equal(f.animations[1].stopped,true);assert.equal(f.sounds[1].stopped,true);
  assert.equal(f.state.dealing,false);assert.equal(f.state.progress.value,1);
  await f.complete(1);assert.equal(f.state.dealing,false);
 }finally{await f.unmount();}
});
