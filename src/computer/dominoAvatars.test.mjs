import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import * as identity from '../online/avatarIdentity.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks={}){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>{if(id.endsWith('.png'))return id;if(id in mocks)return mocks[id];if(id.endsWith('/avatarIdentity'))return identity;if(id==='react')return React;if(id==='./SelfieAvatarChoice'||id==='../online/SelfieAvatarChoice')return {SelfieAvatarChoice:'SelfieAvatarChoice'};if(id==='../online/avatarPhoto')return {isValidAvatarPhoto:value=>typeof value==='string'&&value.startsWith('data:image/jpeg;base64,/9j/')};if(id==='./opponents')return load('./opponents.ts');if(id==='./dominoAvatars'||id==='../computer/dominoAvatars')return load('./dominoAvatars.ts');throw Error(id);},module,module.exports);return module.exports;}
test('Domino adds six unique selectable avatars while the shared Poker catalog remains unchanged',()=>{
 const shared=load('./opponents.ts'),domino=load('./dominoAvatars.ts');
 assert.deepEqual(shared.OPPONENTS.map(x=>x.id),['yuni','yoi','diego','rafael','lucia','rigo']);
 assert.equal(domino.DOMINO_AVATARS.length,12);assert.equal(new Set(domino.DOMINO_AVATARS.map(x=>x.id)).size,12);
 assert.deepEqual(domino.DOMINO_AVATARS.slice(6).map(x=>[x.id,x.name]),[['mateo','Mateo'],['kenji','Kenji'],['oliver','Oliver'],['amara','Amara'],['lina','Lina'],['sofia','Sofía']]);
 for(const avatar of domino.DOMINO_AVATARS.slice(6)){assert.equal(avatar.image,avatar.depthImage);assert.equal(domino.isDominoAvatarId(avatar.id),true);}
 assert.equal(domino.isDominoAvatarId('retired'),false);
});
for(const variant of ['DominoAvatarChoices','DominoAvatarCarousel','OnlinePlayerAvatarPicker'])test(`${variant} selects a new character and retains exactly one selected card`,async()=>{
 const mod=load(variant==='OnlinePlayerAvatarPicker'?'../online/OnlinePlayerAvatarPicker.tsx':'./DominoAvatarChoices.tsx',{'react-native':{View:'View',ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',Image:'Image'},'./tableTheme':{TABLE:{}},'../computer/tableTheme':{TABLE:{}}});
 let selected,root;await act(async()=>{root=create(React.createElement(mod[variant],{selected:'sofia',onSelect:id=>{selected=id;},es:true}));});
 try{const buttons=root.root.findAllByType('Pressable');assert.equal(buttons.length,12);assert.equal(buttons.filter(b=>b.props.accessibilityState.selected).length,1);
  const sofia=buttons.find(b=>b.props.accessibilityLabel.includes('Sofía'));assert.ok(sofia.props.accessibilityState.selected);await act(()=>sofia.props.onPress());assert.equal(selected,'sofia');
 }finally{await act(()=>root.unmount());}
});

for(const variant of ['DominoAvatarChoices','DominoAvatarCarousel','OnlinePlayerAvatarPicker'])test(`${variant} places selfie first and saves it separately`,async()=>{
 const mod=load(variant==='OnlinePlayerAvatarPicker'?'../online/OnlinePlayerAvatarPicker.tsx':'./DominoAvatarChoices.tsx',{'react-native':{View:'View',ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',Image:'Image'},'./tableTheme':{TABLE:{}},'../computer/tableTheme':{TABLE:{}}});
 let selected,saved,root;const clear=()=>{};await act(()=>{root=create(React.createElement(mod[variant],{selected:'selfie',photo:'saved',onSelect:id=>{selected=id;},onSavePhoto:photo=>{saved=photo;},onClearPhoto:clear,es:true}));});
 try{const selfie=root.root.findByType('SelfieAvatarChoice');assert.equal(selfie.props.selected,true);assert.equal(selfie.props.photo,'saved');if(variant==='OnlinePlayerAvatarPicker')assert.equal(selfie.props.onClear,clear);const parent=selfie.parent;assert.ok(parent.children[0]===selfie,'selfie is the first choice');
  await act(()=>selfie.props.onSelect());assert.equal(selected,'selfie');await act(()=>selfie.props.onSave('new'));assert.equal(saved,'new');
 }finally{await act(()=>root.unmount());}
});
test('new own and rival preferences restore independently and never change the shared Poker opponent',async()=>{
 const saved=new Map([['dominoes:computerOpponent','rigo'],['dominoes:onlineDominoOpponent','kenji'],['dominoes:onlinePlayerAvatar','sofia']]),writes=[];
 const mod=load('./ComputerGameContext.tsx',{'./engine':{deal:(name,target)=>({playerName:name,target})},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:async key=>saved.get(key)??null,saveJSON:async(key,value)=>{saved.set(key,value);writes.push([key,value]);}}});
 let value,root;function Probe(){value=mod.useComputerGame();return null;}
 await act(async()=>{root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 try{assert.equal(value.opponentId,'rigo');assert.equal(value.dominoOpponentId,'kenji');assert.equal(value.playerAvatarId,'sofia');
  await act(()=>value.setDominoOpponentId('mateo'));await act(()=>value.setPlayerAvatarId('amara'));assert.equal(value.opponentId,'rigo');assert.equal(value.dominoOpponentId,'mateo');assert.equal(value.playerAvatarId,'amara');
  await act(()=>value.start('Juni',100));assert.equal(value.dominoOpponentId,'mateo');assert.equal(value.playerAvatarId,'amara');
  assert.equal(saved.get('dominoes:computerOpponent'),'rigo');assert.equal(saved.get('dominoes:onlineDominoOpponent'),'mateo');assert.equal(saved.get('dominoes:onlinePlayerAvatar'),'amara');
 }finally{await act(()=>root.unmount());}
});

test('explicit own and rival choices survive late stored values, while a legacy rival restores shared behavior',async()=>{
 const pending=new Map(),saved=new Map();
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:key=>new Promise(resolve=>pending.set(key,resolve)),saveJSON:async(key,value)=>saved.set(key,value)}});
 let value,root;function Probe(){value=mod.useComputerGame();return null;}
 await act(async()=>{root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 try{
  await act(()=>{value.setDominoOpponentId('lina');value.setPlayerAvatarId('oliver');});
  await act(async()=>{pending.get('dominoes:computerOpponent')('rigo');pending.get('dominoes:onlineDominoOpponent')('mateo');pending.get('dominoes:onlinePlayerAvatar')('sofia');pending.get('dominoes:onlinePlayerAvatarPhoto')(null);pending.get('dominoes:onlineDominoOpponentPhoto')(null);pending.get('dominoes:onlinePlayerAvatarName')(null);pending.get('dominoes:onlineDominoOpponentName')(null);});
  assert.equal(value.dominoOpponentId,'lina');assert.equal(value.playerAvatarId,'oliver');assert.equal(value.opponentId,'rigo');
  assert.equal(saved.get('dominoes:onlineDominoOpponent'),'lina');assert.equal(saved.get('dominoes:onlinePlayerAvatar'),'oliver');
  await act(()=>value.setDominoOpponentId('diego'));
  assert.equal(value.opponentId,'diego');assert.equal(value.dominoOpponentId,'diego');assert.equal(saved.get('dominoes:onlineDominoOpponent'),null);
  await act(()=>value.setOpponentId('rafael'));assert.equal(value.dominoOpponentId,'rafael');assert.equal(value.playerAvatarId,'oliver');
 }finally{await act(()=>root.unmount());}
});

test('selfie preferences restore independently, invalid photos cannot select selfie, and retakes persist as defaults',async()=>{
 const own='data:image/jpeg;base64,/9j/OWN',rival='data:image/jpeg;base64,/9j/RIVAL';
 const saved=new Map([['dominoes:onlinePlayerAvatar','selfie'],['dominoes:onlinePlayerAvatarPhoto',own],['dominoes:onlineDominoOpponent','selfie'],['dominoes:onlineDominoOpponentPhoto','https://invalid/photo.jpg']]);
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:async key=>saved.get(key)??null,saveJSON:async(key,value)=>saved.set(key,value)}});
 let value,root;function Probe(){value=mod.useComputerGame();return null;}
 await act(async()=>{root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 try{
  assert.equal(value.playerAvatarId,'selfie');assert.equal(value.playerAvatarPhoto,own);assert.equal(value.dominoOpponentId,'yuni');assert.equal(value.dominoOpponentPhoto,null);
  await act(()=>value.setDominoOpponentId('selfie'));assert.equal(value.dominoOpponentId,'yuni');
  await act(()=>value.setDominoOpponentPhoto(rival,'  Rival  '));assert.equal(value.dominoOpponentId,'selfie');assert.equal(value.dominoOpponentName,'Rival');assert.equal(value.dominoOpponentPhoto,rival);assert.equal(value.playerAvatarPhoto,own);assert.equal(value.opponentId,'yuni');
  await act(()=>value.setPlayerAvatarPhoto(own,'  Foto propia  '));assert.equal(value.playerAvatarName,'Foto propia');assert.equal(saved.get('dominoes:onlinePlayerAvatarName'),'Foto propia');
  await act(()=>value.setPlayerAvatarPhoto(rival,'  '));assert.equal(value.playerAvatarPhoto,own);assert.equal(value.playerAvatarName,'Foto propia');
  await act(()=>value.setPlayerAvatarPhoto('data:image/svg+xml,bad'));assert.equal(value.playerAvatarPhoto,own);
  await act(()=>value.setPlayerAvatarId('sofia'));assert.equal(value.playerAvatarPhoto,own);await act(()=>value.setPlayerAvatarId('selfie'));assert.equal(value.playerAvatarId,'selfie');
  assert.equal(saved.get('dominoes:onlinePlayerAvatar'),'selfie');assert.equal(saved.get('dominoes:onlinePlayerAvatarPhoto'),own);assert.equal(saved.get('dominoes:onlineDominoOpponentPhoto'),rival);
  await act(()=>value.clearPlayerAvatarPhoto());assert.equal(value.playerAvatarPhoto,null);assert.equal(value.playerAvatarName,null);assert.equal(value.playerAvatarId,'yuni');assert.equal(saved.get('dominoes:onlinePlayerAvatarPhoto'),null);assert.equal(saved.get('dominoes:onlinePlayerAvatarName'),null);assert.equal(saved.get('dominoes:onlinePlayerAvatar'),'yuni');assert.equal(value.dominoOpponentPhoto,rival);assert.equal(value.dominoOpponentName,'Rival');await act(()=>value.setPlayerAvatarId('selfie'));assert.equal(value.playerAvatarId,'yuni');
  await act(()=>value.setPlayerAvatarPhoto(own,'Own'));await act(()=>value.setPlayerAvatarId('sofia'));await act(()=>value.clearPlayerAvatarPhoto());assert.equal(value.playerAvatarId,'sofia');assert.equal(value.playerAvatarPhoto,null);
 }finally{await act(()=>root.unmount());}
});

test('a confirmed selfie before hydration cannot be overwritten by an older stored photo',async()=>{
 const pending=new Map(),saved=new Map(),fresh='data:image/jpeg;base64,/9j/FRESH',old='data:image/jpeg;base64,/9j/OLD';
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:key=>new Promise(resolve=>pending.set(key,resolve)),saveJSON:async(key,value)=>saved.set(key,value)}});
 let value,root;function Probe(){value=mod.useComputerGame();return null;}
 await act(async()=>{root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});
 try{
  await act(()=>{value.setPlayerAvatarPhoto(fresh);value.setDominoOpponentPhoto(fresh);});
  await act(async()=>{for(const[key,resolve]of pending)resolve(key.endsWith('Photo')?old:key==='dominoes:computerOpponent'?'rigo':'selfie');});
  assert.equal(value.playerAvatarId,'selfie');assert.equal(value.playerAvatarPhoto,fresh);assert.equal(value.dominoOpponentId,'selfie');assert.equal(value.dominoOpponentPhoto,fresh);
  assert.equal(saved.get('dominoes:onlinePlayerAvatarPhoto'),fresh);assert.equal(saved.get('dominoes:onlineDominoOpponentPhoto'),fresh);
 }finally{await act(()=>root.unmount());}
});

test('clearing a selfie before hydration cannot restore an older saved selfie',async()=>{
 const pending=new Map(),saved=new Map(),photo='data:image/jpeg;base64,/9j/OLD';
 const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:key=>new Promise(resolve=>pending.set(key,resolve)),saveJSON:async(key,value)=>saved.set(key,value)}});
 let value,root;function Probe(){value=mod.useComputerGame();return null;}
 await act(async()=>{root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe)));});try{
  await act(()=>{value.setPlayerAvatarPhoto(photo,'Selfie');value.clearPlayerAvatarPhoto();});
  await act(async()=>{for(const[key,resolve]of pending)resolve(key.endsWith('Photo')?photo:key.endsWith('Name')?'Old selfie':key==='dominoes:computerOpponent'?'rigo':'selfie');});
  assert.equal(value.playerAvatarPhoto,null);assert.equal(value.playerAvatarName,null);assert.equal(value.playerAvatarId,'yuni');assert.equal(saved.get('dominoes:onlinePlayerAvatarPhoto'),null);assert.equal(value.dominoOpponentPhoto,photo);
 }finally{await act(()=>root.unmount());}
});

test('Settings avatar changes synchronize a retained Domino player name and preserve the hand',async()=>{const mod=load('./ComputerGameContext.tsx',{'./engine':{},'./DrinkGift':{useReducedMotion:()=>false},'./drinkGiftLifecycle':{claimOpponentDrinkExpiry:()=>null,scheduleDrinkGiftExpiry:()=>undefined},'./opponentDrink':{canOpponentDrink:()=>false},'./drinks':{},'../storage/storage':{loadJSON:async()=>null,saveJSON:async()=>{}}});let value,root;function Probe(){value=mod.useComputerGame();return null;}await act(async()=>root=create(React.createElement(mod.ComputerGameProvider,null,React.createElement(Probe))));try{const hand={human:[],computer:[]};await act(()=>value.setGame({playerName:'Old',hands:hand}));await act(()=>value.setPlayerAvatarId('yoi'));assert.equal(value.game.playerName,'Yoi');assert.equal(value.game.hands,hand);await act(()=>value.setPlayerAvatarPhoto('data:image/jpeg;base64,/9j/OWN','My selfie'));assert.equal(value.game.playerName,'My selfie');await act(()=>value.clearPlayerAvatarPhoto());assert.equal(value.game.playerName,'Yuni');}finally{await act(()=>root.unmount());}});
