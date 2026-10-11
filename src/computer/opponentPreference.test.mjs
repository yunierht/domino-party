import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import * as identity from '../online/avatarIdentity.ts';
const require=createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks){const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:id==='../online/avatarIdentity'?identity:id==='../online/avatarPhoto'?{isValidAvatarPhoto:()=>false}:id==='./dominoAvatars'?load('./dominoAvatars.ts',{'./opponents':load('./opponents.ts',{})}):id.endsWith('.png')?id:require(id),mod,mod.exports);return mod.exports;}
for(const saved of [null,'yoi','rafael','rigo','alex','retired']) test(`Yuni fallback respects saved opponent ${saved}`,async()=>{
 let resolve;const writes=[];
 const opponents=load('./opponents.ts',{});
 const mod=load('./ComputerGameContext.tsx',{
  './engine':{},'./DrinkGift':{useReducedMotion:()=>false},
  './drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},
  './opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'./opponents':opponents,
  '../storage/storage':{loadJSON:key=>key==='dominoes:computerOpponent'?new Promise(r=>{resolve=r;}):Promise.resolve(null),saveJSON:async(k,v)=>{if(k==='dominoes:computerOpponent')writes.push(v);}},
 });
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(async()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 assert.equal(value.opponentId,'yuni');
 await act(async()=>{resolve(saved);});
 assert.equal(value.opponentId,['yoi','rafael','rigo'].includes(saved)?saved:'yuni');
 await act(()=>value.setOpponentId('rigo'));
 assert.equal(value.opponentId,'rigo');
 assert.equal(writes.at(-1),'rigo');
 await act(()=>renderer.unmount());
});
test('late storage load cannot overwrite a new explicit opponent choice',async()=>{
 let resolve;const writes=[];const opponents=load('./opponents.ts',{});
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'./opponents':opponents,'../storage/storage':{loadJSON:key=>key==='dominoes:computerOpponent'?new Promise(r=>{resolve=r;}):Promise.resolve(null),saveJSON:async(k,v)=>{if(k==='dominoes:computerOpponent')writes.push(v);}}});
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(async()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 await act(()=>value.setOpponentId('yoi'));
 await act(async()=>resolve('rafael'));
 assert.equal(value.opponentId,'yoi');assert.equal(writes.at(-1),'yoi');
 await act(()=>renderer.unmount());
});

test('own avatar stays independent of the AI rival and survives a new local match',async()=>{
 const mod=load('./ComputerGameContext.tsx',{'./engine':{deal:(name,target)=>({playerName:name,target})},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'./opponents':load('./opponents.ts',{}),'../storage/storage':{loadJSON:async()=>null,saveJSON:async()=>{}}});
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(async()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 try{
  assert.equal(value.playerAvatarId,'yuni');
  await act(()=>value.setPlayerAvatarId('rafael'));
  await act(()=>value.setOpponentId('rigo'));
  assert.equal(value.playerAvatarId,'rafael');assert.equal(value.opponentId,'rigo');
  await act(()=>value.start('Andy',100));
  assert.equal(value.playerAvatarId,'rafael');assert.equal(value.opponentId,'rigo');assert.equal(value.game.playerName,'Andy');
 }finally{await act(()=>renderer.unmount());}
});

test('human victory creates no automatic drink; manual selection remains available',async()=>{
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{normalizeDrinkGift:g=>g},'./opponents':load('./opponents.ts',{}),'../storage/storage':{loadJSON:async()=>null,saveJSON:async()=>{}}});
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(async()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 await act(()=>value.setGame({result:{winner:'human',points:12,blocked:false}}));
 assert.equal(value.drinkGift,null);assert.equal(value.opponentDrink,null);
 assert.equal('deliveryGift' in value,false);assert.equal('victoryGift' in value,false);
 const manual={drinkId:'heineken',sequence:1};await act(()=>value.setDrinkGift(manual));assert.equal(value.drinkGift,manual);
 await act(()=>renderer.unmount());
});
