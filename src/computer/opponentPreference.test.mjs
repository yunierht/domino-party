import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
const require=createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks){const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:id.endsWith('.png')?id:require(id),mod,mod.exports);return mod.exports;}
for(const saved of [null,'yoi','rafael','rigo','alex','retired']) test(`Yuni fallback respects saved opponent ${saved}`,async()=>{
 let resolve;const writes=[];
 const opponents=load('./opponents.ts',{});
 const mod=load('./ComputerGameContext.tsx',{
  './engine':{},'./DrinkGift':{useReducedMotion:()=>false},
  './drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},
  './opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'./opponents':opponents,
  '../storage/storage':{loadJSON:()=>new Promise(r=>{resolve=r;}),saveJSON:async(k,v)=>writes.push(v)},
 });
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
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
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'./opponents':opponents,'../storage/storage':{loadJSON:()=>new Promise(r=>{resolve=r;}),saveJSON:async(k,v)=>writes.push(v)}});
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 await act(()=>value.setOpponentId('yoi'));
 await act(async()=>resolve('rafael'));
 assert.equal(value.opponentId,'yoi');assert.equal(writes.at(-1),'yoi');
 await act(()=>renderer.unmount());
});

test('human victory creates no automatic drink; manual selection remains available',async()=>{
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{normalizeDrinkGift:g=>g},'./opponents':load('./opponents.ts',{}),'../storage/storage':{loadJSON:async()=>null,saveJSON:async()=>{}}});
 let value;function Probe(){value=mod.useComputerGame();return null;}let renderer;
 await act(()=>{renderer=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 await act(()=>value.setGame({result:{winner:'human',points:12,blocked:false}}));
 assert.equal(value.drinkGift,null);assert.equal(value.opponentDrink,null);
 assert.equal('deliveryGift' in value,false);assert.equal('victoryGift' in value,false);
 const manual={drinkId:'heineken',sequence:1};await act(()=>value.setDrinkGift(manual));assert.equal(value.drinkGift,manual);
 await act(()=>renderer.unmount());
});
