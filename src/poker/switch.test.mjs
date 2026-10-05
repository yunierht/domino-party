import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('switch confirmation can cancel and preserves poker state both ways',async()=>{
 const navigation=[];
 const deps={react:React,'react-native':{Modal:'Modal',Pressable:'Pressable',Text:'Text',View:'View'},'../nav/NavContext':{useNav:()=>({go:route=>navigation.push(route)})},'../computer/tableTheme':{TABLE:{}},'../i18n/I18nContext':{useI18n:()=>({lang:'en'})}};
 const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./TableGameContext.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(id=>deps[id],m,m.exports);
 let state;function Probe(){state=m.exports.useTableGame();return null;}let renderer;
 await act(()=>{renderer=create(React.createElement(m.exports.TableGameProvider,null,React.createElement(Probe)));});
 const poker={hand:3,stacks:{human:850,computer:1150}};await act(()=>{state.setPoker(poker);state.requestSwitch('poker');});assert.equal(state.mode,'domino');
 const button=label=>renderer.root.findAllByType('Pressable').find(p=>p.findAllByType('Text').some(t=>t.props.children===label));
 await act(()=>button('Cancel').props.onPress());assert.equal(state.mode,'domino');assert.equal(state.switchTarget,null);
 await act(()=>state.requestSwitch('poker'));await act(()=>button('Switch').props.onPress());assert.equal(state.mode,'poker');assert.equal(state.poker,poker);
 await act(()=>state.requestSwitch('domino'));await act(()=>button('Switch').props.onPress());assert.equal(state.mode,'domino');assert.equal(state.poker,poker);
 await act(()=>state.requestSwitch('blackjack'));await act(()=>button('Cancel').props.onPress());assert.deepEqual(navigation,[]);
 await act(()=>state.requestSwitch('blackjack'));await act(()=>button('Switch').props.onPress());assert.deepEqual(navigation,['blackjackTable']);assert.equal(state.poker,poker);
 await act(()=>renderer.unmount());
});
