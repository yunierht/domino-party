import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./PokerHandHint.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>({react:React,'react-native':{View:'View',Text:'Text'},'../computer/tableTheme':{TABLE:{}}})[id],m,m.exports);
test('hand evaluation lane preserves geometry when hidden, empty or translated, including scaled text',async()=>{
 for(const fontScale of [1,1.2,2]){let r;await act(()=>{r=create(React.createElement(m.exports.PokerHandHint,{visible:true,text:'Your hand · No pair',fontScale}));});
 const geometry=()=>r.root.findByType('View').props.style;const initial=geometry();
 for(const [visible,text] of [[false,''],[true,''],[true,'Tu mano · Escalera de color'],[true,'Your hand · Three of a kind'],[false,'Your hand · One pair']]){
  await act(()=>r.update(React.createElement(m.exports.PokerHandHint,{visible,text,fontScale})));
  assert.deepEqual(geometry(),initial);assert.equal(initial.flexShrink,0);
  assert.equal(r.root.findAllByType('Text').length,visible?1:0);
 }
 await act(()=>r.unmount());}
});
