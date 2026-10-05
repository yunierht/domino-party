import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {create,act} from 'react-test-renderer';import {readFileSync} from 'node:fs';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./ChipRaiseTray.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>({react:React,'react-native':{View:'View',Text:'Text',ScrollView:'ScrollView',Pressable:'Pressable'},'../blackjack/BettingTray':{DenominationChip:'Chip'},'../computer/tableTheme':{TABLE:{}}})[id],m,m.exports);
const {ChipRaiseTray,RaiseControls}=m.exports;function Tray(p){return React.createElement(React.Fragment,null,React.createElement(ChipRaiseTray,p),React.createElement(RaiseControls,p));}
test('raise waits three idle seconds, restarts on selection and cancels on clear, confirm, pause or exit',async()=>{
 const oldSet=setTimeout,oldClear=clearTimeout;let now=0,serial=0,confirmed=0,cleared=0,r;const jobs=new Map();
 globalThis.setTimeout=(fn,delay)=>{const id=++serial;jobs.set(id,{fn,at:now+delay});return id;};globalThis.clearTimeout=id=>jobs.delete(id);
 const props={value:40,min:40,max:100,base:20,enabled:true,es:false,onClear:()=>cleared++,onConfirm:()=>confirmed++};
 const render=async p=>act(()=>r?r.update(React.createElement(RaiseControls,p)):r=create(React.createElement(RaiseControls,p)));
 const advance=async ms=>{now+=ms;await act(()=>{for(const [id,j] of jobs)if(j.at<=now){jobs.delete(id);j.fn();}});};
 try{
  await render(props);await advance(2999);assert.equal(confirmed,0);
  await render({...props,value:60});await advance(1);assert.equal(confirmed,0);
  await render({...props,value:60,onConfirm:()=>confirmed++});await advance(2999);assert.equal(confirmed,1);await advance(3000);assert.equal(confirmed,1);
  await render({...props,value:70});await act(()=>r.root.findAllByType('Pressable')[0].props.onPress());await advance(3000);assert.equal(cleared,1);assert.equal(confirmed,1);
  await render({...props,value:80});await act(()=>r.root.findByProps({testID:'poker-confirm-raise'}).props.onPress());await advance(3000);assert.equal(confirmed,2);
  await render({...props,value:90});await render({...props,value:90,enabled:false});await advance(3000);assert.equal(confirmed,2);
  await render({...props,value:30});await advance(3000);assert.equal(confirmed,2);
  await render({...props,selectionKey:'hand-1'});await advance(2999);await render({...props,selectionKey:'hand-2'});await advance(1);assert.equal(confirmed,2);
  await act(()=>r.unmount());r=null;await advance(3000);assert.equal(confirmed,2);assert.equal(jobs.size,0);
 }finally{if(r)await act(()=>r.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
test('chip selection does not send a raise; confirm enforces minimum, cap and disabled turn',async()=>{
 let added=0,confirmed=0,r;const props={value:10,min:40,max:100,base:20,enabled:true,es:false,onAdd:n=>added+=n,onClear(){},onConfirm:()=>confirmed++};
 await act(()=>{r=create(React.createElement(Tray,props));});
 assert.equal(r.root.findByProps({testID:'poker-confirm-raise'}).props.disabled,true);assert.equal(r.root.findByProps({testID:'poker-chip-tray'}).findAllByProps({testID:'poker-confirm-raise'}).length,0);
 await act(()=>r.root.findByProps({testID:'poker-chip-20'}).props.onPress());assert.equal(added,20);assert.equal(confirmed,0);
 await act(()=>r.update(React.createElement(Tray,{...props,value:40})));await act(()=>r.root.findByProps({testID:'poker-confirm-raise'}).props.onPress());assert.equal(confirmed,1);
 await act(()=>r.update(React.createElement(Tray,{...props,value:90})));assert.equal(r.root.findByProps({testID:'poker-chip-20'}).props.disabled,true);
 await act(()=>r.update(React.createElement(Tray,{...props,value:40,enabled:false})));await act(()=>r.root.findByProps({testID:'poker-confirm-raise'}).props.onPress());assert.equal(confirmed,1);await act(()=>r.unmount());
});
test('tray offers the same six denominations as Blackjack including 1000',async()=>{
 let r;await act(()=>{r=create(React.createElement(ChipRaiseTray,{value:0,max:2000,enabled:true,onAdd(){}}));});
 assert.deepEqual(r.root.findAllByType('Pressable').map(n=>n.props.accessibilityLabel),['10','20','50','100','500','1000']);
 assert.equal(r.root.findByProps({testID:'poker-chip-1000'}).props.disabled,false);await act(()=>r.unmount());
});
