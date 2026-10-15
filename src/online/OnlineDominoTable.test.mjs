import {modalCloseMock} from '../components/modalCloseMock.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';
import * as geometry from '../computer/boardLayout.ts';
import {handLayout,handTrayHeight} from '../computer/handLayout.ts';
import {TABLE} from '../computer/tableTheme.ts';
import {COMPUTER_STRINGS} from '../computer/strings.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const pass=({children})=>React.createElement(React.Fragment,null,children);
const opponents=[{id:'yuni',name:'Yuni',image:'juni.png'},{id:'rafael',name:'Andy',image:'andy.png'},{id:'mateo',name:'Mateo',image:'mateo.png'},{id:'amara',name:'Amara',image:'amara.png'}];
let testWindow={width:390,height:800};
const deps={react:React,'react-native':{Animated:{View:'AnimatedView'},Image:'Image',Modal:({visible,children,...props})=>visible?React.createElement('Modal',props,children):null,PanResponder:{create:()=>({panHandlers:{}})},Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',useWindowDimensions:()=>testWindow},
 'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'@expo/vector-icons':{Feather:'Feather'},
 '../computer/DominoTableBackground':{DominoTableBackground:'Background'},'../computer/OpponentDrinkingAvatar':{OpponentDrinkingAvatar:'Opponent'},'../computer/dominoAvatars':{DOMINO_AVATARS:opponents},'../blackjack/TableFinish':{TableStamp:'Stamp',WoodSurface:'Wood'},
 '../computer/DraggableDomino':{DraggableDomino:'Tile'},'../computer/DominoTile':{DominoTile:'Face'},'../computer/AnchoredBoard':{AnchoredBoard:'Board'},'../computer/DominoTurnTitle':{DominoTurnTitle:'Turn'},
 '../computer/useBoardCamera':{useBoardCamera:()=>({values:{x:0,y:0,scale:1},current:{current:{x:0,y:0,scale:1}},begin(){},end(){},pan(){},center(){}})},'../computer/boardLayout':geometry,'../computer/handLayout':{handLayout,handTrayHeight},'../computer/tableTheme':{TABLE},'../state/PrefsContext':{usePrefs:()=>({matchingTiles:true,ready:true,tileSound:false})},'../computer/strings':{COMPUTER_STRINGS},'../computer/RoundDeal':{DealtTile:pass},'./useOnlineDeal':{useOnlineDeal:()=>({dealing:false,progress:{}})}};
deps['./OnlineTurnTimer']={OnlineTurnTimer:'TurnTimer',OnlineTurnWarning:'TurnWarning'};
deps['./OnlineVoiceControl']={OnlineVoiceControl:'VoiceControl'};
deps['./OnlineRoundResult']={OnlineRoundResult:'RoundResult'};
deps['./OnlineQuickActions']={OnlineQuickActions:'QuickActions',OnlineAttentionNotice:'AttentionNotice'};
const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./OnlineDominoTable.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>{if(id.endsWith('/FloatingAction'))return{FloatingAction:'FloatingAction'};if(id.endsWith('/OnlineCancellation'))return{CancelRoomControl:'CancelRoomControl',RoomClosedNotice:'RoomClosedNotice'};if(id.endsWith('/ResultHoldButton'))return{ResultHoldButton:'HoldButton'};if(id.endsWith('/HomeButton'))return{HomeButton:'HomeButton'};if(id.endsWith('/GoldPressable'))return{GoldPressable:'Pressable'};if(id.endsWith('/ModalCloseButton'))return modalCloseMock;if(!(id in deps))throw Error(id);return deps[id];},m,m.exports);
function view(seat='human'){return {protocol:1,code:'ABCDEF0123',epoch:'e',revision:1,phase:'playing',seat,names:{human:'Juni',computer:'Andy'},presentation:{avatars:{human:'yuni',computer:'rafael'},openingId:null},board:[],hand:[{id:'6-6',a:6,b:6},{id:'1-2',a:1,b:2}],opponentCount:7,stock:['slot-0'],round:1,turn:seat,mode:'points',target:100,scores:{human:0,computer:0},wins:{human:0,computer:0},last:null,result:null,winner:null,roundReady:[],legalMoves:[{tileId:'6-6',ends:['right']},{tileId:'1-2',ends:['right']}],canDraw:false,canPass:false};}
async function setup(v,handle){const commands=[];let r;const props={view:v,enabled:true,es:true,onAction:a=>{commands.push(a);return handle?.(a);},onBack(){},error:null};await act(()=>{r=create(React.createElement(m.exports.OnlineDominoTable,props),{createNodeMock:()=>({measureInWindow:cb=>cb(0,0)})});});return{r,commands,async update(patch){Object.assign(props,patch);await act(()=>r.update(React.createElement(m.exports.OnlineDominoTable,props)));}};}
for(const seat of ['human','computer'])test(`seat ${seat} sees own avatar below and the other player across; opening tap sends one server command`,async()=>{
 const v=view(seat),{r,commands}=await setup(v);try{
  assert.equal(r.root.findByType('Opponent').props.name,seat==='human'?'Andy':'Juni');
  assert.ok(r.root.findByProps({testID:'online-local-name'}).parent===r.root.findByProps({testID:'online-wood-right'}));assert.equal(r.root.findByProps({testID:'online-local-name'}).props.style.top,69);assert.equal(r.root.findByProps({testID:'online-local-name'}).props.style.left+r.root.findByProps({testID:'online-local-name'}).props.style.width/2,36);assert.equal(r.root.findByProps({testID:'online-local-name'}).props.style.maxWidth,88);assert.equal(r.root.findByType('TurnTimer').props.avatar,seat==='human'?'juni.png':'andy.png');
  assert.equal(r.root.findByProps({testID:'online-local-name'}).props.children,seat==='human'?'Juni':'Andy','own identity preserves the player name edited before starting');
  let avatarParent=r.root.findByType('TurnTimer').parent;while(avatarParent&&avatarParent.props.testID!=='domino-wood-edge')avatarParent=avatarParent.parent;assert.ok(avatarParent,'local avatar belongs on the wood edge');
  assert.equal(r.root.findAllByType('Tile').length,2);
  await act(()=>r.root.findAllByType('Tile')[0].props.onTap());
  assert.deepEqual(commands,[{type:'play',tileId:'6-6',end:'right'}]);assert.equal(v.hand.length,2,'UI never mutates the authoritative hand');
 }finally{await act(()=>r.unmount());}
});
test('new avatar identities render their own images on both seats without falling back to Yuni',async()=>{
 for(const seat of ['human','computer']){
  const v=view(seat);v.presentation.avatars={human:'mateo',computer:'amara'};
  const{r}=await setup(v);try{
   assert.equal(r.root.findByType('TurnTimer').props.avatar,seat==='human'?'mateo.png':'amara.png');
   assert.equal(r.root.findByType('Opponent').props.source,seat==='human'?'amara.png':'mateo.png');
  }finally{await act(()=>r.unmount());}
 }
});

test('a selfie snapshot displays the authorized photo rather than a catalog fallback',async()=>{
 const v=view();v.presentation.avatars={human:'selfie',computer:'selfie'};
 v.presentation.avatarPhotos={human:'data:image/jpeg;base64,/9j/aA==',computer:'data:image/jpeg;base64,/9j/cA=='};
 const{r}=await setup(v);try{
  assert.equal(r.root.findByProps({testID:'online-local-name'}).props.children,'Juni','selfie keeps its player name');
  assert.deepEqual(r.root.findByType('TurnTimer').props.avatar,{uri:v.presentation.avatarPhotos.human});
  assert.deepEqual(r.root.findByType('Opponent').props.source,{uri:v.presentation.avatarPhotos.computer});
  assert.equal(r.root.findByType('Opponent').props.opponentId,'selfie','photo bypasses catalog resting poses');
 }finally{await act(()=>r.unmount());}
});

test('both legal ends require selecting a public target; paused state disables the hand',async()=>{
 const v=view();v.board=[{id:'2-6',a:2,b:6}];v.presentation.openingId='2-6';v.legalMoves[0].ends=['left','right'];
 const{r,commands}=await setup(v);try{await act(()=>r.root.findAllByType('Tile')[0].props.onTap());assert.deepEqual(commands,[]);
  const b=r.root.findByType('Board');assert.deepEqual(b.props.available,['left','right']);await act(()=>b.props.onEnd('left'));assert.deepEqual(commands,[{type:'play',tileId:'6-6',end:'left'}]);
  await act(()=>r.update(React.createElement(m.exports.OnlineDominoTable,{view:{...v,phase:'paused',revision:2},enabled:true,es:true,onAction:a=>commands.push(a),onBack(){},error:null})));
  assert.equal(r.root.findAllByType('Tile').every(t=>!t.props.enabled),true);
 }finally{await act(()=>r.unmount());}
});
test('drag to the existing chain geometry submits a server action',async()=>{
 const v=view(),{r,commands}=await setup(v);try{const tile=r.root.findAllByType('Tile')[0];await act(()=>tile.props.onDrag({x:170,y:180}));await act(()=>r.root.findAllByType('Tile')[0].props.onDrop({x:170,y:180}));assert.deepEqual(commands,[{type:'play',tileId:'6-6',end:'right'}]);}finally{await act(()=>r.unmount());}
});

test('the turn owner can pause and resume from the wood; the other seat cannot control the timer',async()=>{
 const v=view();v.presentation.turnClock={durationMs:30000,remainingMs:18000,deadline:19000,serverNow:1000,paused:false};
 const {r,commands}=await setup(v);try{
  const timer=r.root.findByType('TurnTimer');assert.equal(timer.props.enabled,true);assert.equal(timer.props.clock.remainingMs,18000);
  let parent=timer.parent;while(parent&&parent.props.testID!=='domino-wood-edge')parent=parent.parent;assert.ok(parent);
  await act(()=>timer.props.onPause());await act(()=>timer.props.onResume());
  assert.deepEqual(commands,[{type:'pauseTurnTimer'},{type:'resumeTurnTimer'}]);
  await act(()=>r.update(React.createElement(m.exports.OnlineDominoTable,{view:{...v,turn:'computer'},enabled:true,es:true,onAction:a=>commands.push(a),onBack(){},error:null})));
  assert.equal(r.root.findByType('TurnTimer').props.enabled,false);
 }finally{await act(()=>r.unmount());}
});

for(const winner of ['human','computer'])test(`either round winner (${winner}) leaves the local next-round action available`,async()=>{
 const v=view();v.result={winner,points:10,blocked:false};v.legalMoves=[];
 const {r,commands}=await setup(v);try{
  const result=r.root.findByType('RoundResult');assert.equal(result.props.enabled,true);assert.equal(result.props.winnerName,v.names[winner]);
  await act(()=>r.root.findByProps({accessibilityLabel:COMPUTER_STRINGS.es.next}).props.onPress());assert.deepEqual(commands,[{type:'nextRound'}]);assert.equal(v.round,1);
 }finally{await act(()=>r.unmount());}
});
test('automatic results expose HOLD and release intents with no local advance or Continue button',async()=>{
 const v=view();v.result={winner:'computer',points:10,blocked:false};v.presentation.resultClock={durationMs:3000,remainingMs:2000,deadline:3000,serverNow:1000,heldBy:[]};
 const h=await setup(v);try{
  const result=h.r.root.findByType('RoundResult');assert.equal(result.props.winnerName,'Andy');assert.equal(result.props.holding,false);assert.equal(result.props.matchComplete,false);
  assert.equal(h.r.root.findAllByProps({accessibilityLabel:COMPUTER_STRINGS.es.next}).length,0);
  const hold=h.r.root.findByType('HoldButton');assert.equal(h.r.root.findByProps({testID:'domino-wood-edge'}).findByType('HoldButton'),hold);assert.equal(result.props.showHold,false);await act(()=>hold.props.onHold());await act(()=>hold.props.onRelease());assert.deepEqual(h.commands,[{type:'holdResult'},{type:'releaseResult'}]);
  await h.update({view:{...v,presentation:{...v.presentation,resultClock:{...v.presentation.resultClock,deadline:null,heldBy:['human']}}}});assert.equal(h.r.root.findByType('RoundResult').props.holding,true);
 }finally{await act(()=>h.r.unmount());}
});

function drawView(clock=true){const v=view();v.canDraw=true;v.legalMoves=[];v.stock=['slot-0','slot-1'];if(clock)v.presentation.turnClock={durationMs:30000,remainingMs:12000,deadline:13000,serverNow:1000,paused:false};return v;}
test('opening the timed boneyard waits for server confirmation and ignores duplicate taps',async()=>{
 const v=drawView();let answer;const {r,commands}=await setup(v,()=>new Promise(resolve=>{answer=resolve;}));
 try{const open=r.root.findByType('FloatingAction');let pending;
  await act(()=>{pending=open.props.onPress();open.props.onPress();});
  assert.deepEqual(commands,[{type:'openBoneyard'}]);assert.equal(r.root.findAllByType('Modal').length,0);
  assert.equal(v.presentation.turnClock.remainingMs,12000,'client never resets the server clock optimistically');
  await act(async()=>{answer(true);await pending;});assert.equal(r.root.findAllByType('Modal').length,1);
  assert.equal(r.root.findAllByProps({accessibilityLabel:'Ficha boca abajo 1'}).length,1);
 }finally{await act(()=>r.unmount());}
});
test('failed opening keeps the boneyard shut; failed cancellation keeps it visible until an acknowledged retry',async()=>{
 let allow=false;const v=drawView(),h=await setup(v,async()=>allow);
 try{await act(()=>h.r.root.findByType('FloatingAction').props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,0);
  allow=true;await act(()=>h.r.root.findByType('FloatingAction').props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,1);
  allow=false;await act(()=>h.r.root.findByProps({testID:'online-boneyard-cancel'}).props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,1);
  allow=true;await act(()=>h.r.root.findByType('Modal').props.onRequestClose());assert.equal(h.r.root.findAllByType('Modal').length,0);
  assert.deepEqual(h.commands.map(a=>a.type),['openBoneyard','openBoneyard','cancelBoneyard','cancelBoneyard']);
 }finally{await act(()=>h.r.unmount());}
});
test('the first draw resumes on the server while additional opaque draws keep the open boneyard without reopening',async()=>{
 const v=drawView(),h=await setup(v,async()=>true);
 try{await act(()=>h.r.root.findByType('FloatingAction').props.onPress());
  await act(()=>h.r.root.findByProps({accessibilityLabel:'Ficha boca abajo 1'}).props.onPress());
  await h.update({view:{...v,revision:2,stock:['slot-1'],hand:[...v.hand,{id:'0-1',a:0,b:1}],presentation:{...v.presentation,turnClock:{...v.presentation.turnClock,remainingMs:30000,deadline:32000,serverNow:2000}}}});
  assert.equal(h.r.root.findAllByType('Modal').length,1);assert.equal(h.r.root.findAllByProps({accessibilityLabel:'Ficha boca abajo 2'}).length,0);
  await act(()=>h.r.root.findByProps({accessibilityLabel:'Ficha boca abajo 1'}).props.onPress());
  assert.deepEqual(h.commands,[{type:'openBoneyard'},{type:'draw',slot:'slot-0'},{type:'draw',slot:'slot-1'}]);
  await h.update({view:{...v,revision:3,canDraw:false,stock:[]}});assert.equal(h.r.root.findAllByType('Modal').length,0);
 }finally{await act(()=>h.r.unmount());}
});
test('legacy rooms open and cancel locally without issuing timer commands',async()=>{
 const h=await setup(drawView(false));try{
  await act(()=>h.r.root.findByType('FloatingAction').props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,1);
  await act(()=>h.r.root.findByProps({testID:'online-boneyard-cancel'}).props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,0);assert.deepEqual(h.commands,[]);
 }finally{await act(()=>h.r.unmount());}
});
test('only the waiting seat exposes quick actions and playing dismisses a received notice before acknowledgement',async()=>{
 const v=view();v.presentation.attention={id:'notice-1',from:'computer',kind:'wave',sentAt:1000,expiresAt:4000};v.presentation.turnClock={durationMs:30000,remainingMs:30000,deadline:31000,serverNow:1000,paused:false};
 let answer;const h=await setup(v,()=>new Promise(resolve=>{answer=resolve;}));
 try{assert.equal(h.r.root.findAllByType('QuickActions').length,0);const before=h.r.root.findByType('AttentionNotice').props.dismissalKey;
  await act(()=>h.r.root.findAllByType('Tile')[0].props.onTap());assert.notEqual(h.r.root.findByType('AttentionNotice').props.dismissalKey,before);
  assert.equal(h.commands[0].type,'play');answer(true);
  await h.update({view:{...v,turn:'computer'}});assert.equal(h.r.root.findAllByType('QuickActions').length,1);
  const previous=h.r.root.findByType('AttentionNotice').props.dismissalKey;await h.update({view:{...v,turn:'computer',round:2}});assert.notEqual(h.r.root.findByType('AttentionNotice').props.dismissalKey,previous);
 }finally{await act(()=>h.r.unmount());}
});
test('cosmetic attention revisions preserve selected ends and an active drag until the real game changes',async()=>{
 const v=view();v.board=[{id:'2-6',a:2,b:6}];v.presentation.openingId='2-6';v.legalMoves[0].ends=['left','right'];
 const h=await setup(v);try{
  await act(()=>h.r.root.findAllByType('Tile')[0].props.onTap());assert.deepEqual(h.r.root.findByType('Board').props.available,['left','right']);
  const attention={id:'notice-1',from:'computer',kind:'wave',sentAt:1000,expiresAt:4000};
  await h.update({view:{...v,revision:2,presentation:{...v.presentation,attention}}});assert.deepEqual(h.r.root.findByType('Board').props.available,['left','right']);
  await act(()=>h.r.root.findAllByType('Tile')[0].props.onDrag({x:170,y:180}));assert.equal(h.r.root.findAllByType('Face').length,1);
  await h.update({view:{...v,revision:3,presentation:{...v.presentation,attention:{...attention,id:'notice-2'}}}});assert.equal(h.r.root.findAllByType('Face').length,1);
  await h.update({view:{...v,revision:4,turn:'computer'}});assert.equal(h.r.root.findAllByType('Face').length,0);
 }finally{await act(()=>h.r.unmount());}
});

test('draw and pass use one right floating action and retain command and turn guards',async()=>{const v=view();v.legalMoves=[];v.canDraw=true;const h=await setup(v);try{let action=h.r.root.findByType('FloatingAction');assert.equal(action.props.side,'right');assert.equal(action.props.visible,true);assert.equal(action.props.label,'ROBAR');await act(()=>action.props.onPress());assert.equal(h.r.root.findAllByType('Modal').length,1);await act(()=>h.r.root.findByProps({testID:'online-boneyard-cancel'}).props.onPress());await h.update({view:{...v,canDraw:false,canPass:true}});action=h.r.root.findByType('FloatingAction');assert.equal(action.props.label,'PASAR');await act(()=>action.props.onPress());assert.deepEqual(h.commands,[{type:'pass'}]);await h.update({enabled:false});assert.equal(h.r.root.findByType('FloatingAction').props.visible,false);}finally{await act(()=>h.r.unmount());}});

test('turn notice uses one title line and one last move line without a warning beneath tiles',async()=>{const v=view();v.last={player:'computer',kind:'play',tile:{a:0,b:1}};const h=await setup(v);try{const title=h.r.root.findByType('Turn');assert.ok(!title.props.multiline);const detail=h.r.root.findByProps({testID:'online-turn-detail'});assert.equal(detail.props.numberOfLines,1);assert.equal(detail.props.children,'Andy jugó 0 · 1');assert.equal(h.r.root.findAllByType('TurnWarning').length,0);}finally{await act(()=>h.r.unmount());}});

test('nudges have a separate right-hand lane beside the avatar',async()=>{const v=view();v.turn='computer';v.presentation.attention={id:'a',from:'human',kind:'wave',sentAt:1,expiresAt:2};v.presentation.quickActions=true;v.presentation.turnClock={durationMs:30000,remainingMs:30000,deadline:30001,serverNow:1,paused:false};const h=await setup(v);try{const lane=h.r.root.findByProps({testID:'online-wood-attention'});assert.equal(lane.props.style.position,'absolute');assert.equal(lane.props.style.right,0);}finally{await act(()=>h.r.unmount());}});

for(const seat of ['human','computer'])test(`voice status stays beneath microphone in left lane for ${seat}, away from avatar`,async()=>{const h=await setup(view(seat));const woodHeight=h.r.root.findByProps({testID:'domino-wood-edge'}).props.style.minHeight;try{await h.update({voiceRelay:async()=>({call:null,peer:null,messages:[]})});await act(()=>h.r.root.findByType('VoiceControl').props.onStatus('Call ended.'));const status=h.r.root.findByProps({testID:'online-voice-status'}),lane=h.r.root.findByProps({testID:'online-wood-left'});assert.ok(status.parent===lane,'voice status must be inside microphone lane');assert.equal(status.props.numberOfLines,2);assert.equal(status.props.style.paddingHorizontal,0);assert.equal(status.props.accessibilityLabel,'Call ended.');const siblings=lane.findAll(n=>n.parent===lane);assert.ok(siblings.indexOf(status)>siblings.indexOf(h.r.root.findByType('VoiceControl')));assert.equal(h.r.root.findByProps({testID:'online-wood-right'}).props.style.width,72);assert.equal(h.r.root.findByProps({testID:'domino-wood-edge'}).props.style.minHeight,woodHeight);}finally{await act(()=>h.r.unmount());}});
for(const width of [320,390])test(`microphone status has two bounded lines outside the avatar at phone width ${width}`,async()=>{testWindow={width,height:640};const h=await setup(view('computer'));try{await h.update({voiceRelay:async()=>({call:null,peer:null,messages:[]})});await act(()=>h.r.root.findByType('VoiceControl').props.onStatus('The call ended after five minutes. You can call again.'));const status=h.r.root.findByProps({testID:'online-voice-status'});assert.equal(status.props.numberOfLines,2);assert.equal(status.props.style.lineHeight,14);const lane=h.r.root.findByProps({testID:'online-wood-left'});assert.equal(lane.props.style.width,80);assert.ok(12+lane.props.style.width<width/2-36,'left status lane cannot intersect centered avatar');const maxControlsHeight=44+2+2*status.props.style.lineHeight+12+8;assert.ok(maxControlsHeight<=h.r.root.findByProps({testID:'domino-wood-edge'}).props.style.minHeight,'two status lines and stock fit existing wood height');}finally{await act(()=>h.r.unmount());testWindow={width:390,height:800};}});