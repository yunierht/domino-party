// App + real navigation/listeners/parsers; OS events and storage readiness are doubles.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {pokerInvitation} from './src/poker/pokerInvitation.ts';
import {invitationLink} from './src/online/invitationLink.ts';
const require=createRequire(import.meta.url),landing=require('./web/online-invitation/landing.js');
const profile=JSON.parse(fs.readFileSync(new URL('./config/social-club-update.json',import.meta.url),'utf8'));
process.env.EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE=profile.origin+'/online/invite';
process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE=profile.origin+'/online/invite';
process.env.EXPO_PUBLIC_DOMINO_ONLINE_SCHEME=profile.scheme;
const shareFile=fs.readFileSync(new URL('./src/online/InvitationShareOptions.tsx',import.meta.url),'utf8'),shareAst=ts.createSourceFile('Share.tsx',shareFile,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const shareFunction=shareAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='invitationShareContent');
const shareModule={exports:{}};new Function('module','exports',ts.transpileModule(shareFunction.getText(shareAst),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(shareModule,shareModule.exports);
const {invitationShareContent}=shareModule.exports;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const source=fs.readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
async function mount(ready,loaded,initialURL=null){
 const events=new Set(),cache=new Map();
 const native={View:'View',Platform:{OS:'android'},BackHandler:{addEventListener:()=>({remove(){}})}};
 const linking={useURL:()=>null,getInitialURL:async()=>initialURL,addEventListener:(_kind,fn)=>{events.add(fn);return{remove:()=>events.delete(fn)}}};
 const pass=({children})=>children;
 const overrides={react:React,'react-native':native,'expo-linking':linking,'expo-status-bar':{StatusBar:'StatusBar'},'react-native-safe-area-context':{SafeAreaProvider:pass,SafeAreaView:'SafeAreaView'},'./src/theme/ThemeContext':{ThemeProvider:pass,useTheme:()=>({ready,theme:{dark:true,colors:{bg:'#081D1B'}}})},'./src/state/GameContext':{GameProvider:pass,useGame:()=>({loaded})},'./src/hooks/useTilt':{useTilt:()=>({x:0,y:0})},'./src/components/GameSettingsBoundary':{GameSettingsBoundary:pass}};
 const real=new Set(['src/nav/NavContext.tsx','src/poker/PokerOnlineLinkListener.tsx','src/online/OnlineLinkListener.tsx','src/poker/pokerInvitation.ts','src/online/invitationLink.ts']);
 function compile(file){
  if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  const text=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',code)(id=>{
   if(file==='App.tsx'&&overrides[id])return overrides[id];
   if(id==='react')return React;if(id==='react-native')return native;if(id==='expo-linking')return linking;
   if(id.endsWith('app.json'))return{expo:{scheme:'dominoparty'}};
   const base=path.posix.normalize(path.posix.join(path.posix.dirname(file),id));
   const target=[base+'.tsx',base+'.ts'].find(f=>real.has(f));if(target)return compile(target);
   const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
   const declaration=ast.statements.find(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text===id);
   const result={};for(const spec of declaration?.importClause?.namedBindings?.elements??[]){const name=spec.propertyName?.text??spec.name.text;result[name]=name.endsWith('Provider')?pass:['PokerOnlineScreen','OnlineInvitationEntry'].includes(name)?()=>{const nav=compile('src/nav/NavContext.tsx').useNav();return React.createElement(name,{receivedCode:name==='PokerOnlineScreen'?nav.pendingPokerCode:nav.onlineInvitation?.code});}:name;}
   return result;
  },m,m.exports);return m.exports;
 }
 const App=compile('App.tsx').default;let tree;
 await act(async()=>{tree=create(React.createElement(App))});
 return{tree,events,emit:url=>act(()=>{for(const fn of events)fn({url})}),finish:()=>act(()=>{ready=true;loaded=true;tree.update(React.createElement(App))}),close:()=>act(()=>tree.unmount())};
}
for(const [ready,loaded] of [[false,false],[true,false],[false,true]])for(const game of ['poker','domino'])test(`${game}: a canonical URL received while startup waits (${ready}/${loaded}) survives into navigation`,async()=>{
 const f=await mount(ready,loaded);try{
  assert.equal(f.tree.root.findAllByType('FullScreenLoader').length,1);
  await f.emit(`dominoparty://online?${game==='poker'?'pokerRoom':'onlineRoom'}=ABCDEF0123`);
  await f.finish();
  assert.equal(f.tree.root.findAllByType(game==='poker'?'PokerOnlineScreen':'OnlineInvitationEntry').length,1,'the boot URL must select its game, not remain on Home');
  assert.equal(f.events.size,2,'exactly one listener per game after loading');
 }finally{await f.close();assert.equal(f.events.size,0)}
});

// Fixture room IDs, real generator -> Android Share payload -> landing -> listeners -> NavProvider.
// This does not exercise WhatsApp, Android intent delivery, or a live room.
for(const game of ['poker','domino'])for(const mode of ['cold','boot-warm','ready-warm'])for(const route of ['https','landing'])test(`${game}: published ${route} share URL reaches its room through ${mode}`,async()=>{
 const code='ABCDEF0123',base=profile.origin+'/online/invite';
 const url=(game==='poker'?pokerInvitation:invitationLink)(code,base,profile.scheme);
 const payload=invitationShareContent({url,text:'Private invitation. Code 123456.',code:'123456'},'android');
 assert.equal(payload.message.split('\n').at(-1),url);assert.equal(payload.url,undefined);
 let received=payload.message.split('\n').at(-1);
 if(route==='landing'){
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,addEventListener(){}});return nodes.get(id)};
  landing.mount({location:new URL(received),navigator:{userAgent:'Android'},ONLINE_INVITATION_CONFIG:{...profile,purpose:'release',automaticStoreFallback:false},document:{getElementById:node,addEventListener(){}},addEventListener(){}});
  received=node('open').href;assert.equal(node('open').hidden,false);
  assert.equal(received,`${profile.scheme}://online?${game==='poker'?'pokerRoom':'onlineRoom'}=${code}`);
 }
 const f=await mount(mode==='ready-warm',mode==='ready-warm',mode==='cold'?received:null);
 try{
  if(mode!=='cold')await f.emit(received);await f.finish();
  const screen=f.tree.root.findByType(game==='poker'?'PokerOnlineScreen':'OnlineInvitationEntry');assert.equal(screen.props.receivedCode,code);
 }finally{await f.close()}
});
