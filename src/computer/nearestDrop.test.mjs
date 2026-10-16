import {readFileSync} from 'node:fs';import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
import { chainMetrics, chainSlot, endpointOffsets, screenToBoard, resolveDrop, resolveScreenDrop } from './boardLayout.ts';
import { deal, legalEnds, play } from './engine.ts';

test('a tile legal on both ends follows the release position through camera scale and translation',()=>{
 const m=chainMetrics(2048,4096),viewport={width:350,height:300};
 const tile={id:'2-5',a:2,b:5};
 const game={...deal('Player',100),turn:'human',board:[{id:'2-2',a:2,b:2},{id:'2-3',a:2,b:3},{id:'3-5',a:3,b:5}],openingId:'2-2',hands:{human:[tile,{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]}};
 const ends=legalEnds(game,'human',tile);assert.deepEqual(ends,['left','right']);
 const offsets=endpointOffsets(game.board,game.openingId);
 const targets=ends.map(end=>({end,point:chainSlot(offsets[end],m,game.board,game.openingId)}));
 for(const camera of [{x:0,y:0,scale:1},{x:37,y:-55,scale:0.43},{x:-80,y:61,scale:0.8}]) for(const target of targets) {
  const boardPoint={x:target.point.x+9,y:target.point.y-6};
  // Same viewport coordinates produced after subtracting measureInWindow origin and page scroll.
  const screen={x:viewport.width/2+camera.x+(boardPoint.x-m.width/2)*camera.scale,y:viewport.height/2+camera.y+(boardPoint.y-m.height/2)*camera.scale};
  const release=screenToBoard(screen,viewport,m,camera);
  const chosen=resolveDrop(release,[...targets].reverse(),m);assert.equal(chosen,target.end);
  const next=play(game,'human',tile.id,chosen);assert.equal(next.board.length,4);
  assert.equal(chosen==='left'?next.board[0].id:next.board.at(-1).id,tile.id);
 }
 assert.equal(resolveDrop({x:-100,y:-100},targets,m),null);
 assert.equal(resolveDrop(targets[0].point,[targets[1]],m),'right');
});

test('single legal end accepts releases near the illegal end and between ends, only inside the viewport',()=>{
 const canvas=chainMetrics(2048,4096),viewport={width:350,height:300};
 for(const camera of [{x:0,y:0,scale:1},{x:30,y:-20,scale:0.4}]) {
  const targets=[{end:'right',point:screenToBoard({x:300,y:100},viewport,canvas,camera)}];
  for(const point of [{x:25,y:100},{x:175,y:150},{x:340,y:280}]) assert.equal(resolveScreenDrop(point,targets,viewport,canvas,camera),'right');
  for(const point of [{x:-1,y:100},{x:351,y:100},{x:100,y:-1},{x:100,y:301}]) assert.equal(resolveScreenDrop(point,targets,viewport,canvas,camera),null);
  assert.equal(resolveScreenDrop({x:100,y:100},[],viewport,canvas,camera),null);
 }
});

test('overlapping valid zones use actual distance with a deterministic tie, not target order',()=>{
 const m={width:300,height:300};
 const targets=[{end:'right',point:{x:120,y:100}},{end:'left',point:{x:80,y:100}}];
 assert.equal(resolveDrop({x:89,y:110},targets,m),'left');
 assert.equal(resolveDrop({x:113,y:110},targets,m),'right');
 assert.equal(resolveDrop({x:100,y:100},targets,m),'left');
 assert.equal(resolveDrop({x:100,y:100},[...targets].reverse(),m),'left');
 // Inside one corner but closer to the other center: do not rank only rectangle hits.
 assert.equal(resolveDrop({x:119,y:139},[{end:'left',point:{x:80,y:100}},{end:'right',point:{x:120,y:180}}],m),'right');
 assert.equal(resolveDrop({x:100,y:160},targets,m),'left');
});

test('intentional release can snap outside the viewport while hover keeps its existing bounds',()=>{const canvas=chainMetrics(2048,4096),viewport={width:350,height:300},camera={x:30,y:-20,scale:.4};const targets=[{end:'left',point:screenToBoard({x:70,y:90},viewport,canvas,camera)},{end:'right',point:screenToBoard({x:280,y:120},viewport,canvas,camera)}];for(const [point,end]of [[{x:-100,y:90},'left'],[{x:800,y:120},'right'],[{x:270,y:900},'right']]){assert.equal(resolveScreenDrop(point,targets,viewport,canvas,camera,true),end);assert.equal(resolveScreenDrop(point,targets,viewport,canvas,camera),null);}assert.equal(resolveScreenDrop({x:NaN,y:90},targets,viewport,canvas,camera,true),null);assert.equal(resolveScreenDrop({x:-100,y:90},[],viewport,canvas,camera,true),null);});

test('CPU production drop callback snaps outside, rejects cancelled and illegal tiles and sends once',()=>{const source=readFileSync(new URL('../screens/ComputerGameScreen.tsx',import.meta.url),'utf8'),ast=ts.createSourceFile('screen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let body;function walk(n){if(ts.isJsxAttribute(n)&&n.name.text==='onDrop'&&n.parent.parent.tagName?.getText(ast)==='DraggableDomino')body=n.initializer.expression.getText(ast);ts.forEachChild(n,walk);}walk(ast);assert.ok(body);const tile={id:'2-5',a:2,b:5},game={...deal('Player',100),turn:'human',board:[{id:'2-2',a:2,b:2},{id:'2-3',a:2,b:3},{id:'3-5',a:3,b:5}],openingId:'2-2',hands:{human:[tile,{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]}};const metrics=chainMetrics(2048,4096),offsets=endpointOffsets(game.board,game.openingId),dragId={current:tile.id},commands=[],tableOrigin={current:{x:100,y:200}};const cancelDrag=()=>{dragId.current=null;},ctx={enabled:true,tile,cancelDrag,tableOrigin,dragId,legalEnds,game,slot:(offset,m)=>chainSlot(offset,m,game.board,game.openingId),offsets,metrics,tableSize:{width:350,height:300},camera:{current:{current:{x:0,y:0,scale:.4}}},resolveScreenDrop,place:(id,end)=>{commands.push({id,end});cancelDrag();}};const make=patch=>{const values={...ctx,...patch};return new Function(...Object.keys(values),'return '+body)(...Object.values(values));};const drop=make({});drop({x:-100,y:300});drop({x:-100,y:300});assert.deepEqual(commands,[{id:tile.id,end:'left'}]);dragId.current=tile.id;make({enabled:false})({x:1000,y:300});assert.equal(commands.length,1);dragId.current='0-0';make({tile:{id:'0-0',a:0,b:0}})({x:1000,y:300});assert.equal(commands.length,1);dragId.current=tile.id;drop({x:1000,y:300});assert.deepEqual(commands.at(-1),{id:tile.id,end:'right'});});
