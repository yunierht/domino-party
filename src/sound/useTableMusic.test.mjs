import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('music stays silent by default, owns one player, pauses in background and cancels late setup',async()=>{
 const players=[];let listener;const pending=[];const app={currentState:'active',addEventListener:(_,cb)=>{listener=cb;return {remove(){listener=null;}};}};
 const deps={react:React,'react-native':{AppState:app},'expo-audio':{createAudioPlayer:()=>{const p={plays:0,pauses:0,removed:false,play(){this.plays++;},pause(){this.pauses++;},remove(){this.removed=true;}};players.push(p);return p;},setAudioModeAsync:()=>new Promise(resolve=>pending.push(resolve))},'../../assets/sounds/table-lounge.wav':1};
 const mod={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./useTableMusic.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',code)(id=>deps[id],mod,mod.exports);
 function Harness({enabled}){mod.exports.useTableMusic(enabled);return null;}
 let r;await act(()=>{r=create(React.createElement(Harness,{enabled:false}));});assert.equal(players.length,0);
 await act(()=>r.update(React.createElement(Harness,{enabled:true})));assert.equal(players.length,1);assert.equal(players[0].plays,0);
 await act(()=>pending.shift()());assert.equal(players[0].plays,1);assert.equal(players[0].loop,true);
 app.currentState='background';listener();assert.equal(players[0].pauses,1);
 app.currentState='active';listener();assert.equal(players[0].plays,2);
 await act(()=>r.update(React.createElement(Harness,{enabled:true})));assert.equal(players.length,1);
 await act(()=>r.update(React.createElement(Harness,{enabled:false})));assert.equal(players[0].removed,true);assert.equal(listener,null);
 await act(()=>r.update(React.createElement(Harness,{enabled:true})));
 await act(()=>r.unmount());await act(()=>pending.shift()());assert.equal(players[1].plays,0);assert.equal(players[1].removed,true);
});
