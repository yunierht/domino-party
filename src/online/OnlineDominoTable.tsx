import {FloatingAction} from '../blackjack/FloatingAction';
import {CancelRoomControl,RoomClosedNotice} from './OnlineCancellation';
import {ResultHoldButton} from '../components/ResultHoldButton';
import {HomeButton} from '../components/HomeButton';
import {GoldPressable} from '../components/GoldPressable';
import {DealtTile} from '../computer/RoundDeal';
import {useOnlineDeal} from './useOnlineDeal';
import {OnlineTurnTimer} from './OnlineTurnTimer';
import {OnlineRoundResult} from './OnlineRoundResult';
import {OnlineQuickActions,OnlineAttentionNotice} from './OnlineQuickActions';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Animated,Image,Modal,PanResponder,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Feather} from '@expo/vector-icons';
import {DominoTableBackground} from '../computer/DominoTableBackground';
import {OpponentDrinkingAvatar} from '../computer/OpponentDrinkingAvatar';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {TableStamp,WoodSurface} from '../blackjack/TableFinish';
import {DraggableDomino} from '../computer/DraggableDomino';
import {DominoTile} from '../computer/DominoTile';
import {AnchoredBoard} from '../computer/AnchoredBoard';
import {DominoTurnTitle} from '../computer/DominoTurnTitle';
import {useBoardCamera} from '../computer/useBoardCamera';
import {chainMetrics,endpointOffsets,chainSlot,resolveScreenDrop} from '../computer/boardLayout';
import type {Point} from '../computer/boardLayout';
import {handLayout,handTrayHeight} from '../computer/handLayout';
import {TABLE as C} from '../computer/tableTheme';
import {usePrefs} from '../state/PrefsContext';
import {COMPUTER_STRINGS} from '../computer/strings';
import type {Action,OnlineView,Tile} from './contract';
import {ModalCloseButton} from '../components/ModalCloseButton';
import {OnlineVoiceControl} from './OnlineVoiceControl';
import type {VoiceRelay} from './OnlineVoiceControl';

export function OnlineDominoTable({view:v,enabled,resultControlEnabled=enabled,es,onAction,onBack,onShare,error,notice,voiceRelay,voiceAvailable=false}:{view:OnlineView;enabled:boolean;resultControlEnabled?:boolean;es:boolean;onAction:(action:Action)=>Promise<boolean>|void;onBack:()=>void;onShare?:()=>void;error:string|null;notice?:string|null;voiceRelay?:VoiceRelay;voiceAvailable?:boolean}){
 const prefs=usePrefs(),windowSize=useWindowDimensions(),insets=useSafeAreaInsets();
 const dealPresentation=useOnlineDeal(v.round,!v.board.length&&!v.last&&!v.result,prefs.ready,prefs.tileSound);
 const text=COMPUTER_STRINGS[es?'es':'en'];
 const local=v.seat,rival=local==='human'?'computer':'human';
 const opponent=DOMINO_AVATARS.find(o=>o.id===v.presentation?.avatars[rival])??DOMINO_AVATARS[0];
 const self=DOMINO_AVATARS.find(o=>o.id===v.presentation?.avatars[local])??DOMINO_AVATARS[0];
 const opponentPhoto=v.presentation?.avatars[rival]==='selfie'?v.presentation?.avatarPhotos?.[rival]:null;
 const selfPhoto=v.presentation?.avatars[local]==='selfie'?v.presentation?.avatarPhotos?.[local]:null;
 const selfName=v.names[local]??self.name;
 const [panelWidth,setPanelWidth]=useState(390),[tableSize,setTableSize]=useState({width:340,height:360});
 const [selected,setSelected]=useState<string|null>(null),[drag,setDrag]=useState<{tile:Tile;point:Point}|null>(null);
 const [menu,setMenu]=useState(false),[rules,setRules]=useState(false),[stock,setStock]=useState(false);
 const [stockBusy,setStockBusy]=useState(false),[stockError,setStockError]=useState<string|null>(null);
 const [attentionDismissal,setAttentionDismissal]=useState(0);
 const [voiceStatus,setVoiceStatus]=useState<string|null>(null);
 const holdPresentationKey=useMemo(()=>({epoch:v.epoch,round:v.round}),[v.epoch,v.round]);
 const [woodHeight,setWoodHeight]=useState(98),[actionsHeight,setActionsHeight]=useState(44),[panelHeight,setPanelHeight]=useState(windowSize.height);
 const stockRequest=useRef(false),mounted=useRef(true),latestView=useRef(v);latestView.current=v;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const rootRef=useRef<View>(null),tableRef=useRef<View>(null),rootOrigin=useRef<Point>({x:0,y:0}),tableOrigin=useRef<Point|null>(null),dragId=useRef<string|null>(null);
 const opening=v.presentation?.openingId??null,metrics=chainMetrics(2048,4096);
 const camera=useBoardCamera(v.board,opening,tableSize.width,tableSize.height,v.round);
 const cameraRef=useRef(camera);cameraRef.current=camera;
 const panStart=useRef({x:0,y:0});
 const pan=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_e,g)=>!dragId.current&&Math.hypot(g.dx,g.dy)>6,
  onPanResponderGrant:()=>{cameraRef.current.begin();panStart.current={...cameraRef.current.current.current};},
  onPanResponderMove:(_e,g)=>cameraRef.current.pan(panStart.current.x+g.dx,panStart.current.y+g.dy),
  onPanResponderRelease:()=>cameraRef.current.end(),onPanResponderTerminate:()=>cameraRef.current.end()})).current;
 const cancel=()=>{if(dragId.current)camera.end();dragId.current=null;tableOrigin.current=null;setDrag(null);};
 const boardKey=v.board.map(t=>t.id).join(','),handKey=v.hand.map(t=>t.id).join(',');
 const resultKey=v.result?`${v.result.winner}:${v.result.points}:${v.result.blocked}`:'';
 useEffect(()=>{setSelected(null);cancel();},[v.code,v.epoch,v.round,v.phase,v.turn,boardKey,handKey,resultKey,error]);
 useEffect(()=>{if(!v.canDraw&&v.phase!=='paused')setStock(false);},[v.canDraw,v.phase,v.round]);
 const height=windowSize.height-insets.top-insets.bottom,compact=height<720,opponentHeight=compact?105:Math.min(165,height*.2);
 const {columns,rows,size}=handLayout(v.hand.length,Math.min(panelWidth,windowSize.width)-24,handTrayHeight(panelHeight,opponentHeight,woodHeight,actionsHeight));
 const [presented,setPresented]=useState(boardKey);
 const humanTurn=!stockBusy&&!dealPresentation.dealing&&(!v.board.length||v.last?.kind!=='play'||presented===boardKey)&&enabled&&v.phase==='playing'&&v.turn===local&&!v.result&&!menu&&!rules&&!stock;
 const attentionSupported=!!v.presentation&&'attention'in v.presentation;
 const serverNow=v.presentation?.turnClock?.serverNow??v.presentation?.resultClock?.serverNow;
 const attentionKey=`${attentionDismissal}:${v.epoch}:${v.round}:${v.turn}:${v.phase}:${v.last?.kind}:${v.last?.player}:${v.last?.tile?.id}:${v.hand.length}:${v.opponentCount}`;
 const sendAction=(action:Action)=>{
  if(action.type==='play'||action.type==='draw'||action.type==='pass')setAttentionDismissal(value=>value+1);
  return onAction(action);
 };
 async function requestStock(action:Action){
  if(stockRequest.current||!enabled)return false;
  stockRequest.current=true;setStockBusy(true);setStockError(null);
  try{
   const answer=await sendAction(action),accepted=v.presentation?.turnClock?answer===true:answer!==false;
   if(!accepted&&mounted.current)setStockError(es?'No se pudo actualizar el pozo. Vuelve a intentarlo.':'The boneyard could not be updated. Please retry.');
   return accepted;
  }catch{
   if(mounted.current)setStockError(es?'No se pudo actualizar el pozo. Vuelve a intentarlo.':'The boneyard could not be updated. Please retry.');
   return false;
  }finally{stockRequest.current=false;if(mounted.current)setStockBusy(false);}
 }
 async function openStock(){
  if(!humanTurn||!v.canDraw||stockRequest.current)return;
  if(v.presentation?.turnClock&&!await requestStock({type:'openBoneyard'}))return;
  const current=latestView.current;
  if(mounted.current&&current.code===v.code&&current.epoch===v.epoch&&current.round===v.round&&current.canDraw)setStock(true);
 }
 async function closeStock(){
  if(stockRequest.current||!enabled)return;
  if(v.presentation?.turnClock&&!await requestStock({type:'cancelBoneyard'}))return;
  if(mounted.current){setStock(false);setStockError(null);}
 }
 const active=drag?.tile??v.hand.find(t=>t.id===selected);
 const endsFor=(id:string)=>v.legalMoves.find(m=>m.tileId===id)?.ends??[];
 const available=humanTurn&&active?endsFor(active.id):[];
 const offsets=endpointOffsets(v.board,opening);
 const targets=available.map(end=>({end,point:chainSlot(offsets[end],metrics,v.board,opening)}));
 const hit=(point:Point)=>tableOrigin.current?resolveScreenDrop({x:point.x-tableOrigin.current.x,y:point.y-tableOrigin.current.y},targets,tableSize,metrics,camera.current.current):null;
 const play=(tileId:string,end:'left'|'right')=>{if(!humanTurn)return;setSelected(null);cancel();sendAction({type:'play',tileId,end});};
 const tally=(v.mode==='wins'?v.wins:v.scores)??{human:0,computer:0};
 const result=v.result?(v.result.winner==='tie'?text.tie:`${v.names[v.winner??v.result.winner]} ${v.winner?text.wonMatch:text.wonRound}`):'';
 const status=error??stockError??(v.phase==='paused'?(es?'Partida pausada\nEsperando reconexión':'Game paused\nWaiting for reconnection'):v.phase==='closed'?(es?'Sala cerrada\nSin ganador':'Room closed\nNo winner'):result||(v.turn===local?text.yourTurn:`${es?'Turno de':'Turn of'} ${v.names[rival]}`));
 const button=(label:string,press:()=>void,disabled=false)=><GoldPressable finish accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{disabled}} onPress={press} style={({pressed})=>({minHeight:44,paddingHorizontal:18,paddingVertical:11,borderRadius:12,backgroundColor:C.gold,borderWidth:1,borderColor:C.goldLight,justifyContent:'center',alignItems:'center',opacity:disabled?.35:pressed?.8:1})}><Text style={{color:C.background,fontWeight:'700',fontSize:13}}>{label}</Text></GoldPressable>;
 return <View ref={rootRef} testID="online-real-table" onLayout={e=>{setPanelWidth(e.nativeEvent.layout.width);setPanelHeight(e.nativeEvent.layout.height);cancel();}} style={{flex:1,minHeight:0,backgroundColor:C.background,overflow:'hidden'}}>
  <View testID="game-toolbar" style={{height:48,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:C.line}}>
   <Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={onBack} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={20} color={C.ivory}/></Pressable><HomeButton es={es}/>
   <View style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:8}}><Text numberOfLines={1} style={{flex:1,textAlign:'right',color:C.ivory,fontSize:13}}>{v.names[local]}</Text><Text style={{minWidth:24,color:C.goldLight,fontWeight:'700',fontSize:18}}>{tally[local]}</Text></View>
   <View style={{width:68,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.goldLight,fontSize:10}}>{v.mode==='wins'?(es?'Victorias':'Wins'):(es?'Puntos':'Points')}</Text><Text style={{height:13,color:C.muted,fontSize:9}}>{`R${v.round} · ${v.target}`}</Text></View>
   <View style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:8}}><Text style={{minWidth:24,textAlign:'right',color:C.goldLight,fontWeight:'700',fontSize:18}}>{tally[rival]}</Text><Text numberOfLines={1} style={{flex:1,color:C.ivory,fontSize:13}}>{v.names[rival]}</Text></View>
   <CancelRoomControl es={es} disabled={!enabled||!['playing','paused'].includes(v.phase)} onConfirm={async()=>{const ok=await onAction({type:'leave'});if(ok)onBack();return !!ok;}}/>
   <Pressable accessibilityRole="button" accessibilityLabel={es?'Menú de partida':'Game menu'} onPress={()=>{cancel();setMenu(true);}} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={19} color={C.gold}/></Pressable>
  </View>
  <View testID="domino-table-surface" style={{flex:1}}>
   <DominoTableBackground opponentHeight={opponentHeight} gift={null} es={es} finished={false}/>
   <View pointerEvents="none" accessible={false} style={{position:'absolute',top:(opponentHeight-15+height-48-94)/2-42.5,left:42,right:42,height:85}}><TableStamp title="DOMINO" engraved/></View>
   <View style={{height:opponentHeight,flexDirection:'row-reverse',alignItems:'flex-end',paddingHorizontal:12,gap:6}}>
    <View style={{width:82}}/>
    <View testID="online-rival-avatar" accessibilityLabel={`${v.names[rival]}`} style={{flex:1,minWidth:44,height:opponentHeight}}><OpponentDrinkingAvatar opponentId={opponentPhoto?'selfie':opponent.id} name={v.names[rival]??''} gift={null} invitation={null} source={opponentPhoto?{uri:opponentPhoto}:opponent.image} height={opponentHeight} es={es}/></View>
    <View style={{width:82,alignSelf:'flex-start',marginTop:14}}><Text style={{color:C.gold,fontSize:11,textAlign:'center'}}>ONLINE</Text></View>
   </View>
   <View testID="hidden-opponent-hand" style={{alignItems:'center',height:25,justifyContent:'center'}}><View style={{flexDirection:'row',gap:3}}>{Array.from({length:Math.min(10,v.opponentCount)},(_,i)=><DealtTile key={i} {...dealPresentation} index={i} side="computer" distance={windowSize.width}><View style={{width:15,height:24,borderRadius:2,borderWidth:1,borderColor:'#D5CAB0',backgroundColor:'#8E9A7C'}}/></DealtTile>)}<Text style={{color:C.muted,fontSize:10,marginLeft:3}}>{v.opponentCount}</Text></View></View>
   <View ref={tableRef} collapsable={false} testID="playing-surface" {...pan.panHandlers} onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0)setTableSize({width,height});}} style={{flex:1,marginHorizontal:12,minHeight:80,overflow:'hidden'}}>
    <Animated.View testID="board-camera" pointerEvents="box-none" style={{position:'absolute',left:(tableSize.width-metrics.width)/2,top:(tableSize.height-metrics.height)/2,width:metrics.width,height:metrics.height,transform:[{translateX:camera.values.x},{translateY:camera.values.y},{scale:camera.values.scale}]}}>
     <AnchoredBoard onPresented={board=>setPresented(board.map(t=>t.id).join(','))} key={v.round} board={v.board} openingId={opening} metrics={metrics} available={available} hovered={drag?hit(drag.point):null} showMatching={prefs.matchingTiles} arrivingId={v.last?.kind==='play'?v.last.tile?.id:null} winningId={v.result&&!v.result.blocked&&v.last?.kind==='play'?v.last.tile?.id:null} contactContext={{round:v.round,actor:v.last?.player,turn:v.turn,lastKind:v.last?.kind}} leftLabel={text.left} rightLabel={text.right} openLabel={`${v.names[v.turn??local]} ${text.openFreely}`} onEnd={end=>{if(active)play(active.id,end);}}/>
    </Animated.View>
    <GoldPressable finish gold={false} accessibilityRole="button" accessibilityLabel={es?'Centrar mesa':'Center table'} onPress={camera.center} style={{position:'absolute',right:0,top:0,minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:C.surface,borderRadius:12}}><Feather name="maximize" size={18} color={C.gold}/></GoldPressable>
   </View>
   <View testID="online-turn-actions" onLayout={e=>setActionsHeight(e.nativeEvent.layout.height)} style={{minHeight:v.result?36:52*Math.max(1,windowSize.fontScale??1),paddingHorizontal:12,paddingBottom:4,alignItems:'center',justifyContent:'flex-end'}}>
    {v.result?<View style={{alignItems:'center'}}>
     <OnlineRoundResult showHold={false} winnerName={v.result.winner==='tie'?null:v.names[v.winner??v.result.winner]} tie={v.result.winner==='tie'} matchComplete={!!v.winner} holdAvailable={!!v.presentation?.resultClock} enabled={resultControlEnabled&&v.phase==='playing'} es={es}
      roundKey={`${v.epoch}:${v.round}`} holding={v.presentation?.resultClock?.heldBy.includes(local)??false} onHold={()=>onAction({type:'holdResult'})} onRelease={()=>onAction({type:'releaseResult'})}/>
     {!v.winner&&!v.presentation?.resultClock&&v.phase==='playing'&&button(text.next,()=>onAction({type:'nextRound'}),!enabled)}
    </View>:
    selected&&humanTurn?<View style={{flexDirection:'row',justifyContent:'center',gap:8}}>{endsFor(selected).map(end=><View key={end}>{button(end==='left'?text.left:text.right,()=>play(selected,end))}</View>)}</View>:
    v.phase==='playing'&&v.turn!==local&&attentionSupported?null:
    <DominoTurnTitle active={humanTurn} label={status}/>}
    {!v.result&&!(selected&&humanTurn)&&<Text testID="online-turn-detail" numberOfLines={1} style={{color:C.muted,fontSize:11,textAlign:'center',lineHeight:14}}>{v.last?`${v.names[v.last.player]} ${v.last.kind==='draw'?text.drew:v.last.kind==='pass'?text.passed:`${text.played} ${v.last.tile?.a} · ${v.last.tile?.b}`}`:''}</Text>}
    <OnlineAttentionNotice event={v.presentation?.attention} localSeat={local} serverNow={serverNow??0} es={es} supported={attentionSupported&&serverNow!==undefined&&v.phase==='playing'&&!v.result} dismissalKey={attentionKey}/>
   </View>
   <View style={{paddingHorizontal:12,paddingBottom:2}}>

    <View testID="player-hand" style={{height:(size*2+26)*rows,width:(size+10)*columns+(columns-1)*2+4,alignSelf:'center',flexDirection:'row',flexWrap:rows===1?'nowrap':'wrap',columnGap:2,rowGap:4,justifyContent:'center',alignItems:'center',alignContent:'center'}}>
     {v.hand.map((tile,index)=>{const ends=endsFor(tile.id),canPlay=humanTurn&&ends.length>0;return <DealtTile key={tile.id} {...dealPresentation} index={index} side="human" distance={windowSize.width}><DraggableDomino gestureKey={`${v.epoch}:${v.round}:${v.phase}:${v.turn}:${boardKey}:${handKey}:${resultKey}:${humanTurn}`} tile={tile} size={size} enabled={canPlay} selected={selected===tile.id} revealed={!!v.result} dragging={drag?.tile.id===tile.id} onCancel={cancel}
      onTap={()=>{if(canPlay){if(ends.length===1||v.hand.length===1)play(tile.id,ends[0]);else setSelected(tile.id);}}}
      onDrag={point=>{if(!canPlay){cancel();return;}if(!dragId.current){camera.begin();dragId.current=tile.id;setSelected(null);rootRef.current?.measureInWindow((x,y)=>{rootOrigin.current={x,y};});tableRef.current?.measureInWindow((x,y)=>{tableOrigin.current={x,y};});}setDrag({tile,point});}}
      onDrop={point=>{if(dragId.current!==tile.id){cancel();return;}if(!canPlay){cancel();return;}const origin=tableOrigin.current,allowed=ends.map(end=>({end,point:chainSlot(offsets[end],metrics,v.board,opening)}));const end=origin?resolveScreenDrop({x:point.x-origin.x,y:point.y-origin.y},allowed,tableSize,metrics,camera.current.current,true):null;if(end)play(tile.id,end);else cancel();}}/></DealtTile>;})}
    </View>
   </View>
  </View>
  <View testID="domino-wood-edge" onLayout={e=>setWoodHeight(e.nativeEvent.layout.height)} style={{minHeight:compact?94:98,flexShrink:0,backgroundColor:'#704329',paddingHorizontal:12,paddingTop:4,paddingBottom:4}}><View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0}}><WoodSurface/></View>
   <ResultHoldButton id="online-result-hold" visible={!!v.result&&!v.winner&&!!v.presentation?.resultClock} presentationKey={holdPresentationKey} holding={v.presentation?.resultClock?.heldBy.includes(local)??false} disabled={!resultControlEnabled||v.phase!=='playing'} es={es} onHold={()=>{if(resultControlEnabled&&v.phase==='playing'&&v.result&&!v.winner&&v.presentation?.resultClock)onAction({type:'holdResult'});}} onRelease={()=>onAction({type:'releaseResult'})}/>

   <View testID="online-wood-controls" style={{minHeight:60,flexDirection:'row',alignItems:'center',gap:4}}>
    <View testID="online-wood-left" style={{width:80,flexShrink:0,alignItems:'flex-start',justifyContent:'center'}}>
     {voiceRelay&&<OnlineVoiceControl epoch={v.epoch} seat={local} opponentName={v.names[rival]??opponent.name} relay={voiceRelay} available={voiceAvailable} es={es} onStatus={setVoiceStatus}/>}
     {!!voiceStatus&&<Text testID="online-voice-status" accessibilityLabel={voiceStatus} accessibilityLiveRegion="polite" numberOfLines={2} style={{color:C.goldLight,fontSize:12,lineHeight:14,textAlign:'left',marginTop:2,paddingHorizontal:0,width:80}}>{voiceStatus}</Text>}
     <Text accessibilityLabel={`${text.stock}: ${v.stock.length}`} style={{color:C.muted,fontSize:10,lineHeight:12}}>{text.stock} · {v.stock.length}</Text>
    </View>
    <View style={{width:80,flexShrink:0}}/>
   </View>
<View testID="domino-avatar-axis" pointerEvents="box-none" style={{position:'absolute',top:'50%',marginTop:-36,left:0,right:0,height:72,alignItems:'center',zIndex:25}}><View testID="online-wood-right" style={{height:72,width:72,alignItems:'center',justifyContent:'center'}}><OnlineTurnTimer size={72} showIdleRing circularOnly avatar={selfPhoto?{uri:selfPhoto}:self.image} avatarLabel={selfName??''} avatarTestID="online-local-avatar" attentionKey={`domino:${v.epoch}:${v.round}:${v.turn}:${v.board.length}:${v.hand.length}:${v.stock.length}`} clock={v.turn===local?v.presentation?.turnClock:null} enabled={enabled&&!stock&&!stockBusy&&v.phase==='playing'&&v.turn===local&&!v.result} es={es} onPause={()=>onAction({type:'pauseTurnTimer'})} onResume={()=>onAction({type:'resumeTurnTimer'})}/><Text testID="online-local-name" accessibilityLabel={selfName??''} numberOfLines={1} style={{position:'absolute',top:69,left:-8,width:88,maxWidth:88,textAlign:'center',lineHeight:14,color:C.ivory,fontSize:12,fontWeight:'600'}}>{selfName}</Text></View></View>
   {v.phase==='playing'&&v.turn!==local&&attentionSupported&&!v.result&&<View testID="online-wood-attention" style={{position:'absolute',right:0,top:'50%',marginTop:panelWidth<360?-45.5:-22}}><OnlineQuickActions compact stacked={panelWidth<360} enabled={enabled&&!stockBusy} supported={attentionSupported} es={es} onSend={async kind=>await onAction({type:'attention',kind})===true}/></View>}
   {!!notice&&<Text testID="online-share-notice" selectable accessibilityLiveRegion="polite" style={{color:C.goldLight,fontSize:12,lineHeight:16,textAlign:'center',marginTop:2,paddingHorizontal:80}}>{notice}</Text>}

  </View>
  {drag&&<View pointerEvents="none" style={{position:'absolute',left:drag.point.x-rootOrigin.current.x-size/2,top:drag.point.y-rootOrigin.current.y-size,zIndex:100}}><DominoTile a={drag.tile.a} b={drag.tile.b} size={size} vertical selected/></View>}
  <FloatingAction id="domino-online-draw-pass" side="right" color={v.canDraw?"#267B58":"#A4453D"} label={v.canDraw?(es?'ROBAR':'DRAW'):(es?'PASAR':'PASS')} visible={humanTurn&&(v.canDraw||v.canPass)} enabled={humanTurn&&(v.canDraw||v.canPass)} bottom={woodHeight+56} onPress={()=>{if(!humanTurn)return;v.canDraw?openStock():v.canPass&&sendAction({type:'pass'});}}/>
  <Modal visible={stock} transparent animationType="fade" onRequestClose={closeStock}><View style={{flex:1,justifyContent:'center',padding:18,backgroundColor:'rgba(2,12,10,0.52)'}}><View style={{maxWidth:420,width:'100%',alignSelf:'center',borderRadius:18,borderWidth:2,borderColor:C.gold,padding:14,paddingTop:60,backgroundColor:'#704329'}}><View pointerEvents="none" accessible={false} style={{position:'absolute',inset:0,borderRadius:16,overflow:'hidden'}}><WoodSurface/></View><ModalCloseButton finish testID="online-boneyard-cancel" es={es} disabled={!enabled||stockBusy} onPress={closeStock}/><Text style={{color:C.goldLight,textAlign:'center',fontSize:17,marginBottom:12}}>{es?'Elige una ficha del pozo':'Choose a tile from the boneyard'}</Text><ScrollView contentContainerStyle={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8}}>{v.stock.map((slot,i)=><Pressable key={slot} accessibilityRole="button" accessibilityLabel={`${es?'Ficha boca abajo':'Face-down tile'} ${i+1}`} disabled={!enabled||stockBusy||!v.canDraw} onPress={()=>requestStock({type:'draw',slot})} style={{width:36,height:64,borderRadius:5,borderWidth:2,borderColor:'#CEBD96',backgroundColor:'#F7F0DA'}}/>)}</ScrollView>
   {(error||stockError||v.phase==='paused')&&<Text accessibilityRole="alert" style={{color:C.ivory,textAlign:'center',marginTop:10}}>{error??stockError??status}</Text>}
  </View></View></Modal>
  <Modal visible={menu||rules} transparent animationType="fade" onRequestClose={()=>{setMenu(false);setRules(false);}}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(2,12,10,0.82)'}}><View style={{maxHeight:'85%',borderRadius:24,padding:24,paddingTop:64,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,gap:12}}>
   <ModalCloseButton finish testID="online-menu-close" es={es} onPress={()=>{setMenu(false);setRules(false);}}/>
   {rules?<ScrollView><Text style={{color:C.ivory,fontSize:15,lineHeight:25}}>{text.rules}</Text></ScrollView>:<><Text selectable style={{color:C.goldLight,textAlign:'center'}}>{v.manualCode?`${es?'Código manual':'Manual code'}: ${v.manualCode}`:v.code}</Text>{button(text.showRules,()=>setRules(true))}</>}
  </View></View></Modal>
  <RoomClosedNotice visible={v.phase==='closed'} es={es} reason={v.closeReason} onBack={onBack}/>
 </View>;
}
