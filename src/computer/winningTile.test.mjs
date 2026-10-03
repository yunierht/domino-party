import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
for(const pickupOnArrival of [false,true]) for(const reduced of [false,true]) for(const enabled of [false,true]) test(`winning tile lands once, reduced=${reduced}, effects=${enabled}, computer=${pickupOnArrival}`,async()=>{
 const animations=[],sequences=[],calls=[],scheduled=[];let transforms;
 class Value {constructor(n){this.n=n;} interpolate(config){return config;}}
 const animation=(config)=>{const a={config,start(cb){this.cb=result=>{if(result.finished)scheduled.splice(0).forEach(f=>f());cb?.(result);};},stop(){this.stopped=true;}};return a;};
 const deps={react:React,'react-native':{View:'View',Text:'Text',Pressable:'Pressable',Easing:{linear:0,cubic:1,out:x=>x,in:x=>x},Animated:{View:'AnimatedView',Value,timing:(v,c)=>{const a=animation(c);animations.push(a);return a;},sequence:steps=>{const a=animation(steps);sequences.push(a);return a;}}},'expo-haptics':{ImpactFeedbackStyle:{Heavy:'heavy'},impactAsync:()=>{calls.push('haptic');return Promise.resolve();}},'./DominoTile':{DominoTile:()=>React.createElement('Tile')},'./boardLayout':{},'./tableTheme':{TABLE:{}},'./TileCelebration':{TileCelebration:()=>React.createElement('Burst')},'../state/PrefsContext':{usePrefs:()=>({tileSound:enabled,vibration:enabled})},'../sound/sounds':{reservePlacementContact:()=>{let cancelled=false;return{impactMs:0,schedule(ms,enabled){scheduled.push(()=>{if(!cancelled&&enabled())calls.push('contact');});},cancel(){cancelled=true;}};}},'./DrinkGift':{useReducedMotion:()=>true}};
 const code=ts.transpileModule(readFileSync(new URL('./AnchoredBoard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',code+'\nexports.TestTile=PlacedTile;')(id=>deps[id],mod,mod.exports);
 let renderer;await act(()=>{renderer=create(React.createElement(mod.exports.TestTile,{tile:{id:'3-3',a:3,b:3},point:{x:40,y:60,scale:1},metrics:{width:320,height:420,tileHeight:30,tileWidth:60,half:30},winning:true,arriving:true,opening:false,reduced,pickupOnArrival}));});
 assert.deepEqual(calls,[]);
 assert.equal(renderer.root.findAllByType('Tile').length,1);
 transforms=renderer.root.findByProps({testID:'board-tile-3-3'}).props.style.transform;
 for(const tr of transforms){if(tr.translateX||tr.translateY)assert.equal((tr.translateX??tr.translateY).outputRange.at(-1),0);if(tr.scale)assert.equal(tr.scale.outputRange.at(-1),1);}

 const landing=reduced?animations[0]:sequences[0];
 if(reduced) assert.equal(landing.config.duration,80);
 else assert.deepEqual(landing.config.map(a=>a.config.toValue),[0.45,0.6,0.82]);
 await act(()=>landing.cb({finished:true}));
 assert.deepEqual(calls,enabled?['contact','haptic']:[]);
 assert.equal(renderer.root.findAllByType('Tile').length,1);
 transforms=renderer.root.findByProps({testID:'board-tile-3-3'}).props.style.transform;
 for(const tr of transforms){if(tr.translateX||tr.translateY)assert.equal((tr.translateX??tr.translateY).outputRange.at(-1),0);if(tr.scale)assert.equal(tr.scale.outputRange.at(-1),1);}

 assert.equal(renderer.root.findAllByType('Burst').length,1);
 await act(()=>renderer.unmount());
 const count=calls.length;await act(()=>landing.cb({finished:true}));assert.equal(calls.length,count);
});
