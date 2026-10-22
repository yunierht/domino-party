import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {create,act} from 'react-test-renderer';import {parsePlayLink,playLink} from './playLinks.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;const settle=fn=>act(async()=>{fn();await new Promise(setImmediate);});const id='a'.repeat(64),other='b'.repeat(64),me='F-AAAA1111',host='F-BBBB2222';
async function fixture({url=null,online=false,initial=[],profileReady=true,previewFrom=host,previewState='pending',readHook,live=false,profileCode=me,game='domino'}={}){const events=[],apps=new Set(),urls=new Set(),operations=new Map();let tick,notify,context,tree,records=initial,previewResolve,event;const pendingInitial=url==='deferred'?new Promise(r=>previewResolve=r):Promise.resolve(url);const api={list:async()=>{events.push(['list']);return records;},read:async value=>{await readHook?.();return {id:value,from:host,to:me,game:'domino',state:'accepted',readiness:{},peer:{name:'Host'}};},preview:async value=>({id:value,from:previewFrom,game,state:previewState,acceptBy:9999999999999,peer:{name:'Host'}}),accept:async value=>{events.push(['accept',value]);records=[{id:value,from:host,to:profileCode,game,state:'accepted',createdAt:1,acceptBy:2,acceptedAt:1,readiness:{},generation:0,allocation:null,room:null,entered:[],revision:2,peer:{name:'Host'}}];return records[0];},decline:async value=>{events.push(['decline',value]);records=[{id:value,from:host,to:me,game:'domino',state:'declined',acceptedAt:null,readiness:{},peer:{name:'Host'}}];return records[0];},ready:async(value,ready)=>events.push(['ready',value,ready]),create:async(value,to,game)=>{events.push(['create',value,to,game]);return {id:value};},cancel:async value=>{events.push(['cancel',value]);records=records.map(p=>p.id===value?{...p,state:'cancelled'}:p);},complete:async()=>{}};
const onlineRooms=online?[{game:'poker',session:{token:'old',code:'ABCDEF0123'},view:{phase:'playing'}}]:[];const coordinator={stopObserving:()=>{},waitingForProfileEvents:()=>false,liveHealthy:()=>false,activeRooms:async()=>onlineRooms,prepare:async()=>{events.push(['prepare']);return null;},enter:async()=>events.push(['enter'])};
const mocks={react:React,'react-native':{AppState:{currentState:'active',addEventListener:(_,fn)=>{apps.add(fn);return {remove:()=>apps.delete(fn)};}},Modal:'Modal',ScrollView:'ScrollView',Text:'Text',View:'View'},'expo-linking':{addEventListener:(_,fn)=>{urls.add(fn);return {remove:()=>urls.delete(fn)};},getInitialURL:()=>pendingInitial},'./playClient':{PlayClient:class{constructor(){return api;}}},'./playRoomAdapter':{playRoomCoordinator:()=>coordinator},'./playLinks':{parsePlayLink,playLink},'./playOperations':{playOperations:{read:async k=>operations.get(k),write:async(k,v)=>operations.set(k,v),clear:async k=>operations.delete(k)}},'./identity':{randomToken:async()=>id},'./pushNotifications':{usePlayNotifications:(_client,onOpen)=>{notify=onOpen;return {status:'web_unsupported',enable:async()=>{},requestOnce:async()=>{events.push(['permission-context']);}};}},'../components/GoldPressable':{GoldPressable:'Pressable'},'../computer/tableTheme':{TABLE:{gold:'#aaa',background:'#000',surface:'#111',ivory:'#fff'}},'../../config/friends.json':{__esModule:true,default:{origin:'https://friends.example'}}};const m={exports:{}};new Function('require','module','exports','setInterval','clearInterval',ts.transpileModule(fs.readFileSync(new URL('./PlayInvitations.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports,fn=>{tick=fn;return 1;},()=>{});function Child(){context=m.exports.usePlayInvitations();return null;}await act(async()=>{tree=create(React.createElement(m.exports.PlayInvitationsProvider,{client:{liveHealthy:live,subscribeChanges:fn=>{event=fn;return()=>{event=null;};},state:{snapshot:{profile:{code:profileCode}}}},profile:profileReady?{code:profileCode}:null,retryProfile:async()=>events.push(['retry-profile']),player:{name:'Guest',avatar:'yuni',target:100,mode:'points'},nav:{screen:'computerGame',openPokerOnline:()=>events.push(['navigate']),openJoinedDomino:()=>events.push(['navigate'])},es:true},React.createElement(Child)));});return {tree,events,api,coordinator,setRecords:value=>{records=value;},async appState(value){await settle(()=>{for(const fn of apps)fn(value);});},event:()=>event?.(),get context(){return context;},tick:()=>tick(),notify:value=>notify(value),resolveInitial:()=>previewResolve?.('dominoparty://play?invite='+other),async close(){await settle(()=>tree.unmount());}};}
test('first link accepts once with host offline, preserves agreement on Continue, and never navigates on acceptance',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id});try{const accept=f.tree.root.findByProps({testID:'play-accept-link'});await act(async()=>{accept.props.onPress();accept.props.onPress();});assert.deepEqual(f.events.filter(e=>e[0]==='accept'),[['accept',id]]);assert.equal(f.events.some(e=>e[0]==='navigate'),false);await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());await settle(()=>f.tick());assert.equal(f.events.some(e=>e[0]==='enter'),false);await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());assert.equal(f.events.some(e=>e[0]==='cancel'),false);assert.equal(f.events.filter(e=>e[0]==='ready').at(-1)[2],false);}finally{await f.close();}});
test('online match requires explicit abandonment warning; Continue never leaves or cancels accepted agreement',async()=>{const p={id,from:host,to:me,game:'domino',state:'accepted',readiness:{},peer:{name:'Host'}},f=await fixture({initial:[p],online:true});try{await settle(()=>f.context.open());await settle(()=>f.tree.root.findAllByType('Pressable').find(n=>String(n.props.accessibilityLabel).includes('Host')).props.onPress());await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());assert.equal(f.tree.root.findAllByProps({testID:'play-confirm-leave'}).length,1);assert.equal(f.events.some(e=>e[0]==='ready'),false);await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());assert.equal(f.events.some(e=>['cancel','enter','navigate'].includes(e[0])),false);}finally{await f.close();}});
test('warm push intent wins over delayed initial URL and only opens the invitation, never a table',async()=>{const f=await fixture({url:'deferred'});try{await settle(()=>f.notify(id));await act(async()=>f.resolveInitial());await settle(()=>f.tree.root.findByProps({testID:'play-accept-link'}).props.onPress());assert.equal(f.events.find(e=>e[0]==='accept')[1],id);assert.equal(f.events.some(e=>e[0]==='navigate'),false);}finally{await f.close();}});

test('acceptance waits for an in-flight poll and is not silently dropped',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id});try{let release;const pending=new Promise(resolve=>release=resolve),original=f.api.list;let once=true;f.api.list=async()=>{if(once){once=false;await pending;}return original();};await settle(()=>f.tick());const button=f.tree.root.findByProps({testID:'play-accept-link'});await settle(()=>button.props.onPress());assert.equal(f.events.some(e=>e[0]==='accept'),false);await act(async()=>{release();await new Promise(setImmediate);});assert.equal(f.events.filter(e=>e[0]==='accept').length,1);}finally{await f.close();}});

test('declining the first link does not accept it or enter a table',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id});try{await settle(()=>f.tree.root.findByProps({testID:'play-decline-link'}).props.onPress());assert.deepEqual(f.events.filter(e=>e[0]==='decline'),[['decline',id]]);assert.equal(f.events.some(e=>['accept','navigate','enter'].includes(e[0])),false);}finally{await f.close();}});

for(const game of ['domino','poker'])for(const close of ['x','back'])test('closing '+game+' with '+close+' cancels while Continue preserves',async()=>{const p={id,from:host,to:me,game,state:'accepted',readiness:{},peer:{name:'Host'}},f=await fixture({initial:[p]});try{await settle(()=>f.context.open());await settle(()=>f.tree.root.findAllByType('Pressable').find(n=>String(n.props.accessibilityLabel).includes('Host')).props.onPress());await settle(()=>{if(close==='x')f.tree.root.findByProps({testID:'play-close'}).props.onPress();else f.tree.root.findByType('Modal').props.onRequestClose();});assert.deepEqual(f.events.filter(e=>e[0]==='cancel'),[['cancel',id]]);assert.equal(f.tree.root.findByType('Modal').props.visible,false);assert.equal(f.events.some(e=>['enter','navigate'].includes(e[0])),false);}finally{await f.close();}});
test('X on an unaccepted shared link declines without accepting or joining',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id});try{await settle(()=>f.tree.root.findByProps({testID:'play-close'}).props.onPress());assert.deepEqual(f.events.filter(e=>e[0]==='decline'),[['decline',id]]);assert.equal(f.events.some(e=>['accept','enter','navigate'].includes(e[0])),false);}finally{await f.close();}});

test('cold link waiting for profile explains loading and exposes retry instead of a blank panel',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id,profileReady:false});try{assert.equal(f.tree.root.findAllByProps({testID:'play-profile-pending'}).length,1);await settle(()=>f.tree.root.findByProps({testID:'play-retry-profile'}).props.onPress());assert.equal(f.events.filter(e=>e[0]==='retry-profile').length,1);}finally{await f.close();}});
test('an accepted link recovers the agreement before the next poll and offers Switch',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id,previewState:'accepted'});try{assert.equal(f.tree.root.findAllByProps({testID:'play-switch-online'}).length,1);assert.equal(f.tree.root.findAllByProps({testID:'play-accept-link'}).length,0);}finally{await f.close();}});
test('a different incoming invitation cannot hide the shared link acceptance',async()=>{const f=await fixture({url:'dominoparty://play?invite='+id,initial:[{id:other,from:host,to:me,state:'pending',game:'poker',peer:{name:'Other'}}]});try{assert.equal(f.tree.root.findAllByProps({testID:'play-accept-link'}).length,1);}finally{await f.close();}});

test('accepted link hydration survives a delayed network read without waiting for poll',async()=>{let release;const gate=new Promise(r=>release=r);const f=await fixture({url:'dominoparty://play?invite='+id,previewState:'accepted',readHook:()=>gate});try{assert.equal(f.tree.root.findAllByProps({testID:'play-switch-online'}).length,0);await settle(()=>release());assert.equal(f.tree.root.findAllByProps({testID:'play-switch-online'}).length,1);}finally{release();await f.close();}});

test('healthy live invitation inbox does not poll while idle and a server event refreshes immediately',async()=>{const f=await fixture({live:true});try{const count=()=>f.events.filter(e=>e[0]==='list').length,before=count();await settle(()=>f.tick());assert.equal(count(),before);await settle(()=>f.event());assert.equal(count(),before+1);}finally{await f.close();}});

for(const gate of ['list','ready'])for(const lifecycle of ['background','unmount'])test('suspension during '+gate+' prevents preparation after '+lifecycle,async()=>{const f=await fixture({initial:[{id,from:host,to:me,game:'domino',state:'accepted',readiness:{},peer:{name:'Host'}}]});let release;try{await settle(()=>f.context.open());await settle(()=>f.tree.root.findAllByType('Pressable').find(n=>String(n.props.accessibilityLabel).includes('Host')).props.onPress());await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());let blocked=false;const pending=new Promise(r=>release=r),old=f.api[gate];f.api[gate]=async(...args)=>{if(!blocked&&(gate==='list'||args[1]===true)){blocked=true;await pending;}return old(...args);};const realNow=Date.now;if(gate==='ready')Date.now=()=>realNow()+11000;try{await settle(()=>f.tick());}finally{Date.now=realNow;}assert.equal(blocked,true);if(lifecycle==='background')await f.appState('background');else await f.close();const before=f.events.length;await act(async()=>{release();await new Promise(setImmediate);});const late=f.events.slice(before);assert.equal(late.some(e=>e[0]==='prepare'),false);if(gate==='list')assert.equal(late.some(e=>e[0]==='ready'&&e[2]===true),false);else assert.equal(f.events.filter(e=>e[0]==='ready').at(-1)[2],false,'withdrawal must follow the delayed true completion');}finally{release?.();if(lifecycle==='background')await f.close();}});


for(const game of ['domino','poker'])test('host receives accepted decision after sharing without reopening own link: '+game,async()=>{
 const pending={id,from:me,to:null,game,state:'pending',readiness:{},peer:null};
 const f=await fixture({initial:[pending],live:true});try{
  await act(()=>f.context.share(game));assert.equal(f.tree.root.findByType('Modal').props.visible,false);
  f.setRecords([{...pending,to:host,state:'accepted',peer:{name:'Guest'}}]);await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,true);
  assert.equal(f.tree.root.findAllByProps({testID:'play-host-accepted'}).length,1);
  assert.equal(f.events.some(e=>e[0]==='ready'||e[0]==='navigate'),false);
  await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());
  assert.equal(f.events.filter(e=>e[0]==='ready'&&e[2]).length,1);
 }finally{await f.close();}
});

test('Continue suppresses each host agreement across repeated events and inbox recovers it',async()=>{
 const records=[id,other].map(value=>({id:value,from:me,to:host,game:'domino',state:'accepted',readiness:{},peer:{name:value===id?'First':'Second'}}));
 const f=await fixture({initial:records,live:true});try{
  await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());
  await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());
  for(let i=0;i<3;i++)await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,false);
  assert.equal(f.events.some(e=>['ready','cancel','enter','navigate'].includes(e[0])),false);
  await settle(()=>f.context.open());
  const entry=f.tree.root.findAllByType('Pressable').find(n=>String(n.props.accessibilityLabel).includes('First'));
  assert.ok(entry);await settle(()=>entry.props.onPress());assert.equal(f.tree.root.findAllByProps({testID:'play-switch-online'}).length,1);
 }finally{await f.close();}
});

for(const game of ['domino','poker'])test('Accept and play makes guest ready once without a second Switch: '+game,async()=>{
 const f=await fixture({url:'dominoparty://play?invite='+id,game});try{
  const button=f.tree.root.findByProps({testID:'play-accept-link'});await act(async()=>{button.props.onPress();button.props.onPress();});
  assert.deepEqual(f.events.filter(e=>e[0]==='accept'),[['accept',id]]);
  assert.deepEqual(f.events.filter(e=>e[0]==='ready'),[['ready',id,true]]);
  assert.equal(f.events.some(e=>e[0]==='navigate'),false,'host is still absent');
 }finally{await f.close();}
});

for(const lifecycle of ['background','roundtrip','unmount','other-link'])test('late acceptance is saved but cannot start guest after '+lifecycle,async()=>{
 const f=await fixture({url:'dominoparty://play?invite='+id});let release;try{
  const original=f.api.accept;f.api.accept=async value=>{await new Promise(r=>release=r);return original(value);};
  await settle(()=>f.tree.root.findByProps({testID:'play-accept-link'}).props.onPress());
  if(lifecycle==='unmount')await f.close();else if(lifecycle==='other-link')await settle(()=>f.notify(other));else{await f.appState('background');if(lifecycle==='roundtrip')await f.appState('active');}
  await settle(()=>release());
  assert.equal(f.events.filter(e=>e[0]==='accept').length,1);
  assert.equal(f.events.some(e=>['ready','prepare','enter','navigate'].includes(e[0])),false);
 }finally{release?.();if(lifecycle!=='unmount')await f.close();}
});

test('guest accepting while already online retains the abandonment confirmation',async()=>{
 const f=await fixture({url:'dominoparty://play?invite='+id,online:true});try{
  await settle(()=>f.tree.root.findByProps({testID:'play-accept-link'}).props.onPress());
  assert.equal(f.tree.root.findAllByProps({testID:'play-confirm-leave'}).length,1);
  assert.equal(f.events.some(e=>e[0]==='ready'||e[0]==='enter'),false);
 }finally{await f.close();}
});


test('two providers connect after one guest acceptance and one host choice without a host link',async()=>{
 let agreement={id,from:me,to:null,game:'domino',state:'pending',readiness:{},peer:{name:'Other'}};
 const hostUI=await fixture({initial:[agreement],live:true});
 const guestUI=await fixture({url:'dominoparty://play?invite='+id,profileCode:host,previewFrom:me,live:true});
 const ready=new Set(),entered=new Set(),room='AABBCCDDEE';
 try{
  for(const [f,actor] of [[hostUI,me],[guestUI,host]]){
   f.api.list=async()=>[{...agreement}];
   f.api.ready=async(_,enabled)=>{enabled?ready.add(actor):ready.delete(actor);};
   f.coordinator.prepare=async()=>ready.size===2?{invitation:agreement,session:{code:room,token:actor}}:null;
   f.coordinator.enter=async(staged,approved,current)=>{assert.equal(current(),true);assert.equal(ready.size,2);entered.add(actor);assert.equal(staged.session.code,room);};
  }
  guestUI.api.accept=async()=>{agreement={...agreement,to:host,state:'accepted'};return agreement;};
  await settle(()=>guestUI.tree.root.findByProps({testID:'play-accept-link'}).props.onPress());
  assert.deepEqual([...ready],[host]);
  await settle(()=>hostUI.event());
  assert.equal(hostUI.tree.root.findByType('Modal').props.visible,true);
  assert.equal(hostUI.events.some(e=>e[0]==='navigate'),false);
  await settle(()=>hostUI.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());
  await settle(()=>hostUI.tick());await settle(()=>guestUI.tick());
  assert.deepEqual([...entered].sort(),[me,host].sort());
  assert.equal(hostUI.events.filter(e=>e[0]==='navigate').length,1);
  assert.equal(guestUI.events.filter(e=>e[0]==='navigate').length,1);
  assert.equal(hostUI.tree.root.findByType('Modal').props.visible,false);
  assert.equal(guestUI.tree.root.findByType('Modal').props.visible,false);
 }finally{await hostUI.close();await guestUI.close();}
});


test('Continue while host is waiting must not hide a later acceptance of that invitation',async()=>{
 const pending={id,from:me,to:host,game:'domino',state:'pending',readiness:{},peer:{name:'Guest'}};
 const f=await fixture({initial:[pending],live:true});try{
  await settle(()=>f.context.invite(host,'domino'));
  await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());
  f.setRecords([{...pending,state:'accepted'}]);await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,true);
  assert.equal(f.tree.root.findAllByProps({testID:'play-host-accepted'}).length,1);
  await settle(()=>f.tree.root.findByProps({testID:'play-keep-current'}).props.onPress());
  f.setRecords([{...pending,state:'preparing'}]);await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,false,'accepted and preparing share a single dismissal');
 }finally{await f.close();}
});

for(const button of ['play-accept-link','play-switch-online','play-confirm-leave'])for(const transition of ['other-intent','roundtrip'])test('queued '+button+' cannot inherit later intent after '+transition,async()=>{
 const f=await fixture({url:'dominoparty://play?invite='+id,online:button==='play-confirm-leave',previewState:button==='play-accept-link'?'pending':'accepted'});let release;try{
  if(button==='play-confirm-leave')await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());
  const oldList=f.api.list;let once=true;
  f.api.list=async()=>{if(once){once=false;await new Promise(r=>release=r);}return oldList();};
  await settle(()=>f.tick());assert.ok(release);
  await settle(()=>f.tree.root.findByProps({testID:button}).props.onPress());
  if(transition==='other-intent')await settle(()=>f.notify(other));else{await f.appState('background');await f.appState('active');}
  await settle(()=>release());
  assert.equal(f.events.some(e=>e[0]==='accept'||e[0]==='ready'&&e[2]===true||e[0]==='navigate'),false);
 }finally{release?.();await f.close();}
});


for(const ackFails of [false,true])test('successful entry closes its decision even with stale server list and ack failure '+ackFails,async()=>{
 const record={id,from:me,to:host,game:'domino',state:'ready',entered:[],readiness:{},peer:{name:'Guest'}},f=await fixture({initial:[record],live:true});try{
  f.coordinator.prepare=async()=>({invitation:record,session:{code:'AABBCCDDEE',token:'test-host-token'}});
  if(ackFails)f.api.complete=async()=>{throw Error('lost_ack');};
  await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());await settle(()=>f.tick());
  assert.equal(f.events.filter(e=>e[0]==='navigate').length,1);
  assert.equal(f.tree.root.findByType('Modal').props.visible,false);
  await settle(()=>f.event());assert.equal(f.tree.root.findByType('Modal').props.visible,false);
  f.setRecords([record,{...record,id:other,peer:{name:'Other'}}]);await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,true,'another accepted invitation remains visible');
  await settle(()=>f.tree.root.findByProps({testID:'play-close'}).props.onPress());
  assert.deepEqual(f.events.filter(e=>e[0]==='cancel'),[['cancel',other]]);
 }finally{await f.close();}
});

test('host already entered is not prompted again while waiting for guest completion',async()=>{
 const record={id,from:me,to:host,game:'domino',state:'ready',entered:[me],readiness:{},peer:{name:'Guest'}},f=await fixture({initial:[record],live:true});try{
  assert.equal(f.tree.root.findByType('Modal').props.visible,false);
  f.setRecords([record,{...record,id:other,entered:[]}]);await settle(()=>f.event());
  assert.equal(f.tree.root.findByType('Modal').props.visible,true);
 }finally{await f.close();}
});

 test('confirmed host starts preparation without waiting for a timer or another profile event',async()=>{const f=await fixture({live:true,initial:[{id,from:me,to:host,game:'domino',state:'accepted',readiness:{},peer:{name:'Guest'}}]});try{await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());assert.equal(f.events.filter(e=>e[0]==='prepare').length,1);}finally{await f.close();}});

test('healthy staging performs no periodic list or prepare; lease is renewed independently',async()=>{const f=await fixture({live:true,initial:[{id,from:me,to:host,game:'domino',state:'accepted',readiness:{},peer:{name:'Guest'}}]});const realNow=Date.now;let now=realNow(),observer;Date.now=()=>now;try{f.coordinator.liveHealthy=()=>true;f.coordinator.prepare=async(_id,_actor,o)=>{observer=o;f.events.push(['prepare']);return null;};await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());const count=kind=>f.events.filter(e=>e[0]===kind).length,before=[count('list'),count('prepare'),count('ready')];for(let n=0;n<4;n++){now+=5000;await settle(()=>f.tick());}assert.deepEqual([count('list'),count('prepare')],before.slice(0,2));assert.equal(count('ready')-before[2],2);await settle(()=>observer.changed());assert.equal(count('prepare'),before[1]+1);await f.appState('background');const stopped=count('prepare');await settle(()=>observer.changed());assert.equal(count('prepare'),stopped);}finally{Date.now=realNow;await f.close();}});

test('preallocation on healthy Friends performs no periodic list or prepare; lease is renewed independently',async()=>{const f=await fixture({live:true,initial:[{id,from:me,to:host,game:'domino',state:'accepted',readiness:{},peer:{name:'Guest'}}]});const realNow=Date.now;let now=realNow(),observer;Date.now=()=>now;try{f.coordinator.waitingForProfileEvents=()=>true;f.coordinator.prepare=async(_id,_actor,o)=>{observer=o;f.events.push(['prepare']);return null;};await settle(()=>f.tree.root.findByProps({testID:'play-switch-online'}).props.onPress());const count=kind=>f.events.filter(e=>e[0]===kind).length,before=[count('list'),count('prepare'),count('ready')];for(let n=0;n<4;n++){now+=5000;await settle(()=>f.tick());}assert.deepEqual([count('list'),count('prepare')],before.slice(0,2));assert.equal(count('ready')-before[2],2);await settle(()=>observer.changed());assert.equal(count('prepare'),before[1]+1);await f.appState('background');const stopped=count('prepare');await settle(()=>observer.changed());assert.equal(count('prepare'),stopped);}finally{Date.now=realNow;await f.close();}});
