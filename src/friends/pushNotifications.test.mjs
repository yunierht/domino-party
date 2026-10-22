import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {create,act} from 'react-test-renderer';import {notificationIntent} from './playLinks.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function fixture({granted=true,last=null,profileReady=true,grantRequest=true,canAskAgain=true,initialGate,writeGate,storage=new Map()}={}){const events=[],memory=storage,response=new Set(),tokens=new Set(),apps=new Set();let current,permission=granted;const client={state:{snapshot:profileReady?{profile:{code:'F-AAAA1111'}}:null},registerPush:async body=>{events.push(['register',body]);}};const notifications={setNotificationHandler:()=>{},AndroidImportance:{HIGH:4},setNotificationChannelAsync:async()=>{},getPermissionsAsync:async()=>{await initialGate?.();return {granted:permission,canAskAgain};},requestPermissionsAsync:async()=>{events.push(['permission']);permission=grantRequest;return {granted:permission,canAskAgain};},getExpoPushTokenAsync:async()=>({data:'ExpoPushToken[abcdefgh12345678]'}),getLastNotificationResponse:()=>last,clearLastNotificationResponse:()=>events.push(['clear']),addNotificationResponseReceivedListener:fn=>{response.add(fn);return {remove:()=>response.delete(fn)};},addPushTokenListener:fn=>{tokens.add(fn);return {remove:()=>tokens.delete(fn)};}};const mocks={react:React,'react-native':{Platform:{OS:'android'},AppState:{currentState:'active',addEventListener:(_,fn)=>{apps.add(fn);return {remove:()=>apps.delete(fn)};}}},'expo-notifications':notifications,'expo-secure-store':{getItemAsync:async k=>memory.get(k)??null,setItemAsync:async(k,v)=>{if(k==='domino-play.permission-requested.v1')await writeGate?.();memory.set(k,v);}},'expo-constants':{__esModule:true,default:{expoConfig:{extra:{eas:{projectId:'4ca6648b-ec5a-4b08-b425-519db3c4ebd7'}}}}},'../../config/social-club-update.json':{__esModule:true,default:{native:{easProjectId:'4ca6648b-ec5a-4b08-b425-519db3c4ebd7'}}},'./identity':{randomToken:async()=>'a'.repeat(64)},'./playLinks':{notificationIntent}};const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./pushNotifications.native.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports);function Harness(){current=m.exports.usePlayNotifications(client,id=>events.push(['open',id]));return null;}let tree;await act(async()=>{tree=create(React.createElement(Harness));});return {events,memory,response,tokens,apps,notifications,get current(){return current;},deny:()=>{permission=false;},async close(){await act(()=>tree.unmount());}};}
const data={type:'play-invitation',invitationId:'b'.repeat(64),eventId:'event-1'},notification={notification:{request:{content:{data}}}};
test('cold tap opens only its intent, repeated responses are deduplicated and subscriptions removed',async()=>{const f=await fixture({last:notification});try{assert.deepEqual(f.events.filter(e=>e[0]==='open'),[['open',data.invitationId]]);await act(()=>{for(const fn of f.response)fn(notification);});assert.equal(f.events.filter(e=>e[0]==='open').length,1);assert.equal(f.events.filter(e=>e[0]==='register').length,1);assert.equal(f.events.some(e=>e[0]==='permission'),false);}finally{await f.close();}assert.equal(f.response.size+f.tokens.size+f.apps.size,0);});
test('permission denied is non-blocking; explicit permission and foreground revocation update ownership',async()=>{const f=await fixture({granted:false});try{assert.equal(f.current.status,'permission_denied');assert.equal(f.events.some(e=>e[0]==='register'),false);await act(()=>f.current.enable());assert.equal(f.events.filter(e=>e[0]==='permission').length,1);assert.equal(f.events.find(e=>e[0]==='register')[1].enabled,true);f.deny();await act(async()=>{for(const fn of f.apps)fn('active');});assert.equal(f.events.filter(e=>e[0]==='register').at(-1)[1].enabled,false);}finally{await f.close();}});
test('token changes re-register and arbitrary notification data cannot navigate',async()=>{const f=await fixture();try{await act(async()=>{for(const fn of f.tokens)fn('rotated');});assert.equal(f.events.filter(e=>e[0]==='register').length,2);await act(()=>{for(const fn of f.response)fn({notification:{request:{content:{data:{url:'https://evil.example'}}}}});});assert.equal(f.events.some(e=>e[0]==='open'),false);}finally{await f.close();}});

test('Enable without a loaded profile reports the pending connection instead of silently returning',async()=>{const f=await fixture({profileReady:false});try{await act(()=>f.current.enable());assert.equal(f.current.status,'profile_pending');assert.equal(f.events.some(e=>e[0]==='register'||e[0]==='permission'),false);}finally{await f.close();}});


test('contextual notification request prompts once and denial does not loop',async()=>{
 const f=await fixture({granted:false,grantRequest:false});try{
  await act(()=>f.current.requestOnce());await act(()=>f.current.requestOnce());
  await act(async()=>{for(const fn of f.apps)fn('active');});await act(()=>f.current.requestOnce());
  assert.equal(f.events.filter(e=>e[0]==='permission').length,1);
  assert.equal(f.current.status,'permission_denied');assert.equal(f.events.some(e=>e[0]==='register'),false);
 }finally{await f.close();}
});

test('contextual request waits for initial registration instead of losing permission request',async()=>{
 let release,waiting=true;const gate=new Promise(r=>release=r);
 const f=await fixture({granted:false,initialGate:()=>waiting?gate:undefined});try{
  let request;await act(async()=>{request=f.current.requestOnce();await Promise.resolve();});
  await act(async()=>{waiting=false;release();await request;});
  assert.equal(f.events.filter(e=>e[0]==='permission').length,1);
  assert.equal(f.current.status,'registered');
 }finally{release?.();await f.close();}
});

test('contextual request respects a non-requestable permission',async()=>{
 const f=await fixture({granted:false,canAskAgain:false});try{await act(()=>f.current.requestOnce());assert.equal(f.events.some(e=>e[0]==='permission'),false);}finally{await f.close();}
});

test('contextual request after leaving the foreground never opens a permission dialog',async()=>{
 let release,waiting=true;const gate=new Promise(r=>release=r);
 const f=await fixture({granted:false,initialGate:()=>waiting?gate:undefined});try{
  let request;await act(async()=>{request=f.current.requestOnce();await Promise.resolve();});
  await act(async()=>{for(const fn of f.apps)fn('background');waiting=false;release();await request;});
  assert.equal(f.events.some(e=>e[0]==='permission'),false);
 }finally{release?.();await f.close();}
});


test('denied contextual request stays suppressed after a provider remount',async()=>{
 const storage=new Map(),first=await fixture({granted:false,grantRequest:false,storage});
 await act(()=>first.current.requestOnce());await first.close();
 const second=await fixture({granted:false,grantRequest:false,storage});try{await act(()=>second.current.requestOnce());assert.equal(second.events.some(e=>e[0]==='permission'),false);}finally{await second.close();}
});


for(const lifecycle of ['background','unmount'])test('permission interrupted before OS request leaves next mount eligible: '+lifecycle,async()=>{
 const storage=new Map(),f=await fixture({granted:false,storage});let release,job;
 const gate=new Promise(r=>release=r),original=f.notifications.getPermissionsAsync;
 f.notifications.getPermissionsAsync=async()=>{await gate;return original();};
 await act(async()=>{job=f.current.requestOnce();await new Promise(setImmediate);});
 if(lifecycle==='unmount')await f.close();else await act(()=>{for(const fn of f.apps)fn('background');});
 await act(async()=>{release();await job;});
 assert.equal(f.events.some(e=>e[0]==='permission'),false);
 assert.equal(storage.has('domino-play.permission-requested.v1'),false);
 if(lifecycle!=='unmount')await f.close();
 const next=await fixture({granted:false,storage});try{await act(()=>next.current.requestOnce());assert.equal(next.events.filter(e=>e[0]==='permission').length,1);}finally{await next.close();}
});

test('persistent permission marker is written only after OS request, even if storage is delayed',async()=>{
 let release;const gate=new Promise(r=>release=r),storage=new Map(),f=await fixture({granted:false,grantRequest:false,storage,writeGate:()=>gate});let job;
 await act(async()=>{job=f.current.requestOnce();await new Promise(setImmediate);});
 assert.equal(f.events.filter(e=>e[0]==='permission').length,1);
 assert.equal(storage.has('domino-play.permission-requested.v1'),false);
 await act(()=>{for(const fn of f.apps)fn('background');});
 await act(async()=>{release();await job;});await f.close();
 const next=await fixture({granted:false,grantRequest:false,storage});try{await act(()=>next.current.requestOnce());assert.equal(next.events.some(e=>e[0]==='permission'),false);}finally{await next.close();}
});
