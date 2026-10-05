import test from 'node:test';
import assert from 'node:assert/strict';
import { chainMetrics, chainBounds, fitBoardCamera, resizedBoardCamera, screenToBoard, chainSlot, endpointOffsets, resolveDrop } from './boardLayout.ts';
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
 const margin=Math.min(22,Math.min(v.width,v.height)*.06);
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
