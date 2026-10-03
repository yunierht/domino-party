import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const m={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(new URL('./placementAudio.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
const flush=()=>new Promise(r=>setImmediate(r));
function setup(slow=false,android=false){const players=[],calls=[];const pool=m.exports.createPlacementAudio({android,impactMs:[166.292,185.542,147.125,49.75,166.292],configure:async()=>{},random:()=>0,create:i=>{const listeners=new Set();const p={isLoaded:!slow,duration:slow?0:.5,muted:false,volume:1,play(){calls.push({i,muted:this.muted});},pause(){},seekTo:async()=>{},addListener(_,cb){listeners.add(cb);return{remove:()=>listeners.delete(cb)};},emit(s){for(const cb of [...listeners])cb(s);}};players[i]=p;return p;}});return {pool,players,calls};}
test('ready contact plays synchronously once at landing, with no seek or mode wait',async()=>{const h=setup();await h.pool.prepare();const cue=h.pool.reserve(false);assert.equal(h.calls.length,0);cue.land();assert.deepEqual(h.calls,[{i:0,muted:false}]);cue.land();assert.equal(h.calls.length,1);cue.cancel();});
test('late readiness cannot replay an expired or cancelled contact',async()=>{const h=setup(true);const pending=h.pool.prepare();const a=h.pool.reserve(false);a.land();const b=h.pool.reserve(true);b.cancel();for(const p of h.players){p.isLoaded=true;p.duration=.5;p.emit({isLoaded:true});}await pending;await flush();assert.equal(h.calls.length,0);b.land();assert.equal(h.calls.length,0);const next=h.pool.reserve(false);next.land();assert.equal(h.calls.length,1);next.cancel();});
test('Android warms every original in silence and rewinds BEFORE first landing',async()=>{const h=setup(false,true);const pending=h.pool.prepare();await flush();assert.equal(h.calls.length,5);assert.ok(h.calls.every(c=>c.muted));for(const p of h.players)p.emit({didJustFinish:true,isLoaded:true});await pending;h.calls.length=0;const cue=h.pool.reserve(false);cue.land();assert.deepEqual(h.calls,[{i:0,muted:false}]);cue.cancel();});
test('reset or exit cancels reserved contact; completed player is rewound between moves',async()=>{const h=setup();await h.pool.prepare();const cancelled=h.pool.reserve(false);cancelled.cancel();cancelled.land();assert.equal(h.calls.length,0);const first=h.pool.reserve(false);first.land();h.players[0].emit({didJustFinish:true});await flush();const next=h.pool.reserve(false);first.cancel();next.land();assert.equal(h.calls.length,2);next.cancel();});
test('fast next move selects another ready original instead of queueing behind a playing clip',async()=>{const h=setup();await h.pool.prepare();const a=h.pool.reserve(false);a.land();const b=h.pool.reserve(false);b.land();assert.deepEqual(h.calls,[{i:0,muted:false},{i:1,muted:false}]);a.cancel();b.cancel();});
test('scheduled contact starts before touchdown by its measured PCM impact time and cancels on exit',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const h=setup();await h.pool.prepare();const cue=h.pool.reserve(false);
 cue.schedule(220);await flush();assert.equal(h.calls.length,0);
 t.mock.timers.tick(220-cue.impactMs-1);assert.equal(h.calls.length,0);
 t.mock.timers.tick(2);assert.equal(h.calls.length,1);cue.land();assert.equal(h.calls.length,1);cue.cancel();
 const cancelled=h.pool.reserve(false);cancelled.schedule(220);cancelled.cancel();t.mock.timers.tick(500);assert.equal(h.calls.length,1);
});
test('concurrent reservations own different players; progress and duplicate callbacks cannot play again',async()=>{const h=setup();await h.pool.prepare();const a=h.pool.reserve(false),b=h.pool.reserve(false);a.land();b.land();assert.deepEqual(h.calls.map(c=>c.i),[0,1]);for(const p of h.players)p.emit({currentTime:.2,isLoaded:true});a.land();b.land();assert.equal(h.calls.length,2);a.cancel();b.cancel();});
test('mute cancels but a delayed JS callback does not silently discard an active placement',async t=>{t.mock.timers.enable({apis:['setTimeout']});let now=0;t.mock.method(Date,'now',()=>now);const h=setup();await h.pool.prepare();const a=h.pool.reserve(false);a.schedule(220,()=>false);t.mock.timers.tick(220);assert.equal(h.calls.length,0);const b=h.pool.reserve(false);b.schedule(220);now=500;t.mock.timers.tick(220);assert.equal(h.calls.length,1);b.cancel();});

test('native play intent is cleared before rewind: no autonomous replay or silent next reuse',async()=>{
 const h=setup();await h.pool.prepare();const p=h.players[0];let playWhenReady=false,automaticReplays=0;
 const originalPlay=p.play.bind(p);p.play=()=>{playWhenReady=true;originalPlay();};
 p.pause=()=>{playWhenReady=false;};p.seekTo=async()=>{if(playWhenReady)automaticReplays++;};
 const first=h.pool.reserve(false);first.land();p.emit({didJustFinish:true});await flush();
 assert.equal(automaticReplays,0);assert.equal(playWhenReady,false);
 const next=h.pool.reserve(false);next.land();assert.deepEqual(h.calls.map(c=>c.i),[0,0]);next.cancel();
});

test('preparing again cannot mute, rewind or steal a reserved player',async()=>{
 const h=setup();await h.pool.prepare();const cue=h.pool.reserve(false);let seeks=0;
 h.players[0].seekTo=async()=>{seeks++;};await h.pool.prepare();assert.equal(seeks,0);
 const next=h.pool.reserve(false);cue.land();next.land();assert.deepEqual(h.calls.map(c=>c.i),[0,1]);cue.cancel();next.cancel();
});
