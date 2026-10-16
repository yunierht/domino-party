import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {modalCloseMock} from '../components/modalCloseMock.mjs';
import {TABLE} from '../computer/tableTheme.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const transpile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
const controllerModule={exports:{}};new Function('module','exports',transpile('./voiceController.ts'))(controllerModule,controllerModule.exports);
for(const appearance of ['default','poker'])for(const reason of ['background','unavailable','unmount','hold'])test(`voice ${appearance} releases media when ${reason}`,async()=>{
 let acquired=0,stopped=0,background;const uuid='12345678-1234-1234-1234-123456789abc';
 const platform={available:()=>true,acquire:async()=>{acquired++;return{mute(){},stop(){stopped++;},peer(){throw Error('unexpected peer');}};}};
 const deps={react:React,'react-native':{AppState:{addEventListener:(_,fn)=>{background=fn;return{remove(){}};}},Modal:({visible,children})=>visible?React.createElement('Modal',null,children):null,Pressable:'Pressable',View:'View',Text:'Text'},'@expo/vector-icons':{Feather:'Feather'},'expo-crypto':{randomUUID:()=>uuid},'./voiceController':controllerModule.exports,'./voicePlatform':{createVoicePlatform:()=>platform},'../computer/tableTheme':{TABLE},'../components/ModalCloseButton':modalCloseMock};
 const m={exports:{}};new Function('require','module','exports',transpile('./OnlineVoiceControl.tsx'))(id=>id.endsWith('/GoldPressable')?{GoldPressable:'Pressable'}:deps[id]??(()=>{throw Error(id);})(),m,m.exports);
 const props={appearance,epoch:'e',seat:'human',opponentName:'Luis',relay:async req=>({peer:null,messages:[],call:req.message?.type==='call'?{id:req.message.callId,caller:'human',callerSession:uuid,calleeSession:null,expiresAt:30000,status:'ringing',reason:null}:null}),available:true,es:true,onStatus(){}};let r;
 await act(()=>{r=create(React.createElement(m.exports.OnlineVoiceControl,props));});assert.equal(acquired,0);
 await act(async()=>{r.root.findByProps({testID:'online-voice-control'}).props.onPress();await Promise.resolve();await Promise.resolve();});assert.equal(acquired,1);
 assert.equal(r.root.findByProps({testID:'online-voice-control'}).props.style({pressed:false}).width,appearance==='poker'?44:40);assert.equal(r.root.findAllByProps({testID:'online-voice-leave'}).length,1);
 if(reason==='hold')await act(()=>r.root.findByProps({testID:'online-voice-control'}).props.onLongPress());
 else if(reason==='background')await act(()=>background('background'));
 else if(reason==='unavailable')await act(()=>r.update(React.createElement(m.exports.OnlineVoiceControl,{...props,available:false})));
 else await act(()=>r.unmount());
 assert.equal(stopped,1);
 if(reason!=='unmount')await act(()=>r.unmount());
});

for(const error of ['voice_retry_later','voice_daily_limit','voice_monthly_limit'])test('voice displays a distinct explanation for '+error,async()=>{const messages=[];const deps={react:React,'react-native':{AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Modal:()=>null,Pressable:'Pressable',View:'View',Text:'Text'},'@expo/vector-icons':{Feather:'Feather'},'expo-crypto':{randomUUID:()=> 'session'},'./voiceController':controllerModule.exports,'./voicePlatform':{createVoicePlatform:()=>({available:()=>true,acquire:async()=>{throw Error(error);}})},'../computer/tableTheme':{TABLE},'../components/ModalCloseButton':modalCloseMock};const m={exports:{}};new Function('require','module','exports',transpile('./OnlineVoiceControl.tsx'))(id=>id.endsWith('/GoldPressable')?{GoldPressable:'Pressable'}:deps[id],m,m.exports);let r;await act(()=>r=create(React.createElement(m.exports.OnlineVoiceControl,{epoch:'e',seat:'human',opponentName:'Yoi',relay:async()=>({call:null,peer:null,messages:[]}),available:true,es:true,onStatus:value=>messages.push(value)})));try{await act(async()=>{await r.root.findByProps({testID:'online-voice-control'}).props.onPress();});const text=messages.at(-1);assert.ok(text.includes(error==='voice_retry_later'?'5 segundos':error==='voice_daily_limit'?'hoy':'mes'));}finally{await act(()=>r.unmount());}});


for(const appearance of ['default','poker'])test('visible cross ends connected voice while microphone only mutes - '+appearance,async()=>{
 let stopped=0,muted=0;class ConnectedVoice{state={phase:'connected',muted:false};subscribe(){return()=>{};}listen(){}suspend(){}stop(){stopped++;}toggleMute(){muted++;}}
 const deps={react:React,'react-native':{AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Modal:()=>null,Pressable:'Pressable',View:'View',Text:'Text'},'@expo/vector-icons':{Feather:'Feather'},'expo-crypto':{randomUUID:()=> 'session'},'./voiceController':{VoiceController:ConnectedVoice},'./voicePlatform':{createVoicePlatform:()=>({available:()=>true})},'../computer/tableTheme':{TABLE},'../components/ModalCloseButton':modalCloseMock};
 const m={exports:{}};new Function('require','module','exports',transpile('./OnlineVoiceControl.tsx'))(id=>id.endsWith('/GoldPressable')?{GoldPressable:'Pressable'}:deps[id],m,m.exports);let r;
 await act(()=>r=create(React.createElement(m.exports.OnlineVoiceControl,{appearance,epoch:'e',seat:'human',opponentName:'Luis',relay:async()=>({}),available:true,es:true,onStatus(){}})));
 try{const mic=r.root.findByProps({testID:'online-voice-control'}),leave=r.root.findByProps({testID:'online-voice-leave'});assert.equal(leave.props.accessibilityRole,'button');assert.match(leave.props.accessibilityLabel,/voz|llamada/i);assert.equal(leave.findByType('Feather').props.name,'x');assert.equal(leave.props.style.height,44);
 if(appearance==='poker'){assert.equal(leave.props.style.width,44);assert.equal(mic.parent.props.style.width,88);assert.equal(mic.parent.props.style.height,44);assert.notEqual(mic.parent.props.style.overflow,'hidden');}else assert.equal(leave.props.style.width,32);
 await act(()=>mic.props.onPress());assert.equal(muted,1);assert.equal(stopped,0);await act(()=>leave.props.onPress());assert.equal(stopped,1);assert.equal(muted,1);
 }finally{await act(()=>r.unmount());}
});
