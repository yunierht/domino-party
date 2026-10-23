import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInstallInvitation,InstallationRecovery} from './installInvitation.ts';
const online='https://rooms.example.com',friends='https://friends.example.com',now=1800000000000;
const record=(url=online+'/online/invite?onlineRoom=ABCDEF0123')=>({status:'pending',key:'install1',raw:new URLSearchParams({dp_v:'1',dp_link:url}).toString(),clickMs:now-20000,installMs:now-10000});
const parse=r=>parseInstallInvitation(r,{online,friends},now);
test('strict public room / play locators survive Play double encoding',()=>{
 const r=record();const store=new URL('https://play.google.com/store/apps/details?id=com.yht.dominoparty');store.searchParams.set('referrer',r.raw);r.raw=store.searchParams.get('referrer');
 assert.deepEqual(parse(r),{kind:'domino',id:'ABCDEF0123'});
 assert.deepEqual(parse(record(online+'/online/invite?pokerRoom=ABCDEF0123')),{kind:'poker',id:'ABCDEF0123'});
 assert.deepEqual(parse(record(friends+'/play?invite='+'a'.repeat(64))),{kind:'play',id:'a'.repeat(64)});
});
test('missing malformed foreign duplicate stale future and reordered timestamps are rejected',()=>{
 for(const r of [record('http://rooms.example.com/online/invite?onlineRoom=ABCDEF0123'),record('https://evil.example/online/invite?onlineRoom=ABCDEF0123'),record(online+'/online/invite?onlineRoom=ABCDEF0123&onlineRoom=ABCDEF0123'),record(friends+'/friend?invite='+'a'.repeat(64)),{...record(),raw:''},{...record(),raw:record().raw+'&dp_v=1'},{...record(),clickMs:now-8*86400000},{...record(),installMs:now+900000},{...record(),clickMs:now-100,installMs:now-20000}])assert.equal(parse(r),null);
});
function fixture(overrides={}){const events=[];let current=true;const deps={read:async()=>record(),consume:async key=>events.push(['consume',key]),parse,resolve:async()=>true,deliver:()=>{events.push(['deliver']);return true},current:()=>current,...overrides};const c=new InstallationRecovery(deps);return{c,events,cancel:()=>{current=false}}}
test('prevalidation then confirmation then consume, duplicates consumed once',async()=>{const f=fixture();await f.c.attempt();await f.c.attempt();assert.deepEqual(f.events,[['deliver'],['consume','install1']]);});
test('network retry keeps pending; ACK retry never dispatches twice',async()=>{let calls=0,acks=0;const f=fixture({resolve:async()=>{if(!calls++)throw Error('network');return true},consume:async()=>{if(!acks++)throw Error('storage')}});await f.c.attempt();assert.deepEqual(f.events,[]);await f.c.attempt();await f.c.attempt();assert.deepEqual(f.events,[['deliver']]);assert.equal(acks,2);});
test('direct link or navigation during request wins without deferred dispatch',async()=>{let finish;const f=fixture({resolve:()=>new Promise(r=>finish=r)});const p=f.c.attempt();await new Promise(r=>setImmediate(r));f.cancel();finish(true);await p;assert.deepEqual(f.events,[]);});
test('invalid/expired consumes without navigation; new installation can recover independently',async()=>{for(const overrides of [{read:async()=>({...record(),raw:''})},{resolve:async()=>false}]){const f=fixture(overrides);await f.c.attempt();assert.deepEqual(f.events,[['consume','install1']]);}for(let i=0;i<2;i++){const f=fixture();await f.c.attempt();assert.equal(f.events[0][0],'deliver');}});
