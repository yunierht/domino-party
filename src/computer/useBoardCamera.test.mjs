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
  let animations=[];
  class Value {
    constructor(value){this.value=value;this.listeners=new Map();}
    addListener(fn){const id=String(this.listeners.size);this.listeners.set(id,fn);return id;}
    removeListener(id){this.listeners.delete(id);}
    setValue(value){this.value=value;for(const fn of this.listeners.values())fn({value});}
    stopAnimation(){animations=animations.filter(animation=>animation.value!==this);}
  }
  const Animated={Value,timing:(value,config)=>({value,config}),parallel:items=>({start(){animations.push(...items);}})};
  const {useBoardCamera}=load('./useBoardCamera.ts',{react:React,'react-native':{Animated,Easing:{out:value=>value,cubic:value=>value}},'./boardLayout':layout,'./DrinkGift':{useReducedMotion:()=>false}});
  let props={board:deck,openingId:deck[14].id,width:366,height:220,round:1},camera,renderer;
  function Probe(){camera=useBoardCamera(props.board,props.openingId,props.width,props.height,props.round);return null;}
  await act(()=>{renderer=create(React.createElement(Probe));});
  const finish=()=>{const pending=animations;animations=[];for(const animation of pending)animation.value.setValue(animation.config.toValue);};
  finish();
  return {
    get camera(){return camera;},get animations(){return animations;},finish,
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
test('chain growth still animates fitting and never enlarges within the same round',async()=>{
  const probe=await mount();
  try {
    await probe.update({board:[],openingId:null,round:2});probe.finish();
    assert.equal(probe.camera.current.current.scale,1);
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
