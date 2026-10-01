import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
for(const ended of [false,true]) for(const loaded of [false,true])test(`contact plays once after mode setup, loaded=${loaded}, ended=${ended}`,async()=>{
 const calls=[];let resolve;let statusCallback;const player={remove(){},addListener:(_,cb)=>{statusCallback=cb;return {remove(){}};},isLoaded:loaded,duration:ended?.16:0,volume:0,seekTo:async()=>calls.push('seek'),play:()=>calls.push('play')};
 const deps={'react-native':{Platform:{OS:'android'}},'expo-audio':{createAudioPlayer:src=>{if(src==='tap')throw Error('unrelated tap unavailable');return player;},setAudioModeAsync:mode=>{assert.equal(mode.interruptionMode,'mixWithOthers','cold contact must not request transient Android audio focus');return new Promise(r=>resolve=r);}},'../../assets/sounds/tile-contact-plastic-warm-v3.wav':'contact','../../assets/sounds/tap.wav':'tap'};
 const code=ts.transpileModule(readFileSync(new URL('./sounds.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function('require','module','exports','__DEV__',code)(id=>deps[id],m,m.exports,false);
 m.exports.initSounds();m.exports.playTileContact();assert.deepEqual(calls,[]);resolve();await new Promise(r=>setImmediate(r));if(!loaded&&!ended){assert.deepEqual(calls,[]);player.isLoaded=true;statusCallback({isLoaded:true,currentTime:0});await new Promise(r=>setImmediate(r));}assert.deepEqual(calls,['seek','play']);statusCallback({isLoaded:true,currentTime:.1});assert.equal(player.volume,1);player.isLoaded=false;player.duration=.16;m.exports.playTileContact();await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['seek','play','seek','play'],'completed Android clip must rewind and play again');statusCallback({isLoaded:true,currentTime:.1});
});
test('cold load completed before listener attaches is rechecked after audio mode',async()=>{
 const calls=[];let resolve;const player={isLoaded:false,duration:0,volume:0,remove(){},addListener(){this.isLoaded=true;return {remove(){}};},seekTo:async()=>calls.push('seek'),play:()=>calls.push('play')};
 const deps={'react-native':{Platform:{OS:'android'}},'expo-audio':{createAudioPlayer:()=>player,setAudioModeAsync:mode=>{assert.equal(mode.interruptionMode,'mixWithOthers','cold contact must not request transient Android audio focus');return new Promise(r=>resolve=r);}},'../../assets/sounds/tile-contact-plastic-warm-v3.wav':'contact'};
 const code=ts.transpileModule(readFileSync(new URL('./sounds.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function('require','module','exports','__DEV__',code)(id=>deps[id],m,m.exports,false);m.exports.playTileContact();assert.deepEqual(calls,[]);resolve();await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['seek','play']);
});
for (const loadedInitially of [true, false]) test(`Android prepares once in silence before any contact, loaded=${loadedInitially}`, async()=>{
 const calls=[];const listeners=new Set();let modeResolve;
 const player={id:'same-player',isLoaded:loadedInitially,duration:loadedInitially?.16:0,muted:false,volume:1,remove(){},pause(){calls.push(['pause',this.muted,this.volume]);},addListener(_,cb){listeners.add(cb);return {remove:()=>listeners.delete(cb)};},seekTo:async()=>calls.push(['seek']),play(){calls.push(['play',this.muted,this.volume]);}};
 const emit=status=>{for(const cb of [...listeners])cb(status);};
 const deps={'react-native':{Platform:{OS:'android'}},'expo-audio':{createAudioPlayer:()=>player,setAudioModeAsync:()=>new Promise(r=>modeResolve=r)},'../../assets/sounds/tile-contact-plastic-warm-v3.wav':'contact'};
 const code=ts.transpileModule(readFileSync(new URL('./sounds.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function('require','module','exports','__DEV__',code)(id=>deps[id],m,m.exports,false);
 const prepared=m.exports.prepareTileContact();assert.equal(m.exports.prepareTileContact(),prepared,'concurrent mounts share preparation');assert.deepEqual(calls,[]);modeResolve();await new Promise(r=>setImmediate(r));
 if(!loadedInitially){assert.deepEqual(calls,[]);player.isLoaded=true;player.duration=.16;emit({isLoaded:true,currentTime:0});}
 assert.deepEqual(calls,[['play',true,0]],'first playback is strictly silent');
 let completed=false;prepared.then(()=>completed=true);emit({isLoaded:true,currentTime:.05});await new Promise(r=>setImmediate(r));assert.equal(completed,false,'progress alone is not prepared');
 m.exports.playTileContact();assert.equal(calls.length,1,'contact waits without unmuting preparation');
 player.isLoaded=false;emit({isLoaded:true,currentTime:.16,didJustFinish:true});await prepared;await new Promise(r=>setImmediate(r));
 assert.deepEqual(calls,[['play',true,0],['pause',true,0],['seek'],['play',false,1]]);
 emit({isLoaded:true,currentTime:.04});await m.exports.prepareTileContact();assert.equal(calls.length,4,'new round reuses prepared player');
 m.exports.playTileContact();await new Promise(r=>setImmediate(r));assert.deepEqual(calls.slice(-2),[['seek'],['play',false,1]]);emit({isLoaded:true,currentTime:.04});
});
