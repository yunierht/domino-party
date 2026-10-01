import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import {deal,legalEnds,play} from './engine.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
for(const sound of [false,true]) for(const gesture of ['tap','drag','accessibility','keyboard','confirm']) test(`last legal tile: ${gesture}, sound=${sound}`,async()=>{
 let handlers;let sounds=0;const deps={react:React,'react-native':{View:'View',Platform:{OS:'android'},PanResponder:{create:h=>{handlers=h;return{panHandlers:{}};}}},'./DominoTile':{DominoTile:()=>React.createElement('Tile')},'../state/PrefsContext':{usePrefs:()=>({vibration:false,matchingTiles:true,tileSound:sound})},'expo-haptics':{},'../sound/sounds':{playTileMove:()=>sounds++}};
 const mod={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./DraggableDomino.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(id=>deps[id],mod,mod.exports);
 const tile={id:'3-6',a:3,b:6};let game={...deal('Player',100),turn:'human',board:[{id:'6-3',a:6,b:3}],openingId:'6-3',hands:{human:[tile],computer:[{id:'0-1',a:0,b:1}]},result:null};
 if(gesture==='confirm')game.hands.human.push({id:'0-0',a:0,b:0});
 const ends=legalEnds(game,'human',tile);assert.equal(ends.length,2);
 const left=play(game,'human',tile.id,'left'),right=play(game,'human',tile.id,'right');assert.deepEqual(left.result,right.result);assert.deepEqual(left.scores,right.scores);assert.deepEqual(left.wins,right.wins);
 let selected=null,dragged=0,dropped=0;const place=(id,end)=>{game=play(game,'human',id,end);};
 // Execute the production screen's exact tap handler, not a reimplementation.
 const screen=readFileSync(new URL('../screens/ComputerGameScreen.tsx',import.meta.url),'utf8');const body=screen.match(/onTap=\{(\(\) => \{ if \(enabled\).*?)\} onCancel=\{cancelDrag\}/)[1];
 const onTap=new Function('enabled','ends','game','place','tile','setSelected','return '+body)(true,ends,game,place,tile,v=>selected=v);
 let r;await act(()=>{r=create(React.createElement(mod.exports.DraggableDomino,{tile,enabled:true,selected:false,revealed:false,onTap,onCancel:()=>{},onDrag:()=>dragged++,onDrop:()=>{dropped++;place(tile.id,'right');}}));});
 assert.equal(r.root.findAllByType('View')[0].props.pointerEvents,'auto');assert.equal(handlers.onStartShouldSetPanResponder(),true);
 assert.equal(sounds,0,'rendering must stay silent');
 if(gesture==='tap'||gesture==='drag'){
 await act(()=>handlers.onPanResponderGrant({nativeEvent:{pageX:100,pageY:600}}));
 if(gesture==='drag')await act(()=>handlers.onPanResponderMove({}, {dx:30,dy:-300,moveX:130,moveY:300}));
 await act(()=>handlers.onPanResponderRelease({}, {moveX:130,moveY:300}));
 }else{const view=r.root.findAllByType('View')[0];await act(()=>gesture==='accessibility'?view.props.onAccessibilityTap():view.props.onKeyDown({key:'Enter',preventDefault(){}}));}
 assert.equal(sounds,0,'selection stays silent; the board owns the one landing sound');
 if(gesture==='confirm'){assert.equal(selected,tile.id);place(tile.id,'right');assert.equal(sounds,0,'confirming the selected tile adds no tic');assert.equal(game.hands.human.length,1);assert.equal(game.result,null);}else{assert.equal(game.hands.human.length,0);assert.equal(game.result.winner,'human');}assert.equal(game.last.tile.id,tile.id);if(gesture!=='confirm')assert.equal(selected,null);if(gesture==='tap'||gesture==='drag')assert.ok(dragged>0);assert.equal(dropped,gesture==='drag'?1:0);
 await act(()=>r.unmount());
});
