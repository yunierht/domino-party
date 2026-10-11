import {modalCloseMock} from '../components/modalCloseMock.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import {normalizeAvatarName} from './avatarIdentity.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let permission={granted:false},requests=0,resultPermission={granted:true},captureCalls=[],saved=[],cancelled=0;
let takePhoto=async()=>({uri:'file:///captured.jpg',width:1000,height:1000}),prepareCalls=[];
const prepared='data:image/jpeg;base64,preview-only-test-double';
const deps={react:React,'react-native':{ActivityIndicator:'Spinner',Image:'Image',Modal:({visible,children})=>visible?React.createElement('Modal',null,children):null,Platform:{OS:'ios'},Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',TextInput:'TextInput',View:'View'},
 'expo-camera':{CameraView:'CameraView',useCameraPermissions:()=>[permission,async()=>{requests++;return resultPermission;}]},
 'expo-image-manipulator':{ImageManipulator:{},SaveFormat:{JPEG:'jpeg'}},'../computer/tableTheme':{TABLE:{}},
 './avatarPhoto':{prepareSelfie:async photo=>{prepareCalls.push(photo);return prepared;}},'./avatarIdentity':{normalizeAvatarName}};
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./OnlineSelfieCapture.tsx',import.meta.url),'utf8'),
 {compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>id.endsWith('/GoldPressable')?{GoldPressable:'Pressable'}:id.endsWith('/ModalCloseButton')?modalCloseMock:deps[id],m,m.exports);
const props={visible:true,es:true,onCancel:()=>cancelled++,onSave:(value,name)=>saved.push([value,name])};
async function mount(visible=true){requests=0;captureCalls=[];saved=[];cancelled=0;prepareCalls=[];let r;await act(()=>{r=create(React.createElement(m.exports.OnlineSelfieCapture,{...props,visible}),{createNodeMock:node=>node.type==='CameraView'?{takePictureAsync:async options=>{captureCalls.push(options);return takePhoto();}}:null});});return r;}
const button=(r,label)=>r.root.findAllByType('Pressable').find(node=>node.props.accessibilityLabel===label);
test('camera permission follows explicit tap; photo is previewed and saved only after confirmation',async()=>{
 permission={granted:false};resultPermission={granted:true};takePhoto=async()=>({uri:'file:///captured.jpg',width:1000,height:1000});const r=await mount(false);
 try{
  assert.equal(requests,0);assert.equal(r.toJSON(),null);
  await act(()=>r.update(React.createElement(m.exports.OnlineSelfieCapture,props)));assert.equal(requests,0);
  await act(async()=>button(r,'Abrir cámara').props.onPress());assert.equal(requests,1);
  assert.equal(r.root.findByType('CameraView').props.facing,'front');assert.equal(button(r,'Tomar foto').props.disabled,true);
  await act(()=>r.root.findByType('CameraView').props.onCameraReady());await act(async()=>button(r,'Tomar foto').props.onPress());
  assert.equal(captureCalls[0].exif,false);assert.equal(prepareCalls.length,1);assert.equal(r.root.findByProps({testID:'selfie-preview'}).props.source.uri,prepared);assert.deepEqual(saved,[]);
  assert.equal(button(r,'Usar selfie').props.disabled,true);await act(()=>r.root.findByType('TextInput').props.onChangeText('  Mi nombre  '));
  await act(()=>{button(r,'Usar selfie').props.onPress();button(r,'Usar selfie').props.onPress();});assert.deepEqual(saved,[[prepared,'Mi nombre']]);
 }finally{await act(()=>r.unmount());}
});
test('web selfie capture has no file upload and still requires explicit camera action',async()=>{
 deps['react-native'].Platform.OS='web';const r=await mount();try{assert.equal(r.root.findAllByType('input').length,0);assert.equal(requests,0);assert.equal(r.root.findAllByType('TextInput').length,1);}finally{await act(()=>r.unmount());deps['react-native'].Platform.OS='ios';}
});
test('denied permission offers retry and cancel without opening the camera',async()=>{
 permission={granted:false};resultPermission={granted:false};const r=await mount();
 try{await act(async()=>button(r,'Abrir cámara').props.onPress());assert.equal(r.root.findAllByType('CameraView').length,0);assert.ok(r.root.findByProps({accessibilityRole:'alert'}));
  await act(()=>button(r,'Cerrar').props.onPress());assert.equal(cancelled,1);assert.deepEqual(saved,[]);
 }finally{await act(()=>r.unmount());}
});
test('cancelling during capture discards its late response',async()=>{
 permission={granted:true};let finish;takePhoto=()=>new Promise(resolve=>finish=resolve);const r=await mount();
 try{await act(async()=>button(r,'Abrir cámara').props.onPress());await act(()=>r.root.findByType('CameraView').props.onCameraReady());
  await act(()=>button(r,'Tomar foto').props.onPress());await act(()=>button(r,'Cerrar').props.onPress());
  await act(async()=>{finish({uri:'file:///late.jpg',width:1000,height:1000});await Promise.resolve();});
  assert.equal(prepareCalls.length,0);assert.equal(r.root.findAllByProps({testID:'selfie-preview'}).length,0);assert.deepEqual(saved,[]);
 }finally{await act(()=>r.unmount());}
});
