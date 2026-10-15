import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let prefs={ready:true,sound:true,tileSound:true,vibration:true},effects=[],reduced=true;
const deps={'../components/GoldPressable':{GoldPressable:'Pressable'},react:React,'react-native':{View:'View',Pressable:'Pressable',Text:'Text',
 Animated:{View:'AnimatedView',Value:class{setValue(){}stopAnimation(){}},sequence:()=>({start(){effects.push('motion');},stop(){}}),timing:()=>({})},
 Vibration:{vibrate:ms=>effects.push(`vibrate:${ms}`)}},
 '../computer/DrinkGift':{useReducedMotion:()=>reduced},'../computer/tableTheme':{TABLE:{}},
 '../state/PrefsContext':{usePrefs:()=>prefs},'../sound/sounds':{playTap:()=>effects.push('tap'),playTileContact:()=>effects.push('knock')}};
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./OnlineQuickActions.tsx',import.meta.url),'utf8'),
 {compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);
const {OnlineQuickActions,OnlineAttentionNotice}=m.exports;
const event=(kind='knock',id='first')=>({id,from:'computer',kind,sentAt:10000,expiresAt:13000});
const noticeProps=(overrides={})=>({event:event(),localSeat:'human',serverNow:10000,es:true,...overrides});
async function mount(Component,props){let r;await act(()=>{r=create(React.createElement(Component,props));});return r;}

test('quick actions require support and waiting, prevent in-flight repeats and cool down only after ACK',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});t.mock.method(performance,'now',()=>Date.now());let accept,commands=[];
 const props={enabled:true,supported:true,es:true,onSend:kind=>{commands.push(kind);return new Promise(resolve=>accept=resolve);}};
 const r=await mount(OnlineQuickActions,{...props,supported:false});
 try{
  assert.equal(r.toJSON(),null);await act(()=>r.update(React.createElement(OnlineQuickActions,{...props,enabled:false})));
  await act(()=>r.root.findAllByType('Pressable')[0].props.onPress());assert.deepEqual(commands,[]);
  await act(()=>r.update(React.createElement(OnlineQuickActions,props)));
  assert.deepEqual(r.root.findAllByType('Pressable').map(p=>p.props.accessibilityLabel),['Te toca','Toc, toc','¿Estás ahí?']);
  await act(()=>{r.root.findAllByType('Pressable')[0].props.onPress();r.root.findAllByType('Pressable')[1].props.onPress();});assert.deepEqual(commands,['wave']);
  await act(async()=>{accept(false);await Promise.resolve();});assert.equal(r.root.findAllByType('Pressable')[0].props.disabled,false);
  await act(()=>r.root.findAllByType('Pressable')[2].props.onPress());await act(async()=>{accept(true);await Promise.resolve();});
  assert.equal(r.root.findAllByType('Pressable')[0].props.disabled,true);
  await act(()=>t.mock.timers.tick(2999));assert.equal(r.root.findAllByType('Pressable')[0].props.disabled,true);
  await act(()=>t.mock.timers.tick(1));assert.equal(r.root.findAllByType('Pressable')[0].props.disabled,false);
  await act(()=>r.root.findAllByType('Pressable')[1].props.onPress());assert.deepEqual(commands,['wave','look','knock']);
  await act(async()=>{accept(true);await Promise.resolve();});
  await act(()=>r.update(React.createElement(OnlineQuickActions,{...props,visible:false})));assert.equal(r.toJSON(),null);
 }finally{await act(()=>r.unmount());t.mock.timers.reset();}
});

test('knock deduplicates polling and expires after three seconds without a blocking overlay',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});t.mock.method(performance,'now',()=>Date.now());prefs={ready:true,sound:true,tileSound:true,vibration:true};effects=[];reduced=true;
 const r=await mount(OnlineAttentionNotice,noticeProps());
 try{
  assert.deepEqual(effects,['knock','vibrate:30']);assert.equal(r.root.findByProps({testID:'online-attention-notice'}).props.pointerEvents,'none');
  assert.deepEqual(r.root.findByProps({testID:'online-attention-notice'}).props.style.transform,[{translateY:0}]);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:{...event()},serverNow:10100}))));
  await act(()=>t.mock.timers.tick(180));assert.deepEqual(effects,['knock','vibrate:30','knock']);
  await act(()=>t.mock.timers.tick(2820));assert.equal(r.toJSON(),null);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:{...event()},serverNow:13000}))));assert.equal(r.toJSON(),null);
 }finally{await act(()=>r.unmount());t.mock.timers.reset();}
});

test('playing dismisses immediately, cancels the pending second knock, and cannot resurrect the same event',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});t.mock.method(performance,'now',()=>Date.now());effects=[];prefs={ready:true,sound:true,tileSound:true,vibration:false};
 const r=await mount(OnlineAttentionNotice,noticeProps());
 try{
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({dismissalKey:1}))));assert.equal(r.toJSON(),null);
  await act(()=>t.mock.timers.tick(180));assert.deepEqual(effects,['knock']);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({dismissalKey:1,event:{...event()},serverNow:10180}))));assert.equal(r.toJSON(),null);
 }finally{await act(()=>r.unmount());t.mock.timers.reset();}
});

test('preferences mute sound and vibration; look is silent; self and expired events do nothing',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});t.mock.method(performance,'now',()=>Date.now());effects=[];prefs={ready:true,sound:false,tileSound:false,vibration:false};
 const r=await mount(OnlineAttentionNotice,noticeProps());
 try{
  await act(()=>t.mock.timers.tick(180));assert.deepEqual(effects,[]);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:event('wave','second')}))));assert.deepEqual(effects,[]);
  prefs={ready:true,sound:true,tileSound:true,vibration:true};
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:event('look','third')}))));assert.deepEqual(effects,[]);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:{...event('wave','expired'),expiresAt:9999}}))));assert.deepEqual(effects,[]);assert.equal(r.toJSON(),null);
  await act(()=>r.update(React.createElement(OnlineAttentionNotice,noticeProps({event:{...event('wave','self'),from:'human'}}))));assert.deepEqual(effects,[]);assert.equal(r.toJSON(),null);
 }finally{await act(()=>r.unmount());t.mock.timers.reset();}
});

test('unmount cancels delayed knock; fresh wave plays once with normal motion',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});t.mock.method(performance,'now',()=>Date.now());effects=[];prefs={ready:true,sound:true,tileSound:true,vibration:false};
 const r=await mount(OnlineAttentionNotice,noticeProps());await act(()=>r.unmount());await act(()=>t.mock.timers.tick(180));assert.deepEqual(effects,['knock']);
 reduced=false;effects=[];const wave=await mount(OnlineAttentionNotice,noticeProps({event:event('wave','wave')}));
 try{assert.deepEqual(effects,['tap','motion']);}finally{await act(()=>wave.unmount());reduced=true;t.mock.timers.reset();}
});

test('narrow right lane wraps without reducing the forty-four pixel tap targets',async()=>{const r=await mount(OnlineQuickActions,{enabled:true,supported:true,es:true,onSend:()=>true,compact:true,stacked:true});try{assert.equal(r.root.findByProps({testID:'online-quick-actions'}).props.style.width,91);assert.equal(r.root.findByProps({testID:'online-quick-actions'}).props.style.flexWrap,'wrap');assert.ok(r.root.findAllByType('Pressable').every(p=>p.props.style({pressed:false}).width===44));}finally{await act(()=>r.unmount());}});
