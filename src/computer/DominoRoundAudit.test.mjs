import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import {deal,play,drawOrPass,pipTotal} from './engine.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const mod={exports:{}},deps={react:React,'react-native':{View:'View',Text:'Text',ScrollView:'ScrollView'},'./DominoTile':{DominoTile:'Tile'},'./tableTheme':{TABLE:{}},'./engine':{pipTotal}};
new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./DominoRoundAudit.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>deps[id],mod,mod.exports);
const tile=(a,b)=>({id:`${a}-${b}`,a,b});
test('resolved tiles, both sums and awarded score explain ordinary, blocked, tie and wins results without changing engine state',async()=>{
 for(const mode of ['points','wins'])for(const kind of ['out','blocked','tie']){
  let game={...deal('Ana',100,()=>.4,undefined,mode),board:[tile(0,0)],stock:[],stockSlots:[],turn:'human',passes:0,hands:{human:[tile(1,1)],computer:[tile(2,3)]}};
  if(kind==='out'){game={...game,hands:{human:[tile(0,1)],computer:[tile(2,3)]}};game=play(game,'human','0-1','right');}
  else {if(kind==='tie')game.hands={human:[tile(1,4)],computer:[tile(2,3)]};game=drawOrPass(drawOrPass(game,'human'),'computer');}
  const before=JSON.stringify(game);let r;await act(()=>r=create(React.createElement(mod.exports.DominoRoundAudit,{hands:game.hands,result:game.result,mode,names:{human:'Ana',computer:'Luis'},es:true})));
  try{
   assert.equal(r.root.findAllByType('Tile').length,game.hands.human.length+game.hands.computer.length);
   for(const seat of ['human','computer'])assert.equal(r.root.findByProps({testID:`round-pips-${seat}`}).props.children,`${seat==='human'?'Ana':'Luis'}: ${pipTotal(game.hands[seat])}`);
   const text=r.root.findByProps({testID:'round-score-audit'}).props.children;
   assert.ok(text.includes(`= ${game.result.points}`));if(mode==='wins'&&kind!=='tie')assert.ok(text.includes('+1 victoria'));
   assert.equal(JSON.stringify(game),before);
  }finally{await act(()=>r.unmount());}
 }
});
test('audit renders nothing during active play',async()=>{let r;await act(()=>r=create(React.createElement(mod.exports.DominoRoundAudit,{hands:{human:[tile(1,1)],computer:[tile(2,2)]},result:null,mode:'points',names:{human:'Ana',computer:'Luis'},es:false})));assert.equal(r.toJSON(),null);await act(()=>r.unmount());});
