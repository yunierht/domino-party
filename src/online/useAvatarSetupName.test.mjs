import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./useAvatarSetupName.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>React,m,m.exports);
test('avatar choice fills its default, manual edits survive updates, and another choice resets the draft',async()=>{
 let state;function Probe(props){state=m.exports.useAvatarSetupName(props.id,props.name);return null;}let root;await act(()=>{root=create(React.createElement(Probe,{id:'yuni',name:'Yuni'}));});
 try{assert.equal(state.name,'Yuni');await act(()=>state.chooseName('Andy'));await act(()=>root.update(React.createElement(Probe,{id:'rafael',name:'Andy'})));assert.equal(state.name,'Andy');
  await act(()=>state.editName('Mi alias'));await act(()=>root.update(React.createElement(Probe,{id:'rafael',name:'Andy'})));assert.equal(state.name,'Mi alias');
  await act(()=>state.chooseName('Selfie propia'));await act(()=>root.update(React.createElement(Probe,{id:'selfie',name:'Selfie propia'})));assert.equal(state.name,'Selfie propia');
 }finally{await act(()=>root.unmount());}
});
