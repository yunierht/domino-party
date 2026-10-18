import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{create,act}=require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
import {sharePayload} from './invitationLink.ts';
async function mount(savedView=null,overrides={},restored={}){
  const calls=[],listeners=new Set();let instance,tick,backHandler;
  class Client{
    state={view:savedView,busy:false,status:savedView?'connected':'idle',error:null,canResume:!!savedView};
    constructor(){instance=this;} subscribe(fn){listeners.add(fn);fn(this.state);return()=>listeners.delete(fn);}
    emit(patch){this.state={...this.state,...patch};for(const fn of listeners)fn(this.state);}
    get savedRoomCode(){return savedView?.code??restored.code;}
    async load(){calls.push(['load']);if(restored.code)this.emit({canResume:true});}async resume(){calls.push(['resume']);if(restored.wait)await restored.wait;if(restored.patch)this.emit(restored.patch);}async refresh(){calls.push(['refresh']);}
    async disconnect(){calls.push(['disconnect']);}async forget(){calls.push(['forget']);if(restored.forgetError)throw Error('storage_error');this.emit({view:null,canResume:false,error:null,status:'idle'});}
    setResultHeld(held){calls.push(['held',held]);}
    async create(...args){calls.push(['create',...args]);this.emit({view:{phase:'waiting',code:'ABCDEF0123',names:{human:args[0],computer:null},seat:'human'},canResume:true});}async join(...args){calls.push(['join',...args]);if(restored.joinError)this.emit({canResume:true,error:restored.joinError,status:'disconnected'});}async command(action){calls.push(['command',action]);}
  }
  const rn={View:'View',Text:'Text',Image:'Image',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',TextInput:'TextInput',Platform:{OS:'web'},Share:{},
    AppState:{currentState:'active',addEventListener:()=>({remove(){}})},BackHandler:{addEventListener:(_event,handler)=>{backHandler=handler;return{remove(){}};}}};
  const mocks={'./savedRoomRecovery':{confirmWaitingGuest:async client=>{const v=client.state.view;if(v?.phase==='waiting'&&v.seat==='human'&&v.names.computer&&v.lobbyReady?.includes('computer')){if(!v.approved)await client.command({type:'approve'});if(!client.state.error)await client.command({type:'ready'});}}},'./useCodeInvitation':{useCodeInvitation:()=>({busy:false,prompt:null,accept:f=>f()})},'./useOnlineGameTransfer':{useOnlineGameTransfer:()=>({requestSwitch(){},prompt:null})},'../poker/pokerCredentialStorage':{vault:{}},'../nav/NavContext':{useNav:()=>({openPokerOnline(){}})},'../components/PlayingIdentity':{PlayingIdentity:'PlayingIdentity'},'react':React,'react-native':rn,'../i18n/I18nContext':{useI18n:()=>({lang:'es'})},'../components/Header':{Header:'Header'},
    '../computer/opponents':{OPPONENTS:[{id:'yuni',name:'Yuni',image:1},{id:'rafael',name:'Andy',image:2}]},'../computer/OpponentChoices':{OpponentChoices:'OpponentChoices'},'../computer/tableTheme':{TABLE:{background:'#081F18',ivory:'#fff',gold:'#DAB766',line:'#555',surface:'#123',muted:'#bbb',goldLight:'#fff',raised:'#345'}},
    './InvitationShareOptions':{InvitationShareOptions:'InvitationShareOptions'},'./OnlineDominoTable':{OnlineDominoTable:'OnlineDominoTable'},'./client':{OnlineClient:Client},'./endpoint':{onlineEndpoint:()=>'http://127.0.0.1:8791',invitation:()=>''},'./transport':{httpTransport:()=>({})},'./credentialStorage':{vault:{},credential:async()=>''},'./invitationLink':{sharePayload}};
  const module={exports:{}};const source=fs.readFileSync(new URL('./OnlineFriendScreen.tsx',import.meta.url),'utf8');
  new Function('require','module','exports','setInterval','clearInterval',ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText)(name=>{if(name.endsWith('/OnlineCancellation'))return{CodeInvitationScreen:'CodeInvitationScreen'};if(name.endsWith('/GoldPressable'))return{GoldPressable:'Pressable'};if(!(name in mocks))throw Error(name);return mocks[name];},module,module.exports,fn=>{tick=fn;return 1;},()=>{});
  const props={initialName:'Juni',initialTarget:100,initialMode:'points',entry:'accept',onBack:()=>calls.push(['back']),onStarted:()=>calls.push(['started']),...overrides};
  let tree;await act(async()=>{tree=create(React.createElement(module.exports.OnlineFriendScreen,props));});
  return{tree,calls,instance,tick:()=>tick(),back:()=>backHandler(),async update(next){Object.assign(props,next);await act(()=>tree.update(React.createElement(module.exports.OnlineFriendScreen,props)));},async visible(value){Object.assign(props,{visible:value});await act(()=>tree.update(React.createElement(module.exports.OnlineFriendScreen,props)));},async close(){await act(()=>tree.unmount());}};
}
for(const error of ['rate_limited','manual_code_capacity'])test(`${error} waits for explicit retry instead of repeatedly issuing a pending invitation`,async()=>{
 const f=await mount();try{
  await act(()=>f.instance.emit({error,status:'disconnected',canResume:true,view:null}));for(let n=0;n<10;n++)await act(()=>f.tick());assert.equal(f.calls.filter(c=>c[0]==='resume').length,0);
  await act(async()=>f.tree.root.findByProps({testID:'online-retry'}).props.onPress());assert.equal(f.calls.filter(c=>c[0]==='resume').length,1);
 }finally{await f.close();}
});

test('opening Invite immediately creates one code using existing name, avatar and match settings',async()=>{
 const h=await mount(null,{entry:'invite',initialAvatar:'sofia'});try{
  assert.deepEqual(h.calls.find(c=>c[0]==='create'),['create','Juni',100,'points',{avatar:'sofia',turnTimer:true,autoNextRound:true,quickActions:true,customAvatars:true,hostReturn:true}]);
  assert.equal(h.tree.root.findAllByProps({testID:'online-create'}).length,0);
  assert.equal(h.tree.root.findAllByType('TextInput').length,0);
  assert.equal(h.tree.root.findByProps({testID:'online-room-code'}).props.children,'ABCDEF0123');
  await h.visible(false);await h.visible(true);
  assert.equal(h.calls.filter(c=>c[0]==='create').length,1);
 }finally{await h.close();}
});
test('accepting a code joins once with consent and swaps directly to the authoritative table',async()=>{
 const h=await mount();try{await act(()=>h.tree.root.findByProps({testID:'online-code'}).props.onChangeText('abcdef0123'));
  assert.equal(h.tree.root.findAllByType('TextInput').length,1);assert.equal(h.calls.filter(c=>c[0]==='create').length,0);
  await act(()=>h.tree.root.findByProps({testID:'online-join'}).props.onPress());
  assert.deepEqual(h.calls.find(c=>c[0]==='join'),['join','Juni','ABCDEF0123',{avatar:'yuni',acceptInvitation:true}]);
  const view={phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}};
  await act(()=>h.instance.emit({view,status:'connected'}));
  assert.equal(h.tree.root.findByType('OnlineDominoTable').props.view,view);
  assert.equal(h.tree.root.findAllByProps({testID:'online-ready'}).length,0);
  assert.equal(h.calls.filter(c=>c[0]==='command').length,0);
 }finally{await h.close();}assert.ok(h.calls.some(c=>c[0]==='disconnect'));
});

test('selfie photo is sent only for the selected selfie, in both create and acceptance',async()=>{
 const photo='data:image/jpeg;base64,/9j/TEST';
 const host=await mount(null,{entry:'invite',initialAvatar:'selfie',initialAvatarPhoto:photo});
 try{const payload=host.calls.find(c=>c[0]==='create')[4];assert.equal(payload.avatarPhoto,photo);assert.equal(payload.customAvatars,true);}finally{await host.close();}
 const guest=await mount(null,{initialAvatar:'selfie',initialAvatarPhoto:photo});
 try{await act(()=>guest.tree.root.findByProps({testID:'online-code'}).props.onChangeText('abcdef0123'));await act(()=>guest.tree.root.findByProps({testID:'online-join'}).props.onPress());assert.deepEqual(guest.calls.find(c=>c[0]==='join')[3],{avatar:'selfie',avatarPhoto:photo,acceptInvitation:true});}finally{await guest.close();}
 const standard=await mount(null,{entry:'invite',initialAvatar:'sofia',initialAvatarPhoto:photo});
 try{assert.equal('avatarPhoto' in standard.calls.find(c=>c[0]==='create')[4],false);}finally{await standard.close();}
});

test('legacy selfie rejection explains the avatar incompatibility without claiming a connection outage',async()=>{
 const h=await mount();try{await act(()=>h.instance.emit({error:'invalid_avatar'}));const alerts=h.tree.root.findAllByProps({accessibilityRole:'alert'});assert.ok(alerts.some(node=>String(node.props.children).includes('no admite selfies')));assert.equal(alerts.some(node=>String(node.props.children).includes('No hay conexión')),false);}finally{await h.close();}
});
test('an unavailable saved invitation stops reconnect loops and creates a replacement only on explicit tap',async()=>{
 const photo='data:image/jpeg;base64,/9j/TEST';const h=await mount(null,{entry:'invite',initialAvatar:'selfie',initialAvatarPhoto:photo});
 try{
  await act(()=>h.instance.emit({view:null,canResume:true,status:'disconnected',error:'closed'}));
  assert.equal(h.tree.root.findAllByProps({testID:'online-retry'}).length,0);
  const before=h.calls.length;await act(()=>h.tick());assert.equal(h.calls.length,before,'terminal rooms must not retry forever');
  await act(()=>h.tree.root.findByProps({testID:'online-replace-invite'}).props.onPress());
  const lastCreate=h.calls.findLastIndex(c=>c[0]==='create');assert.equal(h.calls[lastCreate-1][0],'forget');
  assert.equal(h.calls.filter(c=>c[0]==='create').length,2);
  assert.equal(h.calls[lastCreate][1],'Juni');assert.equal(h.calls[lastCreate][4].avatarPhoto,photo);
 }finally{await h.close();}
});
test('unavailable guest session can accept a different invitation without creating a room',async()=>{
 const h=await mount();try{
  await act(()=>h.instance.emit({view:null,canResume:true,error:'room_missing',status:'disconnected'}));
  await act(()=>h.tree.root.findByProps({testID:'online-replace-invite'}).props.onPress());
  assert.ok(h.calls.some(c=>c[0]==='forget'));assert.equal(h.calls.some(c=>c[0]==='create'),false);
  assert.equal(h.tree.root.findByProps({testID:'online-code'}).props.value,'');
 }finally{await h.close();}
});
test('manual reconnect shows progress and an explicit failure result for a transient network error',async()=>{
 const h=await mount();let finish;try{
  await act(()=>h.instance.emit({view:null,canResume:true,error:'connection_error',status:'disconnected'}));
  h.instance.resume=async()=>{h.instance.emit({busy:true,error:null});await new Promise(resolve=>{finish=resolve;});h.instance.emit({busy:false,error:'connection_error'});};
  await act(()=>h.tree.root.findByProps({testID:'online-retry'}).props.onPress());
  assert.equal(h.tree.root.findByProps({testID:'online-retry'}).props.accessibilityLabel,'Reconectando…');
  assert.equal(h.tree.root.findByProps({testID:'online-retry'}).props.disabled,true);
  await act(()=>finish());assert.ok(h.tree.root.findAllByType('Text').some(n=>String(n.props.children).includes('No se pudo reconectar')));
 }finally{await h.close();}
});
test('opening Invite recovers an existing match without creating or dealing another one',async()=>{
 const view={phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'},presentation:{avatars:{human:'mateo',computer:'amara'}}};
 const h=await mount(view,{entry:'invite',initialAvatar:'sofia'});
 try{assert.equal(h.tree.root.findAllByType('OnlineDominoTable').length,1);assert.equal(h.calls.filter(c=>c[0]==='create').length,0);
  assert.equal(h.tree.root.findByType('OnlineDominoTable').props.view,view);
  assert.equal(h.tree.root.findByType('OnlineDominoTable').props.view.presentation.avatars.human,'mateo');
  assert.deepEqual(h.calls.slice(0,2),[['load'],['resume']]);
 }finally{await h.close();}
});
test('an invitation link pre-fills the room code and switching from a different live room requires explicit acceptance',async()=>{
 const h=await mount({phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}},{invitationCode:'123456ABCD'});
 try{assert.equal(h.tree.root.findAllByType('OnlineDominoTable').length,0);assert.equal(h.tree.root.findByProps({testID:'online-code'}).props.value,'123456ABCD');assert.equal(h.calls.some(c=>c[0]==='forget'),false);
  await act(()=>h.tree.root.findByProps({testID:'online-join'}).props.onPress());const join=h.calls.findIndex(c=>c[0]==='join');assert.equal(h.calls[join-1][0],'forget');assert.equal(h.calls[join][2],'123456ABCD');
 }finally{await h.close();}
});
test('share opens channel options with a public URL, without transmitting or exposing recovery controls',async()=>{
 const oldWindow=globalThis.window;globalThis.window={location:{origin:'http://127.0.0.1:8099'}};
 const h=await mount({phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}});
 try{await act(()=>h.tree.root.findByType('OnlineDominoTable').props.onShare());let payload;await act(async()=>payload=await h.tree.root.findByType('InvitationShareOptions').props.prepare());assert.equal(payload.url,'http://127.0.0.1:8099/?onlineRoom=ABCDEF0123');assert.ok(!JSON.stringify(payload).includes('token'));assert.equal(h.calls.some(c=>c[0]==='forget'),false);assert.equal(h.tree.root.findAllByProps({testID:'online-retry'}).length,0);
 }finally{await h.close();globalThis.window=oldWindow;}
});
test('share-only access hides manual code and recovery UI even when saved room cannot reconnect',async()=>{const h=await mount(null,{entry:'invite',inviteOnly:true});try{await act(()=>h.instance.emit({canResume:true,error:'connection_error',status:'disconnected'}));assert.equal(h.tree.root.findAllByType('InvitationShareOptions').length,1);assert.equal(h.tree.root.findAllByProps({testID:'online-code'}).length,0);assert.equal(h.tree.root.findAllByProps({testID:'online-retry'}).length,0);await act(async()=>await assert.rejects(h.tree.root.findByType('InvitationShareOptions').props.prepare(),/invitation_unavailable/));assert.equal(h.calls.some(c=>c[0]==='forget'),false);}finally{await h.close();}});
test('leaving an invitation never creates a replacement until a new explicit Invite request',async()=>{
 const h=await mount(null,{entry:'invite'});
 try{await act(()=>h.tree.root.findByProps({testID:'online-forget'}).props.onPress());
  assert.equal(h.calls.filter(c=>c[0]==='create').length,1);assert.equal(h.calls.at(-1)[0],'back');
  await h.visible(false);await h.visible(true);assert.equal(h.calls.filter(c=>c[0]==='create').length,1);
  await h.update({requestId:1});assert.equal(h.calls.filter(c=>c[0]==='create').length,2);
 }finally{await h.close();}
});
test('mount recovers saved identity and preserves a paused table while disconnected',async()=>{
 const view={phase:'paused',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}};
 const h=await mount(view);try{assert.deepEqual(h.calls.slice(0,2),[['load'],['resume']]);
  await act(()=>h.instance.emit({status:'disconnected',error:'connection_error'}));
  const table=h.tree.root.findByType('OnlineDominoTable');assert.equal(table.props.enabled,false);assert.match(table.props.error,/conexión/);
 }finally{await h.close();}
});
test('leaving a finished match releases its credential so the next invitation can start fresh',async()=>{
 const h=await mount({phase:'completed',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}});
 try{await act(async()=>h.tree.root.findByType('OnlineDominoTable').props.onBack());
  assert.deepEqual(h.calls.slice(-2),[['forget'],['back']]);
 }finally{await h.close();}
});
test('a closed snapshot offers explicit recovery and back releases only the old room session',async()=>{
 const h=await mount({phase:'closed',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}});
 try{assert.equal(h.tree.root.findAllByType('OnlineDominoTable').length,0);assert.equal(h.tree.root.findAllByProps({testID:'online-replace-invite'}).length>0,true);
  await act(()=>h.tree.root.findByType('Header').props.onBackPress());assert.deepEqual(h.calls.slice(-2),[['forget'],['back']]);
 }finally{await h.close();}
});
test('back from an unavailable saved room with no snapshot clears only that room session',async()=>{
 const h=await mount();try{await act(()=>h.instance.emit({view:null,canResume:true,error:'closed'}));await act(()=>h.tree.root.findByType('Header').props.onBackPress());assert.deepEqual(h.calls.slice(-2),[['forget'],['back']]);}finally{await h.close();}
});
test('a hidden waiting invitation keeps heartbeats and opens the table when the friend accepts',async()=>{
 const view={phase:'waiting',code:'ABCDEF0123',names:{human:'Juni',computer:null}};
 const h=await mount(view);try{
  await h.visible(false);assert.equal(h.back(),false);assert.equal(h.calls.filter(c=>c[0]==='disconnect').length,0);
  await act(()=>h.tick());assert.equal(h.calls.at(-1)[0],'refresh');
  await act(()=>h.instance.emit({view:{...view,phase:'playing',names:{human:'Juni',computer:'Andy'}}}));
  assert.equal(h.calls.filter(c=>c[0]==='started').length,1);
  assert.equal(h.calls.filter(c=>c[0]==='disconnect').length,0);
  await h.visible(true);await act(()=>h.instance.emit({view:{...h.instance.state.view,revision:2}}));
  assert.equal(h.calls.filter(c=>c[0]==='started').length,1);
 }finally{await h.close();}
});
test('returning to AI from an active match disconnects and stops hidden polling until reopened',async()=>{
 const h=await mount({phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}});
 try{await h.visible(false);assert.equal(h.calls.at(-1)[0],'disconnect');const count=h.calls.length;
  await act(()=>h.tick());assert.equal(h.calls.length,count);await h.visible(true);assert.equal(h.calls.at(-1)[0],'resume');
 }finally{await h.close();}
});
test('result release reaches the intent queue while gameplay commands are busy',async()=>{
 const h=await mount({phase:'playing',code:'ABCDEF0123',names:{human:'Juni',computer:'Andy'}});
 try{await act(()=>h.instance.emit({busy:true}));const table=h.tree.root.findByType('OnlineDominoTable');assert.equal(table.props.enabled,false);assert.equal(table.props.resultControlEnabled,true);
  assert.equal(await table.props.onAction({type:'releaseResult'}),true);assert.deepEqual(h.calls.at(-1),['held',false]);
  assert.equal(await table.props.onAction({type:'openBoneyard'}),false);
 }finally{await h.close();}
});

test('share-only entry keeps its host visible after the chooser without forgetting its invitation',async()=>{const saved={phase:'waiting',code:'ABCDEF0123',seat:'human',names:{human:'Juni',computer:null}};const f=await mount(saved,{inviteOnly:true,entry:'invite'});try{const share=f.tree.root.findByType('InvitationShareOptions');assert.equal(typeof share.props.onDone,'function');await act(()=>share.props.onDone());assert.equal(f.calls.filter(c=>c[0]==='back').length,0);assert.equal(f.calls.filter(c=>c[0]==='forget').length,0);assert.equal(f.instance.state.view,saved);}finally{await f.close();}});

for(const error of ['room_closed','room_missing'])test(`unavailable ${error} offers the existing Not now exit directly without joining or discarding local play`,async()=>{const f=await mount();try{const originalExit=f.tree.root.findByProps({testID:'online-not-now'}).props.onPress;await act(()=>f.instance.emit({view:null,error,status:'disconnected',canResume:true}));assert.equal(f.tree.root.findAllByProps({testID:'online-replace-invite'}).length,1);const exit=f.tree.root.findByProps({testID:'online-closed-not-now'});assert.equal(exit.props.onPress,originalExit);await act(()=>exit.props.onPress());assert.equal(f.calls.filter(c=>c[0]==='back').length,1);assert.equal(f.calls.filter(c=>['join','create','forget'].includes(c[0])).length,0);await f.visible(false);assert.ok(f.calls.some(c=>c[0]==='disconnect'));}finally{await f.close();}});
test('Domino host leaves share-only entry when a joined room is first observed paused',async()=>{const waiting={phase:'waiting',seat:'human',code:'ABCDEF0123',names:{human:'Juni',computer:null}};const f=await mount(waiting,{entry:'invite',inviteOnly:true});try{assert.equal(f.tree.root.findAllByType('InvitationShareOptions').length,1);await act(()=>f.instance.emit({view:{...waiting,phase:'paused',names:{human:'Juni',computer:'Andy'}}}));assert.equal(f.tree.root.findAllByType('InvitationShareOptions').length,0);assert.equal(f.tree.root.findAllByType('OnlineDominoTable').length,1);await act(()=>f.instance.emit({view:{...f.instance.state.view,phase:'playing'}}));assert.equal(f.calls.filter(c=>c[0]==='started').length,1);assert.equal(f.calls.some(c=>['create','forget'].includes(c[0])),false);}finally{await f.close();}});

for(const missing of [false,true])test(`confirmed new link bypasses ${missing?'missing':'closed'} old room and joins only the new invitation`,async()=>{
 const old='ABCDEF0123',next='123456ABCD';
 const h=await mount(missing?null:{phase:'closed',code:old},{invitationCode:next,autoAcceptInvitation:true},{code:old,...(missing?{patch:{error:'room_missing',status:'disconnected'}}:{})});
 try{const join=h.calls.findIndex(c=>c[0]==='join');assert.ok(join>=0);assert.equal(h.calls[join-1][0],'forget');assert.equal(h.calls[join][2],next);assert.equal(h.calls.filter(c=>c[0]==='join').length,1);assert.equal(h.calls.some(c=>c[0]==='create'),false);assert.equal(h.tree.root.findAllByProps({testID:'online-replace-invite'}).length,0);}finally{await h.close();}
});
test('confirmed fresh invitation joins directly with selected identity and consent',async()=>{
 const h=await mount(null,{invitationCode:'123456ABCD',autoAcceptInvitation:true,initialAvatar:'sofia'});
 try{assert.deepEqual(h.calls.find(c=>c[0]==='join'),['join','Juni','123456ABCD',{avatar:'sofia',acceptInvitation:true}]);assert.equal(h.calls.some(c=>c[0]==='forget'||c[0]==='create'),false);}finally{await h.close();}
});
for(const phase of ['playing','paused','waiting'])test(`confirmed link preserves a different ${phase} room until explicit acceptance`,async()=>{
 const h=await mount({phase,code:'ABCDEF0123'},{invitationCode:'123456ABCD',autoAcceptInvitation:true});
 try{assert.equal(h.calls.some(c=>['join','forget','create'].includes(c[0])),false);assert.equal(h.tree.root.findByProps({testID:'online-code'}).props.value,'123456ABCD');}finally{await h.close();}
});
test('closed invitation itself still shows its real failure instead of auto-retrying',async()=>{
 const h=await mount({phase:'closed',code:'123456ABCD'},{invitationCode:'123456ABCD',autoAcceptInvitation:true});
 try{assert.equal(h.calls.some(c=>['join','forget','create'].includes(c[0])),false);assert.equal(h.tree.root.findAllByProps({testID:'online-replace-invite'}).length,1);}finally{await h.close();}
});
test('uncertain old connection is retained rather than discarded for the new link',async()=>{
 const h=await mount(null,{invitationCode:'123456ABCD',autoAcceptInvitation:true},{code:'ABCDEF0123',patch:{error:'connection_error',status:'disconnected'}});
 try{assert.equal(h.calls.some(c=>['join','forget','create'].includes(c[0])),false);assert.equal(h.instance.state.canResume,true);}finally{await h.close();}
});

test('old closed notice stays hidden while a confirmed new link is being resolved',async()=>{
 let finish;const wait=new Promise(resolve=>finish=resolve);
 const h=await mount({phase:'closed',code:'ABCDEF0123'},{invitationCode:'123456ABCD',autoAcceptInvitation:true},{wait});
 try{assert.equal(h.tree.root.findAllByProps({testID:'online-replace-invite'}).length,0);assert.ok(h.tree.root.findAllByType('Text').some(n=>String(n.props.children).includes('Conectando con la invitación')));await act(async()=>finish());assert.equal(h.calls.filter(c=>c[0]==='join').length,1);}finally{await h.close();}
});
test('failure of the new invitation is shown without repeated acceptance or clearing it',async()=>{
 const h=await mount({phase:'closed',code:'ABCDEF0123'},{invitationCode:'123456ABCD',autoAcceptInvitation:true},{joinError:'room_missing'});
 try{assert.equal(h.tree.root.findAllByProps({testID:'online-replace-invite'}).length,1);for(let n=0;n<3;n++)await act(()=>h.tick());assert.equal(h.calls.filter(c=>c[0]==='join').length,1);assert.equal(h.calls.filter(c=>c[0]==='forget').length,1);}finally{await h.close();}
});

test('failure to clear the closed saved session never joins the new link or rejects unhandled',async()=>{
 const h=await mount({phase:'closed',code:'ABCDEF0123'},{invitationCode:'123456ABCD',autoAcceptInvitation:true},{forgetError:true});
 try{assert.equal(h.calls.some(c=>c[0]==='join'),false);assert.ok(h.tree.root.findAllByType('Text').some(n=>String(n.props.children).includes('No se pudo preparar la invitación')));}finally{await h.close();}
});

test('returning host explicitly approves the saved waiting guest; ordinary resume does not',async()=>{const view={phase:'waiting',seat:'human',code:'ABCDEF0123',epoch:'same',names:{human:'Juni',computer:'Chuchi'},approved:false,lobbyReady:['computer']};for(const consent of [false,true]){const h=await mount(view,{acceptWaitingGuest:consent});try{assert.deepEqual(h.calls.filter(c=>c[0]==='command').map(c=>c[1].type),consent?['approve','ready']:[]);}finally{await h.close();}}});
