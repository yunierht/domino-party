import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks){const mod={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(id=>id.endsWith('.png')?id:mocks[id],mod,mod.exports);return mod.exports;}
const catalog=load('./opponents.ts',{});
const choices=load('./OpponentChoices.tsx',{'react':React,'react-native':{View:'View',ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',Image:'Image'},'./opponents':catalog,'./tableTheme':{TABLE:{}}});
for(const variant of ['OpponentCarousel','OpponentChoices'])test(`${variant}: Rigo selectable, Alex absent, persisted selection and callback retained`,async()=>{
 let root,selected;await act(()=>{root=create(React.createElement(choices[variant],{selected:'rigo',onSelect:id=>{selected=id;},es:true}));});
 const buttons=root.root.findAllByType('Pressable');
 assert.equal(buttons.length,catalog.OPPONENTS.length);assert.ok(!buttons.some(b=>b.props.accessibilityLabel==='Alex'));
 const rigo=buttons.find(b=>b.props.accessibilityLabel==='Rigo');assert.ok(rigo.props.accessibilityState.selected);
 assert.equal(buttons.filter(b=>b.props.accessibilityState.selected).length,1);
 await act(()=>rigo.props.onPress());assert.equal(selected,'rigo');
 const scroll=root.root.findAllByType('ScrollView');assert.equal(scroll.length,variant==='OpponentCarousel'?1:0);
 if(scroll.length)assert.equal(scroll[0].props.horizontal,true);
 await act(()=>root.unmount());
});
