import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {create,act} from 'react-test-renderer';import {readFileSync} from 'node:fs';import ts from 'typescript';import * as rebuy from './rebuy.ts';import {newHand} from './engine.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./usePokerResultTransition.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>id==='react'?React:rebuy,m,m.exports);
test('2 visible seconds plus collected pot advances once, preserves stacks, pauses and cancels on exit; bankruptcy never invents credit',async()=>{
 const oldSet=setTimeout,oldClear=clearTimeout;let now=0,id=0,r,visible,nexts=[];const jobs=new Map();globalThis.setTimeout=(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id;};globalThis.clearTimeout=id=>jobs.delete(id);
 const base=newHand(undefined,()=>.3);const game={...base,hand:4,street:'complete',stacks:{human:800,computer:1200},result:{winner:'human',reason:'fold',pot:40}};
 function Probe({g=game,paused=false,collected=true}){visible=m.exports.usePokerResultTransition(g,paused,collected,n=>nexts.push(n));return null;}
 const render=async props=>act(()=>r?r.update(React.createElement(Probe,props)):r=create(React.createElement(Probe,props)));
 const tick=async ms=>{now+=ms;await act(()=>{for(const [key,j] of jobs)if(j.at<=now){jobs.delete(key);j.fn();}});};
 try{
  await render({collected:false});assert.equal(visible,true);await tick(1999);assert.equal(nexts.length,0);await tick(1);assert.equal(visible,false);assert.equal(nexts.length,0,'wait for chip flight');
  await render({});assert.equal(nexts.length,1);assert.equal(nexts[0].hand,5);assert.equal(nexts[0].stacks.human+nexts[0].bets.human,800);assert.equal(nexts[0].stacks.computer+nexts[0].bets.computer,1200);await render({});await tick(5000);assert.equal(nexts.length,1);
  const nextGame={...game,hand:5};await render({g:nextGame});await tick(1000);await render({g:nextGame,paused:true});await tick(5000);assert.equal(nexts.length,1);await render({g:nextGame});await tick(1999);assert.equal(nexts.length,1);await tick(1);assert.equal(nexts.length,2);
  const bankrupt={...game,hand:6,stacks:{human:0,computer:2000}};await render({g:bankrupt});await tick(2000);assert.equal(visible,false);assert.equal(nexts.length,2);assert.equal(bankrupt.stacks.human,0);
  await render({g:{...game,hand:7}});await act(()=>r.unmount());r=null;await tick(2000);assert.equal(nexts.length,2);assert.equal(jobs.size,0);
  await render({});assert.equal(visible,true);await tick(2000);assert.equal(nexts.length,3,'return presents result before one continuation');
 }finally{if(r)await act(()=>r.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
