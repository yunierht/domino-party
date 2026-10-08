import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./trackingAppearanceStore.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,m,m.exports);return m.exports;}
test('appearance defaults and invalid saved values are safe',()=>{
 const {normalizeTrackingAppearance}=load();
 assert.deepEqual(normalizeTrackingAppearance(null),{style:'robotic',teamAColor:'yellow',teamBColor:'red'});
 assert.deepEqual(normalizeTrackingAppearance({style:'unknown',teamBColor:'purple'}),{style:'robotic',teamAColor:'yellow',teamBColor:'red'});
 assert.deepEqual(normalizeTrackingAppearance({style:'orbital',teamAColor:'yellow',teamBColor:'blue'}),{style:'orbital',teamAColor:'yellow',teamBColor:'blue'});
});
test('each team supports all four colors, cycling independently and preserving saved choices',async()=>{
 const {createTrackingAppearanceStore,nextTrackingColor}=load();let saved;
 const deps={read:async()=>saved,write:async v=>{saved=v;}};
 const store=createTrackingAppearanceStore(deps);await store.hydrate();
 for(const key of ['teamAColor','teamBColor']){
  const other=key==='teamAColor'?'teamBColor':'teamAColor';const otherBefore=store.getSnapshot()[other],start=store.getSnapshot()[key];const visited=[];
  for(let i=0;i<4;i++){store.update({[key]:nextTrackingColor(store.getSnapshot()[key])});visited.push(store.getSnapshot()[key]);assert.equal(store.getSnapshot()[other],otherBefore);}
  assert.deepEqual([...new Set(visited)].sort(),['blue','green','red','yellow']);assert.equal(store.getSnapshot()[key],start);
 }
 store.update({teamAColor:'blue',teamBColor:'green'});await store.flush();
 const reopened=createTrackingAppearanceStore(deps);await reopened.hydrate();assert.equal(reopened.getSnapshot().teamAColor,'blue');assert.equal(reopened.getSnapshot().teamBColor,'green');
});
test('independent choices survive reopening without touching match storage',async()=>{
 const {createTrackingAppearanceStore}=load();let saved={style:'robotic',teamAColor:'yellow',teamBColor:'red'};const writes=[];
 const deps={read:async()=>saved,write:async value=>{saved=value;writes.push(value);}};
 const store=createTrackingAppearanceStore(deps);await store.hydrate();
 store.update({style:'speedometer'});store.update({teamBColor:'blue'});await store.flush();
 const reopened=createTrackingAppearanceStore(deps);await reopened.hydrate();
 assert.deepEqual(reopened.getSnapshot(),{style:'speedometer',teamAColor:'yellow',teamBColor:'blue',ready:true});
 assert.deepEqual(writes,[{style:'speedometer',teamAColor:'yellow',teamBColor:'red'},{style:'speedometer',teamAColor:'yellow',teamBColor:'blue'}]);
});
test('a user choice during loading wins without losing the other saved preference',async()=>{
 const {createTrackingAppearanceStore}=load();let resolveRead;const writes=[];
 const store=createTrackingAppearanceStore({read:()=>new Promise(resolve=>{resolveRead=resolve;}),write:async v=>writes.push(v)});
 const loading=store.hydrate();store.update({teamBColor:'blue'});resolveRead({style:'orbital',teamAColor:'yellow',teamBColor:'red'});await loading;await store.flush();
 assert.deepEqual(store.getSnapshot(),{style:'orbital',teamAColor:'yellow',teamBColor:'blue',ready:true});
 assert.deepEqual(writes,[{style:'orbital',teamAColor:'yellow',teamBColor:'blue'}]);
});
test('rapid changes serialize writes and notify subscribers immediately',async()=>{
 const {createTrackingAppearanceStore}=load();let release;const calls=[];
 const store=createTrackingAppearanceStore({read:async()=>null,write:async v=>{calls.push(v);if(calls.length===1)await new Promise(resolve=>{release=resolve;});}});
 await store.hydrate();let notified=0;const unsubscribe=store.subscribe(()=>notified++);
 store.update({style:'speedometer'});store.update({style:'orbital',teamAColor:'yellow',teamBColor:'blue'});await Promise.resolve();await Promise.resolve();
 assert.equal(notified,2);assert.equal(calls.length,1);release();await store.flush();
 assert.deepEqual(calls.at(-1),{style:'orbital',teamAColor:'yellow',teamBColor:'blue'});unsubscribe();
});
test('storage failure leaves a usable local choice and does not block later writes',async()=>{
 const {createTrackingAppearanceStore}=load();let attempt=0;
 const store=createTrackingAppearanceStore({read:async()=>{throw Error('offline');},write:async()=>{if(++attempt===1)throw Error('full');}});
 await store.hydrate();store.update({teamBColor:'blue'});store.update({style:'orbital'});await store.flush();
 assert.equal(attempt,2);assert.deepEqual(store.getSnapshot(),{style:'orbital',teamAColor:'yellow',teamBColor:'blue',ready:true});
});

test('Team A yellow/green changes independently of style and Team B red/blue',async()=>{
 const {createTrackingAppearanceStore}=load();let saved;
 const store=createTrackingAppearanceStore({read:async()=>null,write:async value=>{saved=value;}});await store.hydrate();
 store.update({teamAColor:'green'});store.update({teamBColor:'blue'});store.update({style:'speedometer'});await store.flush();
 assert.deepEqual(saved,{style:'speedometer',teamAColor:'green',teamBColor:'blue'});
 store.update({teamAColor:'yellow'});assert.equal(store.getSnapshot().teamBColor,'blue');assert.equal(store.getSnapshot().style,'speedometer');
});
test('explicitly choosing a visible default while loading overrides an older saved choice',async()=>{
 const {createTrackingAppearanceStore}=load();let resolveRead;
 const store=createTrackingAppearanceStore({read:()=>new Promise(resolve=>{resolveRead=resolve;}),write:async()=>{}});
 const loading=store.hydrate();store.update({style:'robotic',teamAColor:'yellow'});
 resolveRead({style:'orbital',teamAColor:'green',teamBColor:'blue'});await loading;
 assert.deepEqual(store.getSnapshot(),{style:'robotic',teamAColor:'yellow',teamBColor:'blue',ready:true});
});

test('two rapid setup taps use the latest store snapshot rather than a stale rendered color',async()=>{
 const source=fs.readFileSync(new URL('./useTrackingAppearance.ts',import.meta.url),'utf8'),m={exports:{}},factory=load();
 const deps={react:{useEffect:fn=>fn(),useSyncExternalStore:(_,get)=>get()},'../storage/storage':{loadJSON:async()=>null,saveJSON:async()=>{}},'./trackingAppearanceStore':factory};
 new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>deps[id],m,m.exports);
 const rendered=m.exports.useTrackingAppearance();rendered.cycleTeamColor('A');rendered.cycleTeamColor('A');
 const current=m.exports.useTrackingAppearance();assert.equal(current.teamAColor,'red');assert.equal(current.teamBColor,'red');
});

test('explicit new match resets all defaults atomically before setup choices, including hydration race',async()=>{
 for(const loading of [false,true]){
  let store,resolveRead;const writes=[],factory=load(),m={exports:{}};
  const deps={react:{useEffect:fn=>fn(),useSyncExternalStore:(_,get)=>get()},'../storage/storage':{loadJSON:()=>new Promise(resolve=>{resolveRead=resolve;}),saveJSON:async(_,value)=>writes.push(value)},'./trackingAppearanceStore':{...factory,createTrackingAppearanceStore:args=>(store=factory.createTrackingAppearanceStore(args))}};
  new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./useTrackingAppearance.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>deps[id],m,m.exports);
  m.exports.useTrackingAppearance();const hydration=store.hydrate();
  const old={style:'orbital',teamAColor:'green',teamBColor:'blue'};
  if(!loading){resolveRead(old);await hydration;assert.equal(m.exports.useTrackingAppearance().style,'orbital');}
  let notifications=0;store.subscribe(()=>notifications++);
  m.exports.resetNewTrackingMatchAppearance();
  assert.deepEqual({...store.getSnapshot(),ready:true},{style:'robotic',teamAColor:'yellow',teamBColor:'red',ready:true});
  if(!loading)assert.equal(notifications,1);
  // User's Setup selection wins even if saved preferences arrive afterwards.
  m.exports.useTrackingAppearance().cycleTeamColor('A');
  if(loading){resolveRead(old);await hydration;}
  await store.flush();assert.deepEqual(writes.at(-1),{style:'robotic',teamAColor:'blue',teamBColor:'red'});
  assert.equal(m.exports.useTrackingAppearance().teamAColor,'blue');
  assert.equal(m.exports.useTrackingAppearance().style,'robotic');
 }
});
