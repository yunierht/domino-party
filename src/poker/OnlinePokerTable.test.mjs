import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
import * as domain from '../../backend/domino-online/src/pokerRoom.ts';import {combinationCards} from './engine.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const h='a'.repeat(64),g='b'.repeat(64),random=()=>.4;
async function mount(){
 let room=domain.join(domain.create('ABCDEF0123','epoch',h,'Ana',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}),g,'Luis',0,{avatar:'yoi',acceptInvitation:true},random),connected=true;const sent=[];
 const props={es:false,busy:false,connected:true,onBack(){},voice(){},onHold(){},async onCommand(action){sent.push(action);room=domain.command(room,h,action,1,random);return true;}};
 const source=readFileSync(new URL('./OnlinePokerTable.tsx',import.meta.url),'utf8'),deps={react:React,'react-native':{View:'View',Text:'Text',Image:'Image',Pressable:'Pressable',useWindowDimensions:()=>({height:640,width:320})},'./engine':{combinationCards},'../computer/dominoAvatars':{DOMINO_AVATARS:[{id:'yuni',image:1},{id:'yoi',image:2}]},'../computer/tableTheme':{TABLE:{}}};
 for(const m of source.matchAll(/import \{([^}]+)\} from '([^']+)'/g)){if(deps[m[2]])continue;deps[m[2]]=Object.fromEntries(m[1].split(',').map(s=>s.trim()).filter(s=>!s.startsWith('type ')).map(s=>[s,s]));}
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],module,module.exports);
 let renderer;const render=()=>act(()=>{const tree=React.createElement(module.exports.OnlinePokerTable,{...props,connected,view:domain.view(room,h,1)});if(renderer)renderer.update(tree);else renderer=create(tree);});await render();
 return {renderer,sent,render,get room(){return room;},tray:()=>renderer.root.findByType('ChipRaiseTray'),controls:()=>renderer.root.findByType('RaiseControls'),async overlay(value){props.overlayOpen=value;await render();},async offline(){connected=false;await render();},async change(action){room=domain.command(room,g,action,1,random);await render();},async close(){await act(()=>renderer.unmount());}};
}
test('filtered real state: only own cards, rival backs, wood timer and opponent interactions',async()=>{const f=await mount();try{
 const rival=f.renderer.root.findByProps({testID:'poker-opponent-cards'});assert.ok(rival.findAllByType('PokerCard').every(c=>c.props.back&&c.props.card===undefined));
 const wood=f.renderer.root.findByProps({testID:'poker-online-wood'});assert.equal(wood.findAllByType('OnlineTurnTimer').length,1);assert.equal(wood.findAllByType('OnlineQuickActions').length,1);assert.equal(wood.findByType('OnlineQuickActions').props.compact,true);
 assert.equal(f.tray().props.balance,4990);assert.equal(f.sent.length,0);
}finally{await f.close();}});
test('provisional chips are local, Clear restores, Confirm sends once and reconnect discards the draft',async()=>{const f=await mount();try{
 const initial=JSON.stringify(f.room.poker);await act(()=>f.tray().props.onAdd(50));assert.equal(f.tray().props.balance,4940);assert.equal(JSON.stringify(f.room.poker),initial);assert.equal(f.sent.length,0);
 await act(()=>f.controls().props.onClear());assert.equal(f.tray().props.balance,4990);
 await act(()=>f.tray().props.onAdd(50));await act(()=>f.controls().props.onConfirm());await f.render();assert.deepEqual(f.sent,[{type:'raise',to:60}]);assert.equal(f.room.poker.stacks.human,4940);
 await f.offline();assert.equal(f.tray().props.enabled,false);assert.equal(f.tray().props.balance,4940);
}finally{await f.close();}});
test('stale selection and automatic timeout never send a provisional raise',async()=>{const f=await mount();try{
 await act(()=>f.tray().props.onAdd(50));const oldConfirm=f.controls().props.onConfirm;
 await f.offline();await act(()=>oldConfirm());assert.equal(f.sent.length,0);
}finally{await f.close();}});

test('online Settings follows share in the header and pauses local controls without losing provisional chips or sending actions',async()=>{const f=await mount();try{await act(()=>f.tray().props.onAdd(50));const before=f.tray().props.balance;await act(()=>f.renderer.root.findByProps({testID:'poker-online-settings'}).props.onPress());const settings=f.renderer.root.findByType('TableSettings');assert.equal(settings.props.visible,true);assert.equal(f.tray().props.enabled,false);assert.equal(f.tray().props.balance,before);await act(()=>settings.props.onClose());assert.equal(f.renderer.root.findByType('TableSettings').props.visible,false);assert.equal(f.tray().props.enabled,true);assert.equal(f.tray().props.balance,before);assert.equal(f.sent.length,0);}finally{await f.close();}});

test('share or code overlay suspends provisional confirmation without losing the selected raise',async()=>{const f=await mount();try{await act(()=>f.tray().props.onAdd(50,{current:null}));const value=f.controls().props.value;await f.overlay(true);assert.equal(f.controls().props.enabled,false);assert.equal(f.controls().props.value,value);assert.equal(f.sent.length,0);await f.overlay(false);assert.equal(f.controls().props.enabled,true);assert.equal(f.controls().props.value,value);assert.equal(f.sent.length,0);}finally{await f.close();}});
