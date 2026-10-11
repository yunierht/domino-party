import test from 'node:test';
import assert from 'node:assert/strict';
import { chainMetrics, chainBounds, fitBoardCamera, resizedBoardCamera, reconcileBoardCamera, screenToBoard, chainSlot, endpointOffsets, resolveDrop } from './boardLayout.ts';
const m=chainMetrics(2048,4096);
const deck=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)deck.push({id:`${a}-${b}`,a,b});
function assertFits(b,v,c){
  const left=v.width/2+c.x+(b.left-m.width/2)*c.scale;
  const right=v.width/2+c.x+(b.right-m.width/2)*c.scale;
  const top=v.height/2+c.y+(b.top-m.height/2)*c.scale;
  const bottom=v.height/2+c.y+(b.bottom-m.height/2)*c.scale;
  assert.ok(left>=5 && right<=v.width-5 && top>=5 && bottom<=v.height-5,JSON.stringify({b,v,c,left,right,top,bottom}));
}
test('all 1–28 tile chains, every opening anchor, doubles and both ends fit mobile and landscape',()=>{
 for(const v of [{width:296,height:220},{width:366,height:350},{width:700,height:90}])for(let n=1;n<=28;n++)for(let a=0;a<n;a++){
 const b=chainBounds(deck.slice(0,n),deck[a].id,m);const c=fitBoardCamera(b,v,m,{x:0,y:0,scale:1},true);assertFits(b,v,c);assert.ok(c.scale>0&&c.scale<=1);
 }
});
test('growth on alternating ends keeps complete tiles visible without increasing zoom',()=>{
 const v={width:296,height:220};let board=[deck[14]],c={x:0,y:0,scale:1};
 for(let n=0;n<deck.length;n++){if(n===14)continue;board=n%2?[deck[n],...board]:[...board,deck[n]];const b=chainBounds(board,deck[14].id,m);const next=fitBoardCamera(b,v,m,c);assertFits(b,v,next);assert.ok(next.scale<=c.scale);c=next;}
 const empty=fitBoardCamera(chainBounds([],null,m),v,m,c,true);assert.equal(empty.scale,1);assert.equal(Math.abs(empty.x),0);assert.equal(Math.abs(empty.y),0);
});
test('asymmetric chain centers on its actual bounds and repeated fit is stable',()=>{
 const v={width:366,height:300},b=chainBounds(deck.slice(0,20),deck[0].id,m);const c=fitBoardCamera(b,v,m,{x:0,y:0,scale:1},true);
 assert.notEqual(c.y,0);assert.deepEqual(fitBoardCamera(b,v,m,c),c);
 const rotated={width:700,height:160};assertFits(b,rotated,fitBoardCamera(b,rotated,m,c,true));
});
test('screen coordinates inverse camera scale/pan and resolve the correct drag endpoint',()=>{
 const board=deck.slice(0,25),v={width:296,height:220},opening=deck[12].id;
 const c=fitBoardCamera(chainBounds(board,opening,m),v,m,{x:0,y:0,scale:1},true), offsets=endpointOffsets(board,opening);
 const targets=['left','right'].map(end=>({end,point:chainSlot(offsets[end],m,board,opening)}));
 for(const t of targets){const screen={x:v.width/2+c.x+(t.point.x-m.width/2)*c.scale,y:v.height/2+c.y+(t.point.y-m.height/2)*c.scale};const p=screenToBoard(screen,v,m,c);assert.ok(Math.abs(p.x-t.point.x)<1e-8);assert.equal(resolveDrop(p,targets,m),t.end);}
});

test('visible asymmetric growth preserves the camera even far from the chain center',()=>{
 const v={width:700,height:350};const initial=chainBounds(deck.slice(0,1),deck[0].id,m);
 const current=fitBoardCamera(initial,v,m,{x:0,y:0,scale:1},true);
 let checked=0;for(let n=2;n<=5;n++){
  const bounds=chainBounds(deck.slice(0,n),deck[0].id,m);assertFits(bounds,v,current);
  assert.deepEqual(fitBoardCamera(bounds,v,m,current),current);checked++;
 }
 assert.equal(checked,4);
});

test('overflow pans only far enough to restore the margin instead of centering the chain',()=>{
 const v={width:366,height:350},bounds={left:980,right:1210,top:2010,bottom:2086},current={x:0,y:0,scale:1};
 const next=fitBoardCamera(bounds,v,m,current);
 const margin=6;
 assert.ok(Math.abs(next.x+ (183+(1210-1024)-(366-margin)))<1e-8);
 assert.equal(next.y,0);assert.equal(next.scale,1);assertFits(bounds,v,next);
});

test('hand row resize preserves existing screen-space tile centers',()=>{
 const before={width:366,height:350},after={width:366,height:420},camera={x:12,y:-20,scale:.8};
 const adjusted=resizedBoardCamera(camera,before,after),board=deck.slice(0,2),bounds=chainBounds(board,deck[0].id,m);
 const fitted=fitBoardCamera(bounds,after,m,adjusted);
 assert.deepEqual(fitted,adjusted);
 for(const offset of [0,1]){const p=chainSlot(offset,m,board,deck[0].id);
 assert.equal(before.height/2+camera.y+(p.y-m.height/2)*camera.scale,after.height/2+fitted.y+(p.y-m.height/2)*fitted.scale);}
});

test('freeing hand space preserves the fitted zoom and screen positions',()=>{
 const large={width:366,height:270},small={width:366,height:120},b=chainBounds(deck,deck[14].id,m);
 const initial=fitBoardCamera(b,large,m,{x:0,y:0,scale:1},true);
 const compact=reconcileBoardCamera(b,small,m,resizedBoardCamera(initial,large,small),large,false);
 assertFits(b,small,compact);assert.ok(compact.scale<initial.scale);
 const restored=reconcileBoardCamera(b,large,m,resizedBoardCamera(compact,small,large),small,false);
 assertFits(b,large,restored);assert.equal(restored.scale,compact.scale);assert.equal(small.height/2+compact.y,large.height/2+restored.y);
 assert.strictEqual(reconcileBoardCamera(b,large,m,restored,large,false),restored,'settled frame does not oscillate');
});
test('space changes preserve manual framing and adequate automatic frames',()=>{
 const before={width:700,height:350},after={width:700,height:420},b=chainBounds(deck.slice(0,2),deck[0].id,m),manual={x:12,y:-20,scale:.8};
 const adjusted=resizedBoardCamera(manual,before,after);
 assert.strictEqual(reconcileBoardCamera(b,after,m,adjusted,before,true),adjusted);
 const jitter={width:700.5,height:350.5},normal=fitBoardCamera(b,before,m,{x:0,y:0,scale:1},true),same=resizedBoardCamera(normal,before,jitter);
 assert.strictEqual(reconcileBoardCamera(b,jitter,m,same,before,false),same);
});
test('rotation fits only if needed and growing chains remain still when adequate',()=>{
 const portrait={width:366,height:220},landscape={width:700,height:160},b=chainBounds(deck,deck[14].id,m);
 const p=fitBoardCamera(b,portrait,m,{x:0,y:0,scale:1},true);
 const l=reconcileBoardCamera(b,landscape,m,resizedBoardCamera(p,portrait,landscape),portrait,false);assertFits(b,landscape,l);
 const restored=reconcileBoardCamera(b,portrait,m,resizedBoardCamera(l,landscape,portrait),landscape,false);assertFits(b,portrait,restored);assert.ok(restored.scale<=l.scale);
 const view={width:700,height:350},short=fitBoardCamera(chainBounds(deck.slice(0,1),deck[0].id,m),view,m,{x:0,y:0,scale:1},true);
 assert.strictEqual(reconcileBoardCamera(chainBounds(deck.slice(0,3),deck[0].id,m),view,m,short,view,false),short);
});

test('actual opening centers and contained additions retain placed coordinates, including doubles and either end',()=>{for(const opening of [deck[0],deck[1],deck[27]])for(const side of ['left','right']){const v={width:700,height:700};let board=[opening],camera=fitBoardCamera(chainBounds(board,opening.id,m,false),v,m,{x:0,y:0,scale:1},true);assert.equal(camera.x,0);assert.equal(camera.y,0);assert.equal(camera.scale,1);for(const tile of deck.filter(t=>t.id!==opening.id).slice(0,5)){const old=board.map(t=>({id:t.id,p:chainSlot(board.indexOf(t)-board.findIndex(t=>t.id===opening.id),m,board,opening.id)}));board=side==='left'?[tile,...board]:[...board,tile];const b=chainBounds(board,opening.id,m,false),next=fitBoardCamera(b,v,m,camera);assert.strictEqual(next,camera);for(const entry of old){const p=chainSlot(board.findIndex(t=>t.id===entry.id)-board.findIndex(t=>t.id===opening.id),m,board,opening.id);assert.deepEqual(p,entry.p);}assertFits(b,v,next);camera=next;}}});
test('a newly placed tile at either border gets the nearest translation without unnecessary zoom',()=>{const v={width:300,height:400};for(const sign of [-1,1]){const b={left:1024+(sign<0?-180:-30),right:1024+(sign<0?30:180),top:2028,bottom:2068},camera={x:0,y:0,scale:1},next=fitBoardCamera(b,v,m,camera);assert.equal(next.x,sign<0?36:-36);assert.equal(next.y,0);assert.equal(next.scale,1);assertFits(b,v,next);assert.strictEqual(fitBoardCamera(b,v,m,next),next);}});
