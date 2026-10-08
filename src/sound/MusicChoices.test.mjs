import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import React from 'react';import {act,create} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('Settings exact accessible labels select existing IDs without enabling music; table labels and surfaces remain unchanged',async()=>{
 const tracks=[{id:'smooth-jazz',en:'1 · Smooth jazz',es:'1 · Jazz suave'},{id:'latin-jazz',en:'2 · Latin jazz',es:'2 · Jazz latino'},{id:'reggaeton',en:'6 · Latin reggaeton',es:'6 · Reguetón latino'}];let prefs={tableMusic:false,tableMusicTrack:'smooth-jazz'},ids=[];
 const deps={react:React,'react-native':{Text:'Text',View:'View',Pressable:'Pressable'},'./tableMusicCatalog':{MUSIC_TRACKS:tracks},'../computer/tableTheme':{TABLE:{surface:'#04130D',gold:'#d7a63d',line:'#555',ivory:'#fff'}},'../state/PrefsContext':{usePrefs:()=>({...prefs,setTableMusicTrack:id=>{ids.push(id);prefs={...prefs,tableMusicTrack:id};}})}};
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./MusicChoices.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);
 const style={text:'#fff',surface:'#161616',border:'#555',primary:'#d7a63d',radius:12};let r;await act(()=>{r=create(React.createElement(m.exports.MusicChoices,{es:true,settingsAppearance:style}));});try{
  const radios=()=>r.root.findAllByType('Pressable');assert.deepEqual(radios().map(e=>e.props.accessibilityLabel),['Smooth Jazz','Latin Jazz','Reggaetón']);assert.deepEqual(radios().map(e=>e.props['aria-checked']),[true,false,false]);
  for(let i=0;i<3;i++){await act(()=>radios()[i].props.onPress());await act(()=>r.update(React.createElement(m.exports.MusicChoices,{es:true,settingsAppearance:style})));assert.equal(prefs.tableMusic,false);assert.equal(radios()[i].props['aria-checked'],true);}
  assert.deepEqual(ids,tracks.map(t=>t.id));await act(()=>r.update(React.createElement(m.exports.MusicChoices,{es:false})));assert.deepEqual(radios().map(e=>e.props.accessibilityLabel),tracks.map(t=>t.en));assert.ok(radios().every(e=>e.props.style.backgroundColor==='#04130D'));
 }finally{await act(()=>r.unmount());}
});
