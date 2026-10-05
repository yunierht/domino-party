import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';
const require=createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function compile(file, dependencies){
 const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(id=> id in dependencies?dependencies[id]:require(id),mod,mod.exports);
 return mod.exports;
}
for(const sound of [false,true]) for(const player of ['human','computer']) test(`draw overlay never rewinds at commit; hole persists for ${player}, sound=${sound}`,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const animations=[];const values=[];let tics=0;
 class Value{constructor(n){this.n=n;this.history=[n];values.push(this);}setValue(n){this.n=n;this.history.push(n);}interpolate(){return this.n;}}
 const slots=compile('./boneyardSlots.ts',{});
 const {BoneyardPanel}=compile('./BoneyardPanel.tsx',{'./DominoTurnTitle':{DominoTurnTitle:({children})=>children},
  'react-native':{View:'View',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',Easing:{cubic:0,inOut:()=>0},Animated:{Value,View:'AnimatedView',timing:(value)=>{const a={value,callback:null,start(cb){this.callback=cb;},stop(){}};animations.push(a);return a;}}},
  'expo-haptics':{selectionAsync:()=>Promise.resolve()},'./DominoTile':{DominoTile:()=>React.createElement('Tile')},
  './DrinkGift':{useReducedMotion:()=>false},'../state/PrefsContext':{usePrefs:()=>({tileSound:sound,vibration:false})},
  '../sound/sounds':{reservePlacementContact:()=>{let timer;return{impactMs:0,schedule(ms,enabled){timer=setTimeout(()=>{if(enabled())tics++;},ms);},cancel(){clearTimeout(timer);}};}},'./tableTheme':{TABLE:{}},'./boneyardSlots':slots,
 });
 const stock=[{id:'0-0',a:0,b:0},{id:'0-1',a:0,b:1},{id:'0-2',a:0,b:2}];
 let game={stock,stockSlots:stock.map(t=>t.id),turn:player};const draws=[];
 const measure={measureInWindow:cb=>cb(10,20,36,64)};
 const props=()=>({game,es:false,destination:{current:measure},onDraw:index=>draws.push(index),onClose:()=>{}});
 let renderer;await act(()=>{renderer=create(React.createElement(BoneyardPanel,props()),{createNodeMock:()=>measure});});
 assert.ok(renderer.root.findAllByType('Pressable').every(n=>n.props.testID?.startsWith('stock-tile-')),'only hidden tiles are actionable; no manual close');
 const first=renderer.root.findByProps({testID:'stock-tile-1'}).props.onPress;
 if(player==='computer') await act(()=>t.mock.timers.tick(650));
 else await act(()=>{first();first();});
 assert.equal(animations.length,1);
 const selected=renderer.root.findAll(n=>n.props.testID?.startsWith('stock-hole-'));
 assert.equal(selected.length,1);
 const holeId=selected[0].props.testID;
 assert.equal(draws.length,0);assert.equal(tics,0,'no selection sound before landing');
 await act(()=>{t.mock.timers.tick(560);animations[0].value.setValue(1);animations[0].callback({finished:true});});
 assert.equal(draws.length,1);assert.equal(tics,sound?1:0,'one tic for the entire completed draw');
 assert.equal(renderer.root.findAllByProps({testID:holeId}).length,1,'hole survives before game commit');
 game={...game,stock:game.stock.filter((_,i)=>i!==draws[0])};
 await act(()=>renderer.update(React.createElement(BoneyardPanel,props())));
 assert.equal(renderer.root.findAllByProps({testID:'draw-flight'}).length,0);
 assert.equal(renderer.root.findAllByProps({testID:holeId}).length,1);
 assert.equal(values[0].n,1,'completed native value must not snap back to the stock');
 assert.deepEqual(values[0].history,[0,1]);
 if(player==='computer') await act(()=>t.mock.timers.tick(650));
 else await act(()=>renderer.root.findAllByType('Pressable').find(n=>n.props.testID?.startsWith('stock-tile-')).props.onPress());
 assert.equal(animations.length,2);
 assert.notEqual(values[0],values[1]);assert.equal(values[1].n,0);
 assert.equal(values[0].n,1);
 await act(()=>renderer.update(React.createElement(BoneyardPanel,{...props(),interactive:false})));
 await act(()=>animations[1].callback({finished:true}));
 assert.equal(draws.length,1,'cancelled flight must not commit a late draw');
 assert.equal(renderer.root.findAllByProps({testID:'draw-flight'}).length,0);
 await act(()=>renderer.unmount());
});
