import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const deps={react:React,'react-native':{Pressable:'Pressable',View:'View'},'@expo/vector-icons':{Feather:'Icon'}};
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./ModalCloseButton.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);
test('circle close preserves the supplied cancellation callback and reserves an accessible target',async()=>{
 let calls=0,r;await act(()=>{r=create(React.createElement(m.exports.ModalCloseButton,{onPress:()=>calls++,es:false}));});try{
  const button=r.root.findByType('Pressable');assert.equal(button.props.accessibilityLabel,'Close');assert.equal(button.props.style({pressed:false}).width,44);assert.equal(button.props.style({pressed:false}).right,8);
  assert.equal(r.root.findByType('Icon').props.name,'x');assert.equal(r.root.findByType('View').props.style.borderRadius,15);await act(()=>button.props.onPress());assert.equal(calls,1);
 }finally{await act(()=>r.unmount());}
});
