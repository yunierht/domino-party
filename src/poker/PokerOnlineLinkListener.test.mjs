import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import {parsePokerInvitation} from './pokerInvitation.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function mount(initial){
 const opened=[],events=new Set();
 const nav={screen:'home',pendingPokerCode:null,openPokerOnline(code){opened.push(code);this.screen='pokerOnline';this.pendingPokerCode=code}};
 const deps={react:React,'react-native':{Platform:{OS:'android'}},'expo-linking':{getInitialURL:()=>initial,addEventListener:(_event,callback)=>{events.add(callback);return{remove:()=>events.delete(callback)}}},'../../app.json':{expo:{scheme:'dominoparty'}},'../nav/NavContext':{useNav:()=>nav},'./pokerInvitation':{parsePokerInvitation}};
 const module={exports:{}};
 const compiled=ts.transpileModule(readFileSync(new URL('./PokerOnlineLinkListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',compiled)(id=>deps[id],module,module.exports);
 let tree;await act(async()=>{tree=create(React.createElement(module.exports.PokerOnlineLinkListener))});
 return {nav,opened,emit:url=>act(()=>{for(const callback of events)callback({url})}),close:()=>act(()=>tree.unmount()),events};
}
test('Poker listener accepts cold and warm links, deduplicates active target, and isolates other games',async()=>{
 const f=await mount(Promise.resolve('dominoparty://online?pokerRoom=ABCDEF0123'));
 try{
  assert.deepEqual(f.opened,['ABCDEF0123']);
  await f.emit('dominoparty://online?pokerRoom=ABCDEF0123');assert.equal(f.opened.length,1);
  await f.emit('dominoparty://online?pokerRoom=1122334455');assert.deepEqual(f.opened,['ABCDEF0123','1122334455']);
  for(const url of ['dominoparty://watch?code=123456','dominoparty://online?onlineRoom=ABCDEF0123','dominoparty://online?pokerRoom=BAD','https://foreign.test/?pokerRoom=ABCDEF0123'])await f.emit(url);
  assert.equal(f.opened.length,2);
  // Entry consumes the pending target. A later deliberate tap may open consent again.
  f.nav.pendingPokerCode=null;await f.emit('dominoparty://online?pokerRoom=1122334455');assert.equal(f.opened.length,3);
 }finally{await f.close();assert.equal(f.events.size,0)}
});
test('a warm Poker link wins over a delayed initial URL and an unmounted listener does not navigate',async()=>{
 let resolveInitial;const f=await mount(new Promise(resolve=>resolveInitial=resolve));
 try{await f.emit('dominoparty://online?pokerRoom=1122334455');await act(async()=>resolveInitial('dominoparty://online?pokerRoom=ABCDEF0123'));assert.deepEqual(f.opened,['1122334455']);}finally{await f.close()}
 let late;const closed=await mount(new Promise(resolve=>late=resolve));await closed.close();await act(async()=>late('dominoparty://online?pokerRoom=ABCDEF0123'));assert.deepEqual(closed.opened,[]);
});
