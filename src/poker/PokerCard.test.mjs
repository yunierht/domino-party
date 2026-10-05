import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function setup(){
 const rn={View:'View'};
 const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./PokerCard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(id=>({react:React,'react-native':rn,'../blackjack/ClassicPlayingCard':{ClassicPlayingCard:'PlayingCard'}})[id],m,m.exports);
 return {Card:m.exports.PokerCard};
}
test('community placeholder remains below flight until actual completed landing',async()=>{
 const h=setup();let r;await act(()=>{r=create(React.createElement(h.Card,{slot:true,animate:true,width:60,card:{rank:11,suit:'h'}}));});
 assert.equal(r.root.findAllByProps({testID:'poker-card-placeholder'}).length,1);
 await act(()=>r.root.findAllByType('PlayingCard').find(c=>c.props.card).props.onLanded());
 assert.equal(r.root.findAllByProps({testID:'poker-card-placeholder'}).length,0);await act(()=>r.unmount());
});
test('only winners get a static dot, with reserved space and no layout change',async()=>{
 const h=setup();let r;const card={rank:14,suit:'s'};await act(()=>{r=create(React.createElement(h.Card,{card,width:38,winning:false}));});
 assert.equal(r.root.findAllByProps({testID:'poker-winning-dot'}).length,0);const height=r.root.findAllByType('View')[0].props.style.height;
 await act(()=>r.update(React.createElement(h.Card,{card,width:38,winning:true,winnerLabel:'Carta ganadora'})));
 const dot=r.root.findByProps({testID:'poker-winning-dot'});assert.equal(dot.props.accessibilityLabel,'Carta ganadora');
 assert.ok(dot.props.style.top+dot.props.style.height<=height);assert.equal(r.root.findAllByType('View')[0].props.style.height,height);
 await act(()=>r.update(React.createElement(h.Card,{card,width:38,winning:false})));assert.equal(r.root.findAllByProps({testID:'poker-winning-dot'}).length,0);await act(()=>r.unmount());
});
test('hidden cards cannot expose a winner; revealed winners get a dot without animation APIs',async()=>{
 const h=setup();let r;await act(()=>{r=create(React.createElement(h.Card,{card:{rank:14,suit:'s'},winning:true,back:true}));});assert.equal(r.root.findAllByProps({testID:'poker-winning-dot'}).length,0);
 await act(()=>r.update(React.createElement(h.Card,{card:{rank:14,suit:'s'},winning:true})));assert.equal(r.root.findAllByProps({testID:'poker-winning-dot'}).length,1);await act(()=>r.unmount());
});
