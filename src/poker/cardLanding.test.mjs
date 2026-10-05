import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function setup(reduced){const animations=[];class Value{constructor(n){this.n=n;}setValue(n){this.n=n;}interpolate(){return 0;}}
 const svg={__esModule:true,default:'Svg'};for(const n of ['Defs','Pattern','Rect','Path','G','Circle','LinearGradient','Stop','Text'])svg[n]=n;
 const deps={react:React,'react-native-svg':svg,'react-native':{View:'View',AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced},Animated:{Value,View:'AnimatedView',timing:(value,options)=>{const a={options,start(cb){this.cb=cb;},stop(){this.stopped=true;},finish(finished=true){this.cb({finished});}};animations.push(a);return a;}}}};
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./PlayingCard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);return{Card:m.exports.PlayingCard,animations};}
test('landing acknowledges actual completion, not a timer or cancellation',async()=>{
 const h=setup(false);let r,landings=0;await act(async()=>{r=create(React.createElement(h.Card,{card:{rank:11,suit:'h'},delay:740,onLanded:()=>landings++}));});
 assert.equal(landings,0);assert.equal(h.animations[0].options.delay,740);
 await act(()=>h.animations[0].finish(false));assert.equal(landings,0);
 await act(()=>h.animations[0].finish());assert.equal(landings,1);await act(()=>r.unmount());
});
test('old hand callback after unmount cannot remove a new hand placeholder',async()=>{
 const h=setup(false);let r,landings=0;await act(async()=>{r=create(React.createElement(h.Card,{card:{rank:11,suit:'h'},onLanded:()=>landings++}));});
 await act(()=>r.unmount());h.animations[0].finish();assert.equal(landings,0);assert.ok(h.animations[0].stopped);
});
test('reduced motion lands immediately without a delayed flight',async()=>{
 const h=setup(true);let r,landings=0;await act(async()=>{r=create(React.createElement(h.Card,{card:{rank:11,suit:'h'},delay:1740,onLanded:()=>landings++}));});
 assert.equal(h.animations.length,0);assert.equal(landings,1);await act(()=>r.unmount());
});
