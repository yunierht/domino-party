import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps={}){const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(id=>deps[id],m,m.exports);return m.exports;}
const engine=load('./engine.ts');
const {usePresentedTurn}=load('./usePresentedTurn.ts',{react:React,'./engine':engine});
const initial=()=>({...engine.deal('Player',100,()=>.4),openingRule:'winner',turn:'human',hands:{human:[{id:'6-6',a:6,b:6},{id:'5-6',a:5,b:6}],computer:[{id:'3-6',a:3,b:6},{id:'2-6',a:2,b:6}]}});
async function mount(g){let value;let props={game:g,paused:false,opponentId:'rigo'};let draws=0;
 const setGame=fn=>{props={...props,game:fn(props.game)};};const onDraw=()=>draws++;
 function Probe(){value=usePresentedTurn({...props,setGame,onDraw});return null;}
 let r;await act(()=>{r=create(React.createElement(Probe));});
 return {get value(){return value;},get game(){return props.game;},get draws(){return draws;},async update(p={}){props={...props,...p};await act(()=>r.update(React.createElement(Probe)));},async close(){await act(()=>r.unmount());}};
}
test('slow human landing gates rival indefinitely, then provides a visible gap; human waits for rival landing',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const base=initial(),g=engine.play(base,'human','6-6','right');const h=await mount(g);
 await act(()=>t.mock.timers.tick(10000));assert.equal(h.game,g);assert.equal(h.value.presented,false);
 await act(()=>h.value.onPresented(g.board));await act(()=>t.mock.timers.tick(849));assert.equal(h.game,g);
 await act(()=>t.mock.timers.tick(1));assert.equal(h.game.board.length,2);await h.update();assert.equal(h.value.presented,false);
 await act(()=>h.value.onPresented(h.game.board));assert.equal(h.value.presented,true);await h.close();
});
for(const change of ['pause','opponent','reset','finished','unmount'])test(`pending rival cancels on ${change}; stale completion cannot release a new board`,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const g=engine.play(initial(),'human','6-6','right'),h=await mount(g);
 await act(()=>h.value.onPresented(g.board));await act(()=>t.mock.timers.tick(400));
 if(change==='unmount')await h.close();
 else await h.update(change==='pause'?{paused:true}:change==='opponent'?{opponentId:'yoi'}:change==='finished'?{game:{...g,result:{winner:'human',points:1,blocked:false}}}:{game:initial()});
 const now=h.game;await act(()=>t.mock.timers.tick(450));assert.equal(h.game,now);
 if(change!=='unmount'){await h.update({game:initial(),paused:false});await act(()=>h.value.onPresented(g.board));await act(()=>t.mock.timers.tick(1000));assert.equal(h.game.board.length,0);await h.close();}
});
test('double tap cannot play twice after human turn has changed',()=>{const g=engine.play(initial(),'human','6-6','right');assert.equal(engine.play(g,'human','5-6','right'),g);});
test('opening has no landing to await; draws wait for a visible board and open stock once',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const h=await mount({...initial(),turn:'computer'});
 await act(()=>t.mock.timers.tick(850));assert.equal(h.game.board.length,1);await h.close();
 const g=engine.play(initial(),'human','6-6','right');g.hands.computer=[{id:'1-1',a:1,b:1}];const b=await mount(g);
 await act(()=>t.mock.timers.tick(3000));assert.equal(b.draws,0);
 await act(()=>b.value.onPresented(g.board));await act(()=>t.mock.timers.tick(850));assert.equal(b.draws,1);
 await b.update({paused:true});await act(()=>t.mock.timers.tick(3000));assert.equal(b.draws,1);await b.close();
});
