import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('deal gates play, settles once, skips resumed hands and stops audio on interruption',async()=>{
 const animations=[],sounds=[];
 class Value {constructor(value){this.value=value;}setValue(value){this.value=value;}interpolate(v){return v;}}
 const deps={react:React,'react-native':{AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:()=>({remove(){}})},Easing:{linear:0},Animated:{Value,timing:(value,config)=>{const a={config,start(cb){this.cb=cb;},stop(){}};animations.push(a);return a;},View:'View'}},'../sound/sounds':{playRoundDeal:()=>{sounds.push('start');return()=>sounds.push('stop');}}};
 const mod={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./RoundDeal.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(id=>deps[id],mod,mod.exports);
 let state;function Host(props){state=mod.exports.useRoundDeal(props.game,true,props.active,true);return null;}
 const game={stockSlots:[],board:[],last:null,result:null};let renderer;
 await act(async()=>{renderer=create(React.createElement(Host,{game,active:true}));});
 assert.equal(state.dealing,true);assert.equal(sounds.length,1);
 await act(()=>animations[0].cb({finished:true}));assert.equal(state.dealing,false);
 await act(()=>renderer.update(React.createElement(Host,{game:{...game},active:true})));assert.equal(animations.length,1);
 const next={...game,stockSlots:[]};await act(()=>renderer.update(React.createElement(Host,{game:next,active:true})));assert.equal(state.dealing,true);
 await act(()=>renderer.update(React.createElement(Host,{game:next,active:false})));assert.equal(state.dealing,false);assert.ok(sounds.includes('stop'));
 await act(()=>renderer.update(React.createElement(Host,{game:{...game,stockSlots:[],board:[{}]},active:true})));assert.equal(state.dealing,false);
 await act(()=>renderer.unmount());
});
