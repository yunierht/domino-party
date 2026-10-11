import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const mocks={react:React,'react-native':{View:'View',Image:'Image',Pressable:'Pressable',Text:'Text'},'@expo/vector-icons':{Feather:'Feather'},'../computer/tableTheme':{TABLE:{}},'./OnlineSelfieCapture':{OnlineSelfieCapture:'Capture'}};
const mod={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./SelfieAvatarChoice.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>mocks[id],mod,mod.exports);
test('selfie opens only after explicit tap, cancel preserves the selection, confirm saves, and a saved photo can be reused or retaken',async()=>{
 const calls=[];let root;const props={selected:false,es:true,onSelect:()=>calls.push('select'),onSave:photo=>calls.push(photo)};
 await act(()=>{root=create(React.createElement(mod.exports.SelfieAvatarChoice,props));});
 try{
  assert.equal(root.root.findAllByType('Capture').length,0);
  await act(()=>root.root.findByProps({accessibilityLabel:'Crear selfie'}).props.onPress());assert.equal(root.root.findByType('Capture').props.visible,true);
  await act(()=>root.root.findByType('Capture').props.onCancel());assert.deepEqual(calls,[]);assert.equal(root.root.findAllByType('Capture').length,0);
  await act(()=>root.root.findByProps({accessibilityLabel:'Crear selfie'}).props.onPress());await act(()=>root.root.findByType('Capture').props.onSave('confirmed-photo'));assert.deepEqual(calls,['confirmed-photo']);assert.equal(root.root.findAllByType('Capture').length,0);
  await act(()=>root.update(React.createElement(mod.exports.SelfieAvatarChoice,{...props,photo:'confirmed-photo',selected:true})));
  await act(()=>root.root.findByProps({accessibilityLabel:'Usar mi selfie'}).props.onPress());assert.equal(calls.at(-1),'select');assert.equal(root.root.findAllByType('Capture').length,0);
  await act(()=>root.root.findByProps({accessibilityLabel:'Cambiar selfie'}).props.onPress());assert.equal(root.root.findAllByType('Capture').length,1);
 }finally{await act(()=>root.unmount());}
});
