import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from '../../domino-online/node_modules/esbuild/lib/main.js';
import {Miniflare,convertV4MiniflareOptions} from '../../domino-online/node_modules/miniflare/dist/src/index.js';

// Instrument only this test bundle. Every counted call still executes real DO RPC and SQLite.
function measuredWorker(){
 const compiled=buildSync({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers'],target:'es2022'}).outputFiles[0].text;
 assert.equal(compiled.split('async fetch(r, env) {').length,2);
 const returnPoint='if (!origin || response.status === 101) return response;';assert.ok(compiled.includes(returnPoint));
 const instrument=`let rpcCount=0;
 function measuredNamespace(ns){return new Proxy(ns,{get(target,key){if(key!=='getByName')return Reflect.get(target,key);return (...args)=>{const stub=target.getByName(...args);return new Proxy(stub,{get(s,k){const value=Reflect.get(s,k);return typeof value==='function'?(...a)=>{rpcCount++;return Reflect.apply(value,s,a);}:value;}});};}});}
 `;
 return instrument+compiled.replace('async fetch(r, env) {',`async fetch(r, env) { rpcCount=0; env=new Proxy(env,{get(target,key){const value=Reflect.get(target,key);return key==='FRIENDS'||key==='PLAY_INVITATIONS'?measuredNamespace(value):value;}});`).replace(returnPoint,`if (!origin) {response.headers.set('x-test-rpcs',String(rpcCount));return response;}`);
}

test('profile and invitation reads use bounded RPCs without changing authorization or friendship snapshots',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({name:'rpc-budget',modules:true,script:measuredWorker(),compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],bindings:{ALLOWED_ORIGIN:'https://web.example',ONLINE_ORIGIN:'https://online.example',PUSH_ENABLED:'false'},durableObjects:{FRIENDS:{className:'FriendNode',useSQLite:true},PLAY_INVITATIONS:{className:'PlayInvitationNode',useSQLite:true}},serviceBindings:{ONLINE:async()=>Response.json({})}}));
 const a='a'.repeat(64),b='b'.repeat(64);
 async function call(token,path,data){const r=await mf.dispatchFetch('https://friends.example'+path,{method:data===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:r.status,body:await r.json(),rpcs:Number(r.headers.get('x-test-rpcs'))};}
 try{
  const A=await call(a,'/profile',{name:'Ana'});assert.equal(A.status,200);assert.equal(A.rpcs,1,'registration must bundle own profile and references');
  const B=await call(b,'/profile',{name:'Luis'});assert.equal(B.status,200);
  const pa='/profiles/'+A.body.profile.code,pb='/profiles/'+B.body.profile.code;
  assert.equal((await call(a,pa)).rpcs,1,'empty profile refresh');
  const empty=await call(a,pa+'/play');assert.equal(empty.status,200);assert.deepEqual(empty.body,{invitations:[]});assert.equal(empty.rpcs,1,'authenticated empty inbox');
  assert.equal((await call(b,pa)).status,401);assert.equal((await call(b,pa+'/play')).status,401);
  const link=(await call(a,pa+'/share',{})).body;assert.equal((await call(b,pb+'/accept-link',link)).status,200);
  const friends=await call(a,pa);assert.equal(friends.status,200);assert.equal(friends.rpcs,3,'one friend needs one own read and two peer reads');assert.equal(friends.body.friends[0].name,'Luis');assert.equal(friends.body.friends[0].status,'accepted');assert.equal(friends.body.friends[0].plays,0);
  assert.equal(JSON.stringify(friends.body).includes('hash'),false);assert.equal(JSON.stringify(friends.body).includes(a),false);
  const renamed=await call(b,'/profile',{name:'Luis nuevo'});assert.equal(renamed.body.profile.name,'Luis nuevo');assert.equal((await call(a,pa)).body.friends[0].name,'Luis nuevo');
  const removed=await call(a,pa+'/remove',{peer:B.body.profile.code});assert.equal(removed.status,200);assert.deepEqual(removed.body.friends,[]);assert.deepEqual((await call(b,pb)).body.friends,[]);
 }finally{await mf.dispose();}
});

