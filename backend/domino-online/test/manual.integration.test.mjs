import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('manual alias is atomic, persistent, bounded, expiring and resolves only the original canonical invitation',async()=>{
 const persist=await mkdtemp(join(tmpdir(),'domino-manual-')),script=await readFile('.local/worker-test.mjs','utf8');
 const runtime=()=>new Miniflare({...convertV4MiniflareOptions({name:'manual-test',modules:true,script,compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_ONLY:'true'},durableObjects:{ROOMS:{className:'TestDominoRoom',useSQLite:true},MANUAL_CODES:{className:'TestManualCodes',useSQLite:true}}}),resourcePersistencePath:persist,isolatedResourcePersistencePath:persist});let mf=runtime();
 async function send(path,token,data){const r=await mf.dispatchFetch('http://localhost'+path,{method:data===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return{status:r.status,body:await r.json()};}
 const h='a'.repeat(64),g='b'.repeat(64),other='c'.repeat(64),create={name:'Ana',invitation:{avatar:'yuni'}};
 try{
  const [first,retry]=await Promise.all([send('/rooms',h,create),send('/rooms',h,create)]);assert.equal(first.body.manualCode,'000007');assert.equal(retry.body.manualCode,'000007');assert.equal(first.body.code.length,10);
  const canonical='/rooms/'+first.body.code;await mf.dispose();mf=runtime();assert.equal((await send(canonical,h)).body.manualCode,'000007');
  assert.equal((await send('/manual/000007/join',g,{name:'Luis'})).body.error,'invitation_acceptance_required');
  const accepted=await send('/manual/000007/join',g,{name:'Luis',avatar:'rafael',acceptInvitation:true});assert.equal(accepted.status,200);assert.equal(accepted.body.code,first.body.code);
  assert.equal((await send(canonical,other)).status,401,'six digits never grant member authority');
  assert.equal((await send('/rooms',other,create)).body.error,'manual_code_capacity','forced collisions do not overwrite another room');
  const ns=await mf.getDurableObjectNamespace('MANUAL_CODES');await ns.get(ns.idFromName('manual-v1')).expireForTest('000007');
  assert.equal((await send('/manual/000007/join',g,{name:'Luis',acceptInvitation:true,avatar:'rafael'})).status,404);assert.equal((await send(canonical,g)).status,200,'canonical membership survives alias expiry');
  assert.equal((await send('/rooms',h,create)).body.manualCode,'000007','expired alias renews only for the same room');
  for(let n=0;n<12;n++)assert.equal((await send('/manual/000008/join',other,{name:'No'})).status,404);
  assert.equal((await send('/manual/000008/join',other,{name:'No'})).status,429,'invalid guesses consume the rate budget');
  const registry=ns.get(ns.idFromName('manual-v1'));await registry.exhaustForTest('global',300);const rows=await registry.attemptRowsForTest();
  assert.equal((await send('/manual/000008/join','d'.repeat(64),{name:'No'})).status,429);assert.equal(await registry.attemptRowsForTest(),rows,'fresh credentials cannot grow the rate table after global exhaustion');
  await registry.exhaustForTest('allocate:global',60);assert.equal((await send('/rooms','e'.repeat(64),create)).status,429,'new alias allocation is bounded globally');
 }finally{await mf.dispose();}
});
