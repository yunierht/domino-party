import test from 'node:test';import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('browser-compatible upgrade authenticates members and broadcasts private boards after HTTP commands',async()=>{
 const script=buildSync({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers'],target:'es2022'}).outputFiles[0].text;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'browser-socket',modules:true,script,compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_ONLY:'true'},durableObjects:{ROOMS:{className:'DominoRoom',useSQLite:true},MANUAL_CODES:{className:'ManualCodes',useSQLite:true}}}));
 const h='a'.repeat(64),g='b'.repeat(64),sockets=[];
 async function call(token,path,data){const r=await mf.dispatchFetch('http://localhost'+path,{method:data===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return{status:r.status,view:await r.json()};}
 async function connect(path,token){const r=await mf.dispatchFetch('http://localhost'+path+'/socket',{headers:{upgrade:'websocket','sec-websocket-protocol':'domino.v1, domino-auth.'+token,origin:'http://localhost'}});return r;}
 async function waitFor(predicate){const until=Date.now()+2000;while(!predicate()){if(Date.now()>until)throw Error('socket event timeout');await new Promise(r=>setTimeout(r,5));}}
 try{
  const created=await call(h,'/rooms',{name:'Ana',invitation:{avatar:'yuni'}});assert.equal(created.status,201);const path='/rooms/'+created.view.code;
  const joined=await call(g,path+'/join',{name:'Luis',avatar:'rafael',acceptInvitation:true});assert.equal(joined.status,200);
  assert.equal((await connect(path,'c'.repeat(64))).status,401);
  const frames=[[],[]];
  for(const [i,token] of [h,g].entries()){
   const r=await connect(path,token);assert.equal(r.status,101,'browser needs protocol-header authentication');assert.equal(r.headers.get('sec-websocket-protocol'),'domino.v1');assert.equal(JSON.stringify([...r.headers]).includes(token),false);
   const ws=r.webSocket;ws.addEventListener('message',e=>frames[i].push(JSON.parse(e.data).view));ws.accept();sockets.push(ws);
  }
  await waitFor(()=>frames.every(f=>f.length));
  const views=frames.map(f=>f.at(-1)),actor=views[0].turn==='human'?0:1,v=views[actor],move=v.legalMoves[0];assert.ok(move);
  const ack=await call(actor===0?h:g,path+'/commands',{commandId:'socket-play',epoch:v.epoch,revision:v.revision,round:v.round,type:'play',tileId:move.tileId,end:move.ends[0]});assert.equal(ack.status,200);
  await waitFor(()=>frames.every(f=>f.at(-1).revision>=ack.view.revision));
  const [hv,gv]=frames.map(f=>f.at(-1));assert.deepEqual(hv.board,gv.board);assert.equal(hv.board.length,1);assert.ok(hv.hand.every(t=>!gv.hand.some(x=>x.id===t.id)));assert.equal(hv.seat,'human');assert.equal(gv.seat,'computer');
  const before=frames[0].length;sockets[0].send(JSON.stringify({type:'heartbeat'}));await waitFor(()=>frames[0].length>before);
 }finally{for(const s of sockets)try{s.close();}catch{}await mf.dispose();}
});
