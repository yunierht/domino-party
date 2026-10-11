import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';import {createTurnReminders} from './turnReminder.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);return m.exports;};
test('retained Settings table is silent for two periods and resumes one fresh schedule across game changes',async()=>{
 let now=0,id=0,events=[],cancels=0;const jobs=new Map(),listeners=new Set();const pool=createTurnReminders({now:()=>now,set:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id;},clear:id=>jobs.delete(id)});
 class Value{setValue(){}stopAnimation(){}interpolate(v){return v;}}
 const boundary=load('./GameSettingsBoundary.tsx',{react:React,'react-native':{View:'View'}});
 const reminder=load('./useTurnReminder.ts',{react:React,'./GameSettingsBoundary':boundary,'react-native':{Animated:{Value,timing:()=>({}),sequence:()=>({start(){}})},AppState:{currentState:'active',addEventListener:(_e,fn)=>{listeners.add(fn);return{remove:()=>listeners.delete(fn)};}}},'../state/PrefsContext':{usePrefs:()=>({ready:true,sound:true,tileSound:true,vibration:true})},'../computer/DrinkGift':{useReducedMotion:()=>false},'./turnReminder':{turnReminders:pool},'./turnReminderFeedback':{turnReminderFeedback:o=>{assert.ok(o.current());events.push(now);return()=>cancels++;}}});
 let mounts=0;function Table({game}){reminder.useTurnReminder(game,true);React.useEffect(()=>{mounts++;},[]);return null;}let r;const render=(settings,game='blackjack')=>React.createElement(boundary.GameSettingsBoundary,{settings,settingsScreen:React.createElement('Settings')},React.createElement(Table,{key:game,game}));
 const tick=async ms=>{now+=ms;await act(()=>{for(const [key,j]of [...jobs])if(j.at<=now){jobs.delete(key);j.fn();}});};
 await act(()=>{r=create(render(false));});try{await tick(15000);assert.equal(events.length,1);await act(()=>r.update(render(true)));assert.equal(jobs.size,0);await tick(60000);assert.equal(events.length,1);await act(()=>r.update(render(false)));assert.equal(mounts,1);await tick(14999);assert.equal(events.length,1);await tick(1);assert.equal(events.length,2);
 for(const game of ['poker','domino','blackjack','poker']){await act(()=>r.update(render(false,game)));assert.equal(jobs.size,1);await tick(15000);assert.equal(events.at(-1),now);await act(()=>r.update(render(true,game)));assert.equal(jobs.size,0);await tick(60000);}
 assert.ok(cancels>0);
 }finally{await act(()=>r.unmount());}assert.equal(jobs.size,0);assert.equal(listeners.size,0);
});
