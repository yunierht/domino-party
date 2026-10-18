import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
const secret=()=>crypto.randomUUID().replaceAll('-','').repeat(2);
test('offline acceptance survives HTTP and SQLite restart, and starts only after explicit host confirmation',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-host-return-'));let mf=await runtime(directory);
 try{
 const h=secret(),g=secret();
 const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni',hostReturn:true}});assert.equal(created.status,201);
 const path='/rooms/'+created.body.code;
 assert.equal((await send(mf,'POST',path+'/disconnect',h,{})).status,200);
 const accept={name:'Chuchi',avatar:'rafael',acceptInvitation:true};
 const pending=await send(mf,'POST',path+'/join',g,accept);assert.equal(pending.status,200);assert.equal(pending.body.phase,'waiting');assert.equal(pending.body.hand.length,0);assert.deepEqual(pending.body.lobbyReady,['computer']);
 await mf.dispose();mf=await runtime(directory);
 const host=await send(mf,'GET',path,h);assert.equal(host.body.names.computer,'Chuchi');assert.equal(host.body.phase,'waiting');
 assert.deepEqual(await send(mf,'POST',path+'/join',g,accept),pending);
 assert.equal((await send(mf,'POST',path+'/heartbeat',h,{})).body.phase,'waiting');
 assert.equal((await send(mf,'POST',path+'/heartbeat',g,{})).body.phase,'waiting');
 async function command(token,type){const v=(await send(mf,'GET',path,token)).body;return send(mf,'POST',path+'/commands',token,{commandId:secret(),epoch:v.epoch,revision:v.revision,round:v.round,type});}
 assert.equal((await command(g,'approve')).body.error,'host_only');
 assert.equal((await command(h,'approve')).body.phase,'waiting');
 const playing=await command(h,'ready');assert.equal(playing.status,200);assert.equal(playing.body.phase,'playing');assert.equal(playing.body.hand.length,7);
 assert.equal((await command(h,'leave')).body.phase,'closed');assert.equal((await send(mf,'GET',path,g)).body.phase,'closed');
 const invalid=await send(mf,'POST','/rooms',secret(),{name:'Bad',invitation:{avatar:'yuni',hostReturn:'yes'}});assert.equal(invalid.status,400);
 }finally{await mf.dispose();}
});
async function runtime(persist, testClass = false) {
  return new Miniflare({ ...convertV4MiniflareOptions({ name: 'domino-online-test', modules: true, script: await readFile(testClass ? '.local/worker-test.mjs' : '.local/worker.mjs', 'utf8'),
    compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'],
    bindings: { LOCAL_ONLY: 'true' }, durableObjects: { ROOMS: { className: testClass ? 'TestDominoRoom' : 'DominoRoom', useSQLite: true }, MANUAL_CODES:{className:'ManualCodes',useSQLite:true} },
    }), resourcePersistencePath: persist, isolatedResourcePersistencePath: persist });
}
async function send(mf, method, path, token, body) {
  const response = await mf.dispatchFetch(`http://localhost${path}`, { method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}
