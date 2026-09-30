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
