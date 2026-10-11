// Real listeners and installed Expo hook, mocked OS URL events. No device claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {parseInvitationLink} from './invitationLink.ts';
import {parsePokerInvitation} from '../poker/pokerInvitation.ts';
const dir=decodeURIComponent(new URL('../../',import.meta.url).pathname).replace(/^\/(?:([A-Z]:))/, '$1').replace(/\/$/,'');
const require=createRequire(dir+'/package.json'),React=require('react'),ts=require('typescript'),{create,act}=require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function compile(path,deps){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>{if(!(id in deps))throw Error('Missing mock '+id);return deps[id];},m,m.exports);return m.exports;}
for(const game of ['Domino','Poker'])test(`${game}: a repeated identical warm link is a new user intent`,async()=>{
 const query=game==='Poker'?'pokerRoom':'onlineRoom',url=`domino-online-test://online?${query}=ABCDEF0123`,events=new Set(),opened=[];
 const rn={async getInitialURL(){return url;},addEventListener(type,fn){events.add(fn);return {remove(){events.delete(fn);}};}};
 const linking=compile(dir+'/node_modules/expo-linking/src/Linking.ts',{'expo-modules-core':{UnavailabilityError:Error},react:React,'react-native':{Platform:{OS:'android'}},'./ExpoLinking':{},'./RNLinking':rn,'./Linking.types':{},'./Schemes':{},'./createURL':{parse(){}},'./validateURL':{validateURL(){}}});
 const filename=game==='Poker'?'/src/poker/PokerOnlineLinkListener.tsx':'/src/online/OnlineLinkListener.tsx';
 const name=game==='Poker'?'PokerOnlineLinkListener':'OnlineLinkListener';
 const deps={react:React,'react-native':{Platform:{OS:'android'}},'expo-linking':linking,'../../app.json':{expo:{scheme:'domino-online-test'}},'../nav/NavContext':{useNav:()=>({openPokerOnline:code=>opened.push(code),openOnlineInvitation:code=>opened.push(code)})},'./pokerInvitation':{parsePokerInvitation},'./invitationLink':{parseInvitationLink}};
 const Listener=compile(dir+filename,deps)[name];let tree;
 await act(async()=>{tree=create(React.createElement(Listener));});
 try{
  assert.deepEqual(opened,['ABCDEF0123'],'Cold launch routes once');
  // User has returned Home. A fresh OS event repeats the same shared URL.
  await act(async()=>{for(const fn of events)fn({url});});
  assert.deepEqual(opened,['ABCDEF0123','ABCDEF0123'],'A fresh tap must reopen the game even if its URL text is unchanged');
 }finally{await act(async()=>tree.unmount());}
});
test('a warm Domino intent must beat a late initial Poker URL',async()=>{
 let initialResolve;const initial=new Promise(resolve=>{initialResolve=resolve;}),events=new Set(),opened=[];
 const rn={getInitialURL:()=>initial,addEventListener(type,fn){events.add(fn);return {remove(){events.delete(fn);}};}};
 const linking=compile(dir+'/node_modules/expo-linking/src/Linking.ts',{'expo-modules-core':{UnavailabilityError:Error},react:React,'react-native':{Platform:{OS:'android'}},'./ExpoLinking':{},'./RNLinking':rn,'./Linking.types':{},'./Schemes':{},'./createURL':{parse(){}},'./validateURL':{validateURL(){}}});
 const deps={react:React,'react-native':{Platform:{OS:'android'}},'expo-linking':linking,'../../app.json':{expo:{scheme:'domino-online-test'}},'../nav/NavContext':{useNav:()=>({openPokerOnline:code=>opened.push(['Poker',code]),openOnlineInvitation:code=>opened.push(['Domino',code])})},'./pokerInvitation':{parsePokerInvitation},'./invitationLink':{parseInvitationLink}};
 const D=compile(dir+'/src/online/OnlineLinkListener.tsx',deps).OnlineLinkListener,P=compile(dir+'/src/poker/PokerOnlineLinkListener.tsx',deps).PokerOnlineLinkListener;let tree;
 await act(async()=>{tree=create(React.createElement(React.Fragment,null,React.createElement(D),React.createElement(P)));});
 try{
  await act(async()=>{for(const fn of events)fn({url:'domino-online-test://online?onlineRoom=1122334455'});});
  assert.deepEqual(opened,[['Domino','1122334455']]);
  await act(async()=>initialResolve('domino-online-test://online?pokerRoom=ABCDEF0123'));
  assert.deepEqual(opened,[['Domino','1122334455']],'An older cold intent must not supersede a newer warm event');
 }finally{await act(async()=>tree.unmount());}
});
