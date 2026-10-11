import test from 'node:test';import assert from 'node:assert/strict';
import worker from './worker.js';
function env(){const calls=[];return{calls,LINKS_HOST:'online-test.dominoparty.com',ASSETS:{async fetch(request){calls.push(request);return new Response(request.url.endsWith('association')?'{}':'asset',{headers:{'content-type':'application/octet-stream'}});}}};}
test('association files are served without redirects as JSON, with no secret-bearing headers passed to assets',async()=>{
 const e=env();const r=await worker.fetch(new Request('https://online-test.dominoparty.com/.well-known/apple-app-site-association',{headers:{Authorization:'Bearer private',Cookie:'private'}}),e);
 assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/json; charset=utf-8');assert.equal(r.headers.get('location'),null);assert.equal(e.calls[0].headers.has('authorization'),false);assert.equal(e.calls[0].headers.has('cookie'),false);
});
test('exact invite path serves HTML internally without redirecting or forwarding the public room query into asset fetch',async()=>{
 const e=env();const r=await worker.fetch(new Request('https://online-test.dominoparty.com/online/invite?onlineRoom=ABCDEF0123'),e);
 assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'text/html; charset=utf-8');assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('location'),null);assert.equal(e.calls[0].url,'https://online-test.dominoparty.com/online/invite/index.html');
});
test('unconfigured/foreign hosts, HTTP, extra routes and non-read methods fail closed',async()=>{
 for(const [url,method,status] of [['https://other.example/online/invite','GET',404],['http://online-test.dominoparty.com/online/invite','GET',404],['https://online-test.dominoparty.com/rooms','GET',404],['https://online-test.dominoparty.com/online/invite','POST',405]])assert.equal((await worker.fetch(new Request(url,{method}),env())).status,status);
 assert.equal((await worker.fetch(new Request('https://online-test.dominoparty.com/online/invite'),{ASSETS:env().ASSETS})).status,404);
});
