import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function setup(clock){
 let now=987654321,id=0,visible=true;const timers=new Map(),actions=[],reminders=[],listeners=new Set();
 const deps={'../components/GameSettingsBoundary':{useTableVisible:()=>visible},'../components/GoldPressable':{GoldPressable:'Pressable'},'../components/useExpiredTurnPulse':{useExpiredTurnPulse:active=>{reminders.push({active});return{};}},react:React,'react-native':{AppState:{currentState:'active',addEventListener:(_event,fn)=>{listeners.add(fn);return{remove:()=>listeners.delete(fn)};}},Animated:{View:'View'},Image:'Image',View:'View',Text:'Text',Pressable:'Pressable'},'react-native-svg':{__esModule:true,default:'Svg',Circle:'Circle'},'@expo/vector-icons':{Feather:'Feather'},'../computer/tableTheme':{TABLE:{gold:'#D8B978',ivory:'#F5F0E4',line:'#555'}}};
 const module={exports:{}};
 new Function('require','module','exports','performance','setInterval','clearInterval',ts.transpileModule(readFileSync(new URL('./OnlineTurnTimer.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(name=>{if(!(name in deps))throw Error(name);return deps[name];},module,module.exports,{now:()=>now},callback=>{timers.set(++id,callback);return id;},key=>timers.delete(key));
 let renderer;const props={clock,enabled:true,es:true,onPause:()=>actions.push('pause'),onResume:()=>actions.push('resume')};
 await act(()=>{renderer=create(React.createElement(module.exports.OnlineTurnTimer,props));});
 return{renderer,actions,timers,reminders,async app(value){await act(()=>listeners.forEach(fn=>fn(value)));},async visibility(value){visible=value;await act(()=>renderer.update(React.createElement(module.exports.OnlineTurnTimer,props)));},async advance(ms){now+=ms;await act(()=>{for(const timer of [...timers.values()])timer();});},async update(patch){Object.assign(props,patch);await act(()=>renderer.update(React.createElement(module.exports.OnlineTurnTimer,props)));},seconds(){return renderer.root.findByProps({testID:'online-turn-seconds'}).props.children;},async close(){await act(()=>renderer.unmount());}};
}
const active={durationMs:30000,remainingMs:30000,deadline:1030000,serverNow:1000000,paused:false};
test('the ring counts from snapshot receipt on a monotonic clock and expiry never advances the turn',async()=>{
 const h=await setup(active);try{
  assert.equal(h.seconds(),30);assert.equal(h.timers.size,1);const full=h.renderer.root.findByProps({testID:'online-turn-progress'}).props;
  assert.equal(full.strokeDashoffset,0);await h.advance(15000);assert.equal(h.seconds(),15);
  const half=h.renderer.root.findByProps({testID:'online-turn-progress'}).props;assert.ok(Math.abs(half.strokeDashoffset-half.strokeDasharray/2)<.001);
  await h.advance(30000);assert.equal(h.seconds(),0);assert.deepEqual(h.actions,[]);assert.equal(h.timers.size,0);
 }finally{await h.close();}
});
test('paused snapshots freeze the display, resume uses server remaining time and only enabled controls send intent',async()=>{
 const h=await setup(active);try{
  await act(()=>h.renderer.root.findByType('Pressable').props.onPress());assert.deepEqual(h.actions,['pause']);
  await h.update({clock:{...active,remainingMs:18000,deadline:null,paused:true,serverNow:1012000}});
  assert.equal(h.seconds(),18);assert.equal(h.timers.size,0);await h.advance(10000);assert.equal(h.seconds(),18);
  assert.equal(h.renderer.root.findByType('Pressable').props.accessibilityLabel,'Reanudar tiempo');
  await act(()=>h.renderer.root.findByType('Pressable').props.onPress());assert.deepEqual(h.actions,['pause','resume']);
  await h.update({enabled:false,clock:{...active,remainingMs:18000,serverNow:1022000,deadline:1040000}});
  await h.advance(2000);assert.equal(h.seconds(),16);assert.equal(h.renderer.root.findByType('Pressable').props.disabled,true);
  assert.equal(h.renderer.root.findByType('Pressable').props.onPress,undefined);
 }finally{await h.close();}assert.equal(h.timers.size,0);
});
test('new snapshots synchronize once, identical snapshots do not refill the ring, and removing the clock cleans up',async()=>{
 const h=await setup(active);try{
  await h.advance(6000);assert.equal(h.seconds(),24);
  await h.update({clock:{...active}});assert.equal(h.seconds(),24);
  await h.update({clock:{...active,remainingMs:20000,serverNow:1010000}});assert.equal(h.seconds(),20);
  await h.advance(1000);assert.equal(h.seconds(),19);
  await h.update({clock:null});assert.equal(h.renderer.toJSON(),null);assert.equal(h.timers.size,0);
 }finally{await h.close();}
});

test('CPU and online zero use visual expiry only until disabled; CPU retains pause controls',async()=>{const h=await setup(active);try{await h.update({remindAfterExpiry:true});await h.advance(30000);assert.equal(h.seconds(),0);assert.equal(h.renderer.root.findByProps({testID:'online-turn-seconds'}).props.style.color,'#A4453D');assert.deepEqual(h.reminders.at(-1),{active:true});assert.equal(h.renderer.root.findByType('Pressable').props.disabled,false);await h.update({remindAfterExpiry:false});assert.equal(h.reminders.at(-1).active,true);await h.update({enabled:false});assert.equal(h.reminders.at(-1).active,false);assert.equal(h.renderer.root.findByType('Pressable').props.disabled,true);}finally{await h.close();}});

test('retained hidden timer has no display interval; return catches up to server time without executing action',async()=>{const h=await setup(active);try{await h.advance(5000);await h.visibility(false);assert.equal(h.timers.size,0);await h.advance(15000);assert.deepEqual(h.actions,[]);await h.visibility(true);assert.equal(h.seconds(),10);assert.equal(h.timers.size,1);await h.visibility(false);await h.advance(60000);await h.visibility(true);assert.equal(h.seconds(),0);assert.deepEqual(h.actions,[]);}finally{await h.close();}});

test('background suspends display ticks and foreground catches up without a local timeout action',async()=>{const h=await setup(active);try{await h.advance(5000);await h.app('background');assert.equal(h.timers.size,0);await h.advance(60000);await h.app('active');assert.equal(h.seconds(),0);assert.deepEqual(h.actions,[]);}finally{await h.close();}});

test('avatar mode keeps the player image at the timer position and counts only through the ring',async()=>{const h=await setup(active);try{await h.update({avatar:{uri:'self.jpg'},avatarLabel:'Ana'});assert.deepEqual(h.renderer.root.findByProps({testID:'online-turn-avatar'}).props.source,{uri:'self.jpg'});assert.equal(h.renderer.root.findAllByProps({testID:'online-turn-seconds'}).length,0);await h.advance(15000);const ring=h.renderer.root.findByProps({testID:'online-turn-progress'}).props;assert.ok(Math.abs(ring.strokeDashoffset-ring.strokeDasharray/2)<.001);await h.update({clock:null});assert.equal(h.renderer.root.findAllByProps({testID:'online-turn-avatar'}).length,1,'identity remains between rounds');assert.equal(h.renderer.root.findAllByProps({testID:'online-turn-progress'}).length,0);}finally{await h.close();}});

test('avatar warning begins at ten seconds, stops at zero and never sends game actions',async()=>{const h=await setup(active),warnings=[];try{await h.update({avatar:{uri:'self.jpg'},onWarningChange:value=>warnings.push(value)});await h.advance(19999);assert.equal(h.reminders.at(-1).active,false);await h.advance(1);assert.equal(h.reminders.at(-1).active,true);assert.equal(warnings.at(-1),true);await h.update({enabled:false});assert.equal(h.reminders.at(-1).active,false);await h.update({enabled:true});await h.advance(10000);assert.equal(h.reminders.at(-1).active,false);assert.equal(warnings.at(-1),false);assert.deepEqual(h.actions,[]);}finally{await h.close();}});

test('larger avatar ring keeps countdown, pause and identity in one control',async()=>{const h=await setup(active);try{await h.update({size:72,avatar:{uri:'self.jpg'}});assert.equal(h.renderer.root.findByType('Pressable').props.style.width,72);assert.equal(h.renderer.root.findByType('Svg').props.width,72);assert.equal(h.renderer.root.findByType('Image').props.style.width,72*.8);await h.advance(15000);const ring=h.renderer.root.findByProps({testID:'online-turn-progress'}).props;assert.ok(Math.abs(ring.strokeDashoffset-ring.strokeDasharray/2)<.001);await act(()=>h.renderer.root.findByType('Pressable').props.onPress());assert.deepEqual(h.actions,['pause']);}finally{await h.close();}});

test('Blackjack avatar preserves advisory expiry pulse without adding the Poker ten-second warning',async()=>{const h=await setup(active);try{await h.update({avatar:{uri:'self.jpg'},remindAfterExpiry:true});await h.advance(20000);assert.equal(h.reminders.at(-1).active,false);await h.advance(10000);assert.equal(h.reminders.at(-1).active,true);assert.equal(h.renderer.root.findByType('Pressable').props.disabled,false);assert.deepEqual(h.actions,[]);}finally{await h.close();}});
