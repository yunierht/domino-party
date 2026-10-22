import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {friendsTransport} from './transport.ts';
import {FriendsClient} from './client.ts';
import {PlayClient} from './playClient.ts';
import {createPlayInvitation,ACCEPT_MS} from './playInvitation.ts';
import {playLink,parsePlayLink} from './playLinks.ts';
const require=createRequire(import.meta.url),{Response:NativeResponse}=require('whatwg-fetch');
const origin='https://friends.example',token='a'.repeat(64);
test('React Native whatwg-fetch response without a readable stream accepts profile JSON',async()=>{
 const response=new NativeResponse(JSON.stringify({profile:{code:'F-AAAA1111',name:'Yuni'},friends:[]}));
 assert.equal(response.body,undefined);
 const result=await friendsTransport(origin,async()=>response).request('/profile',token,{name:'Yuni'});
 assert.equal(result.profile.name,'Yuni');
});
for(const ResponseType of [NativeResponse,Response]){
 test(`${ResponseType===NativeResponse?'native':'stream'} preserves HTTP errors and rejects malformed JSON`,async()=>{
  await assert.rejects(friendsTransport(origin,async()=>new ResponseType('{"error":"rate_limited"}',{status:429})).request('/profile',token),/rate_limited/);
  await assert.rejects(friendsTransport(origin,async()=>new ResponseType('{}',{status:503})).request('/profile',token),/connection_error/);
  await assert.rejects(friendsTransport(origin,async()=>new ResponseType('broken')).request('/profile',token),SyntaxError);
 });
 test(`${ResponseType===NativeResponse?'native':'stream'} enforces 12 MiB UTF8 limit including non ASCII`,async()=>{
  for(const value of ['a'.repeat(12*1024*1024),'é'.repeat(6*1024*1024),'😀'.repeat(3*1024*1024)]){
   await assert.rejects(friendsTransport(origin,async()=>new ResponseType(JSON.stringify(value))).request('/profile',token),/invalid_snapshot/);
  }
  const value='é'.repeat((12*1024*1024-2)/2);
  assert.equal(await friendsTransport(origin,async()=>new ResponseType(JSON.stringify(value))).request('/profile',token),value);
 });
}
test('native declared excessive length rejects before consuming response',async()=>{
 const response=new NativeResponse('{}',{headers:{'content-length':String(12*1024*1024+1)}});
 response.text=()=>{throw Error('must_not_read');};
 await assert.rejects(friendsTransport(origin,async()=>response).request('/profile',token),/invalid_snapshot/);
});
test('deadline covers fetch, native body and stream reads even if adapter ignores abort',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const stage of ['fetch','native','stream']){
  let signal;
  const fetcher=async(_url,options)=>{signal=options.signal;if(stage==='fetch')return new Promise(()=>{});
   if(stage==='stream')return {body:{getReader:()=>({read:()=>new Promise(()=>{}),releaseLock(){}})}};
   const response=new NativeResponse('{}');response.text=()=>new Promise(()=>{});return response;};
  const promise=friendsTransport(origin,fetcher).request('/profile',token);
  const rejection=assert.rejects(promise,/connection_error/);
  await Promise.resolve();t.mock.timers.tick(6000);await rejection;assert.equal(signal.aborted,true);
 }
});
test('native AbortError maps to connection_error',async()=>{
 await assert.rejects(friendsTransport(origin,async()=>{const e=Error('aborted');e.name='AbortError';throw e;}).request('/profile',token),/connection_error/);
});
test('real FriendsClient to PlayClient via native Response creates shareable invitation for both games',async()=>{
 for(const game of ['domino','poker']){
  let saved=null;const calls=[];const id='b'.repeat(64),profile='F-AAAA1111';
  const transport=friendsTransport(origin,async(url,options)=>{
   assert.equal(saved,token);assert.equal(options.headers.authorization,'Bearer '+token);calls.push(new URL(url).pathname);
   if(url.endsWith('/profile'))return new NativeResponse(JSON.stringify({profile:{code:profile,name:'Yuni'},friends:[]}));
   assert.equal(url,origin+'/profiles/'+profile+'/play');assert.deepEqual(JSON.parse(options.body),{id,to:null,game});
   return new NativeResponse(JSON.stringify(createPlayInvitation(id,profile,null,game,1234)));
  });
  const client=new FriendsClient({read:async()=>saved,write:async v=>{saved=v;}},transport,async()=>token);
  await client.register('Yuni');const invitation=await new PlayClient(client).create(id,null,game);
  const link=playLink('https://dominoparty.com',invitation.id);
  assert.equal(parsePlayLink(link,'https://dominoparty.com'),id);assert.equal(invitation.acceptBy,1234+ACCEPT_MS);assert.equal(invitation.room,null);
  assert.deepEqual(calls,['/profile','/profiles/'+profile+'/play']);
 }
});
