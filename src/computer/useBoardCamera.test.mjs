import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps={}) {
  const module={exports:{}};
  const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('require','module','exports',code)(id=>deps[id],module,module.exports);
  return module.exports;
}
const layout=load('./boardLayout.ts');
const deck=[];
for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)deck.push({id:`${a}-${b}`,a,b});
async function mount() {
  let animations=[],completion,stops=0,paintFrames=[];
  class Value {
    constructor(value){this.value=value;this.listeners=new Map();}
    addListener(fn){const id=String(this.listeners.size);this.listeners.set(id,fn);return id;}
    removeListener(id){this.listeners.delete(id);}
    setValue(value){this.value=props.nativePrecision?Math.fround(value):value;for(const fn of this.listeners.values())fn({value:this.value});}
    stopAnimation(){stops++;animations=animations.filter(animation=>animation.value!==this);}
  }
  const Animated={Value,timing:(value,config)=>({value,config}),parallel:items=>({start(done){animations.push(...items);completion=done;}})};
  const {useBoardCamera}=load('./useBoardCamera.ts',{react:React,'react-native':{Animated,Easing:{out:value=>value,cubic:value=>value}},'./boardLayout':layout,'./DrinkGift':{useReducedMotion:()=>!!props.reduced}});
  let props={board:deck,openingId:deck[14].id,width:366,height:220,round:1},camera,renderer;
  function Probe(){camera=useBoardCamera(props.board,props.openingId,props.width,props.height,props.round);React.useLayoutEffect(()=>{paintFrames.push({...camera.current.current,width:props.width,height:props.height});});return null;}
  await act(()=>{renderer=create(React.createElement(Probe));});
  const finish=()=>{const pending=animations;animations=[];for(const animation of pending)animation.value.setValue(animation.config.toValue);completion?.();completion=undefined;};
  finish();
  return {
    get camera(){return camera;},get paintFrames(){return paintFrames;},get stops(){return stops;},get animations(){return animations;},finish,
    async update(changes){props={...props,...changes};await act(()=>renderer.update(React.createElement(Probe)));},
    async close(){await act(()=>renderer.unmount());},
  };
}
test('next round restores scale before layout can cancel an unfinished camera animation',async()=>{
  const probe=await mount();
  try {
    assert.ok(probe.camera.current.current.scale<.5);
    await probe.update({board:[],openingId:null,round:2});
    // Layout arrives before any queued 320ms animation has completed.
    await probe.update({height:300});
    probe.finish();
    await probe.update({board:[deck[14]],openingId:deck[14].id});
    probe.finish();
    assert.equal(probe.camera.current.current.scale,1);
    for(let round=3;round<=4;round++){
      await probe.update({board:deck,openingId:deck[14].id,height:220});probe.finish();
      assert.ok(probe.camera.current.current.scale<.5);
      await probe.update({board:[],openingId:null,round});
      await probe.update({height:300});probe.finish();
      assert.equal(probe.camera.current.current.scale,1);
    }
  } finally {await probe.close();}
});
test('new round identity resets even if the rendered chain count is unchanged',async()=>{
  const probe=await mount();
  try {
    await probe.update({board:[deck[14]],openingId:deck[14].id});probe.finish();
    // Model an interrupted previous camera, with the same one-tile count.
    await act(()=>probe.camera.values.scale.setValue(.4));
    await probe.update({board:[{...deck[14]}],round:2});
    probe.finish();assert.equal(probe.camera.current.current.scale,1);
  } finally {await probe.close();}
});
test('chain growth fits smoothly but freed layout space does not reset zoom',async()=>{
  const probe=await mount();
  try {
    await probe.update({board:[],openingId:null,round:2});probe.finish();
    assert.equal(probe.camera.current.current.scale,1);
    await probe.update({board:[deck[14]],openingId:deck[14].id});probe.finish();
    await probe.update({board:deck,openingId:deck[14].id});
    const scaleAnimation=probe.animations.find(animation=>animation.value===probe.camera.values.scale);
    assert.ok(scaleAnimation.config.toValue<.5);
    assert.equal(scaleAnimation.config.duration,320);
    assert.equal(probe.camera.current.current.scale,1);
    probe.finish();const shrunk=probe.camera.current.current.scale;
    await probe.update({height:500});probe.finish();
    assert.equal(probe.camera.current.current.scale,shrunk);
  } finally {await probe.close();}
});
test('explicit Center retains its normal animated fit within a round',async()=>{
  const probe=await mount();
  try {
    await probe.update({board:[],openingId:null,round:2});probe.finish();
    await probe.update({board:[deck[14]],openingId:deck[14].id});probe.finish();
    await act(()=>probe.camera.values.scale.setValue(.4));
    await act(()=>probe.camera.center());
    const scaleAnimation=probe.animations.find(animation=>animation.value===probe.camera.values.scale);
    assert.equal(scaleAnimation.config.duration,320);
    assert.equal(scaleAnimation.config.toValue,1);
    assert.equal(probe.camera.current.current.scale,.4);
    probe.finish();assert.equal(probe.camera.current.current.scale,1);
  } finally {await probe.close();}
});

test('two-row hand reduction retains screen positions and scale; identical snapshots stay still',async()=>{
 const probe=await mount();try{
  await probe.update({height:270});probe.finish();const initial={...probe.camera.current.current};
  await probe.update({height:120});probe.finish();assert.ok(probe.camera.current.current.scale<initial.scale);const compact={...probe.camera.current.current};
  await probe.update({height:270});probe.finish();
  assert.equal(probe.camera.current.current.scale,compact.scale);assert.equal(120/2+compact.y,270/2+probe.camera.current.current.y);
  await probe.update({board:deck.map(t=>({...t}))});assert.equal(probe.animations.length,0);
 }finally{await probe.close();}
});

test('equivalent snapshots do not restart fitting mid-animation; manual pan keeps its zoom until Center',async()=>{
 const probe=await mount();try{
  await probe.update({height:120});const pending=probe.animations;
  await probe.update({board:deck.map(t=>({...t}))});assert.strictEqual(probe.animations,pending);probe.finish();
  const zoom=probe.camera.current.current.scale;await act(()=>{probe.camera.begin();probe.camera.pan(0,0);probe.camera.end();});
  await probe.update({height:270});probe.finish();assert.equal(probe.camera.current.current.scale,zoom);
  await act(()=>probe.camera.center());probe.finish();assert.ok(probe.camera.current.current.scale>zoom);
 }finally{await probe.close();}
});
test('enabling reduced motion settles a pending reframe without continuing the animated transition',async()=>{
 const probe=await mount();try{await probe.update({height:120});assert.ok(probe.animations.length);await probe.update({reduced:true});assert.ok(probe.animations.every(a=>a.config.duration===0));probe.finish();}finally{await probe.close();}
});

// Actual placed tiles fit; reserving another empty end must not reframe the table.
test('opening centers once and two contained placements keep scale and positions on both ends',async()=>{for(const side of ['left','right']){const p=await mount();try{const opening=deck[14];await p.update({board:[opening],openingId:opening.id,width:300,height:400,round:2});p.finish();assert.ok(Math.abs(p.camera.current.current.x)<1e-8&&Math.abs(p.camera.current.current.y-16)<1e-8);assert.equal(p.camera.current.current.scale,1);const initial={...p.camera.current.current};await p.update({board:side==='left'?[deck[1],opening]:[opening,deck[1]]});assert.equal(p.animations.length,0,'a fitting placement must not start a camera transition');assert.deepEqual(p.camera.current.current,initial);}finally{await p.close();}}});
test('freeing hand space preserves screen positions and zoom instead of recentering automatically',async()=>{const p=await mount();try{await p.update({height:120});p.finish();const before={...p.camera.current.current};await p.update({height:400});p.finish();assert.equal(p.camera.current.current.scale,before.scale);assert.equal(120/2+before.y,400/2+p.camera.current.current.y);}finally{await p.close();}});

test('contained chain preserves its physical position without restarting transforms when turn text changes surface height',async()=>{const p=await mount();try{await p.update({board:[],openingId:null,round:2,height:300});p.finish();await p.update({board:[deck[14]],openingId:deck[14].id});p.finish();const before={...p.camera.current.current},stops=p.stops;await p.update({height:280});assert.equal(p.animations.length,0);assert.equal(p.stops,stops);assert.equal(p.camera.current.current.y+140,before.y+150);assert.equal(p.camera.current.current.scale,before.scale);}finally{await p.close();}});

test('native float rounding does not restart a contained camera after a fractional viewport resize',async()=>{const p=await mount();try{await p.update({board:[],openingId:null,round:2,height:300,nativePrecision:true});p.finish();await p.update({board:[deck[14]],openingId:deck[14].id});p.finish();const before={...p.camera.current.current};await p.update({height:280.3});assert.equal(p.animations.length,0);assert.ok(Math.abs(p.camera.current.current.y+140.15-(before.y+150))<.001);}finally{await p.close();}});

test('initial fit and round reset are ready before the first paint rather than one oversized frame',async()=>{const p=await mount();try{assert.ok(p.paintFrames[0].scale<.5,'initial painted board must fit');await p.update({board:[deck[14]],openingId:deck[14].id,round:2,height:300});assert.equal(p.paintFrames.at(-1).scale,1);}finally{await p.close();}});
test('turn text viewport resize preserves tile screen position in the first paint, not after a passive effect',async()=>{const p=await mount();try{await p.update({board:[],openingId:null,round:2,height:300});await p.update({board:[deck[14]],openingId:deck[14].id});const before={...p.paintFrames.at(-1)};await p.update({height:280});const first=p.paintFrames.at(-1);assert.equal(first.y+first.height/2,before.y+before.height/2);assert.equal(first.scale,before.scale);assert.equal(p.animations.length,0);}finally{await p.close();}});

function localNoticeMinimum(hasAction=false,fontScale=1){
 const source=readFileSync(new URL('../screens/ComputerGameScreen.tsx',import.meta.url),'utf8');
 const parsed=ts.createSourceFile('table.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;
 function visit(node){if(ts.isJsxOpeningElement(node)&&node.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(parsed)==='testID'&&p.initializer?.text==='below-hand-notice')){const style=node.attributes.properties.find(p=>p.name?.getText(parsed)==='style').initializer.expression;expression=style.properties.find(p=>p.name?.getText(parsed)==='minHeight').initializer.getText(parsed);}ts.forEachChild(node,visit);}visit(parsed);assert.ok(expression);
 return new Function('game','noticeHeight','hasAction','windowSize','return '+expression)({result:null},36,hasAction,{fontScale});
}
test('edge-fitted board stays still across human, computer and action messages in the actual local notice lane',async()=>{const p=await mount();try{
 const humanLane=Math.max(localNoticeMinimum(false),38),computerLane=Math.max(localNoticeMinimum(false),34),actionLane=Math.max(localNoticeMinimum(true),48);
 await p.update({height:300-humanLane});p.finish();const before={...p.camera.current.current};
 for(const lane of [computerLane,actionLane,humanLane,computerLane,humanLane]){await p.update({height:300-lane,board:deck.map(t=>({...t}))});assert.equal(p.animations.length,0,'turn-only status changes must not trigger fitting near an edge');assert.deepEqual(p.camera.current.current,before,'same chain must keep its framing on each turn');}
 assert.ok(localNoticeMinimum(false,1.5)>=52*1.5,'reserve two concise lines and tap targets at system text size');
}finally{await p.close();}});

test('concise notice lane recovers space while keeping the same size for turn and actions',()=>{assert.equal(localNoticeMinimum(false),52);assert.equal(localNoticeMinimum(true),52);});

test('opening sits sixteen pixels lower and contained additions retain its position',async()=>{const p=await mount();try{await p.update({board:[],openingId:null,round:2,width:700,height:700});p.finish();await p.update({board:[deck[14]],openingId:deck[14].id});p.finish();assert.equal(p.camera.current.current.y,16);const before={...p.camera.current.current};await p.update({board:[deck[14],deck[15]]});assert.deepEqual(p.camera.current.current,before);assert.equal(p.animations.length,0);}finally{await p.close();}});
