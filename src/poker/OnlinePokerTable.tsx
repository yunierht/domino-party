import {useOnlinePokerCardSound} from './useOnlinePokerCardSound';
import {usePrefs} from '../state/PrefsContext';
import {tablePlayerCardWidth} from '../components/tableCardSize';
import {usePokerWinEstimate} from './usePokerWinEstimate';
import {PokerLearningControl} from './PokerLearningControl';
import {OpponentDrinkingAvatar} from '../computer/OpponentDrinkingAvatar';
import {PokerHandHint} from './PokerHandHint';
import {GameSwitchButton} from './TableGameContext';
import {CancelRoomControl,RoomClosedNotice} from '../online/OnlineCancellation';
import {HomeButton} from '../components/HomeButton';
import {TableSettings} from '../computer/TableSettings';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Image,Text,View,Pressable,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TABLE as C} from '../computer/tableTheme';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {DominoTableBackground} from '../computer/DominoTableBackground';
import {GoldPressable} from '../components/GoldPressable';
import {ResultHoldButton} from '../components/ResultHoldButton';
import {OnlineTurnTimer,OnlineElapsedTurnTimer} from '../online/OnlineTurnTimer';
import {OnlineVoiceControl} from '../online/OnlineVoiceControl';
import type {VoiceRelay} from '../online/OnlineVoiceControl';
import {OnlineQuickActions,OnlineAttentionNotice} from '../online/OnlineQuickActions';
import {FloatingAction} from '../blackjack/FloatingAction';
import {PokerCard} from './PokerCard';
import {PokerPot} from './PokerPot';
import {PokerRaiseSlider} from './PokerRaiseSlider';
import {ChipRaiseTray,RaiseControls,SelectedChipPile} from './ChipRaiseTray';
import {ChipFlight,type Flight} from '../blackjack/ChipFlight';
import {chipAmounts} from '../blackjack/chipAmounts';
import {SeatChipPile} from '../blackjack/SeatChipPile';
import {WoodSurface,TableStamp} from '../blackjack/TableFinish';
import {combinationCards,evaluate} from './engine';
import type {Card,Seat} from './engine';
import type {PokerOnlineView,PokerOnlineAction} from './onlineContract';
import {PokerResultBanner} from './PokerResultBanner';
import {describePokerResult} from './resultPresentation';
type Props={onSwitchGame?:()=>void;view:PokerOnlineView;busy:boolean;connected:boolean;es:boolean;onCommand:(action:PokerOnlineAction)=>Promise<boolean>;onHold:(held:boolean)=>void;voice:VoiceRelay;onBack:()=>void;onShare?:()=>void;onInviteCode?:()=>void;overlayOpen?:boolean};
function Button({label,onPress,disabled=false,id}:{label:string;onPress:()=>void;disabled?:boolean;id?:string}){return <GoldPressable finish testID={id} disabled={disabled} accessibilityRole="button" accessibilityState={{disabled}} onPress={onPress} style={{minHeight:42,paddingHorizontal:12,paddingVertical:9,borderRadius:12,backgroundColor:C.gold,alignItems:'center',justifyContent:'center',opacity:disabled?.45:1}}><Text style={{color:C.background,fontWeight:'700',fontSize:13,textAlign:'center'}}>{label}</Text></GoldPressable>;}
function Avatar({view,seat,width=76,own=false}:{view:PokerOnlineView;seat:Seat;width?:number;own?:boolean}){const id=view.presentation.avatars[seat],photo=view.presentation.avatarPhotos[seat],item=DOMINO_AVATARS.find(a=>a.id===id);return <View testID={own?'poker-local-identity':'poker-opponent-identity'} style={{alignItems:'center',width:own?'100%':110,gap:own?2:0}}><Image testID={own?'poker-local-avatar':'poker-opponent-avatar'} accessibilityLabel={view.names[seat]??''} source={photo?{uri:photo}:item?.image??DOMINO_AVATARS[0].image} resizeMode={own||photo?'cover':'contain'} style={{width,height:own?width:width*.8,borderRadius:own?22:photo?12:0,borderWidth:own?1:0,borderColor:view.turn===seat?C.gold:C.line}}/><Text testID={own?'poker-local-name':'poker-opponent-name'} numberOfLines={own?2:1} style={{color:own?C.ivory:C.goldLight,fontSize:own?12:13,lineHeight:own?14:16,fontWeight:'600',textAlign:'center',maxWidth:own?160:110}}>{view.names[seat]}</Text></View>;}
const categoriesES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
const categoriesEN=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
/** Renders filtered snapshots. It cannot execute AI, shuffle, settle or reveal hidden cards. */
export function OnlinePokerTable({view:v,busy,connected,es,onCommand,onHold,voice,onBack,onShare,onInviteCode,overlayOpen=false,onSwitchGame}:Props){
 const window=useWindowDimensions(),insets=useSafeAreaInsets(),fontScale=window.fontScale;
 const [panelSize,setPanelSize]=useState({width:window.width,height:window.height-insets.top-insets.bottom});
 const {width,height:panelHeight}=panelSize,usableHeight=panelHeight,woodSize=usableHeight<720?94:98,compact=usableHeight<720,opponentHeight=compact?84:Math.min(165,usableHeight*.2),self=v.seat,rival:Seat=self==='human'?'computer':'human';
 const winEstimate=usePokerWinEstimate({hero:v.hand,board:v.board},connected&&v.phase==='playing'&&!v.result);
 const tapSending=useRef(false),callSending=useRef(false),callGeneration=useRef(0),callMounted=useRef(true);
 const [callFlight,setCallFlight]=useState<Flight|null>(null);
 const [settings,setSettings]=useState(false),[woodHeight,setWoodHeight]=useState(woodSize);
 const [selected,setSelected]=useState<number[]>([]),[holding,setHolding]=useState(false),[voiceStatus,setVoiceStatus]=useState<string|null>(null);
 const root=useRef<View>(null),potSpot=useRef<View>(null),selection=useRef<number[]>([]),flightSerial=useRef(0),flightGeneration=useRef(0);
 const [flights,setFlights]=useState<(Flight&{order:number;generation:number})[]>([]),[landed,setLanded]=useState<Set<number>>(new Set());
 const clearSelection=()=>{currentDraft.current.amount=0;selection.current=[];setSelected([]);flightGeneration.current++;setFlights([]);setLanded(new Set());};
 useEffect(()=>{callMounted.current=true;return()=>{flightGeneration.current++;callMounted.current=false;callGeneration.current++;};},[]);
 useEffect(()=>{callGeneration.current++;setCallFlight(null);},[v.epoch,v.round,connected]);
 const key=`${v.epoch}:${v.round}:${v.street}:${v.turn}`,selectedKey=useRef(key),latest=useRef(v);latest.current=v;
 const analysisPause=useRef<{epoch:string;round:number;street:typeof v.street;resume:boolean}|null>(null);
 const openAnalysis=async()=>{
  const snapshot=latest.current;if(analysisPause.current||!connected||busy||snapshot.phase!=='playing'||snapshot.turn!==self||snapshot.result)return false;
  clearSelection();
  const token={epoch:snapshot.epoch,round:snapshot.round,street:snapshot.street,resume:!!snapshot.presentation.turnClock&&!snapshot.presentation.turnClock.paused};analysisPause.current=token;
  if(token.resume&&!await onCommand({type:'pauseTurnTimer'})){analysisPause.current=null;return false;}
  return true;
 };
 const closeAnalysis=()=>{const token=analysisPause.current;analysisPause.current=null;const now=latest.current;if(token?.resume&&now.epoch===token.epoch&&now.round===token.round&&now.street===token.street&&now.turn===self&&now.phase==='playing'&&!now.result)void onCommand({type:'resumeTurnTimer'});};
 const prefs=usePrefs();
 useOnlinePokerCardSound({handKey:v.code+':'+v.epoch+':'+v.round,boardCount:v.board.length,enabled:connected&&v.phase==='playing'&&!settings&&!overlayOpen,sound:prefs.tileSound,ready:prefs.ready});
 const enabled=connected&&!busy&&!settings&&!overlayOpen&&v.legal.enabled,selectionTotal=selectedKey.current===key?selected.reduce((s,n)=>s+n,0):0;
 const available=v.stacks[self]-selectionTotal,raiseTo=v.bets[self]+selectionTotal;
 const selectRaiseTotal=(target:number)=>{if(!enabled||!v.legal.canRaise)return;const needed=Math.max(0,Math.min(target,v.legal.maxTo)-v.bets[self]);clearSelection();const coins=chipAmounts(needed),rest=needed-coins.reduce((sum,n)=>sum+n,0);selection.current=rest?[...coins,rest]:coins;setSelected(selection.current);setLanded(new Set(coins.map((_n,i)=>i)));};
 const currentDraft=useRef({enabled,key,raiseTo,amount:selectionTotal});currentDraft.current={enabled,key,raiseTo,amount:selectionTotal};
 const resultKey=useMemo(()=>({key:`${v.code}:${v.round}`}),[v.code,v.round]);
 useEffect(()=>{selectedKey.current=key;clearSelection();},[key]);
 useEffect(()=>{if(settings||overlayOpen)clearSelection();},[settings,overlayOpen]);
 useEffect(()=>{if(!connected||v.phase!=='playing'){clearSelection();setHolding(false);onHold(false);}},[connected,v.phase,onHold]);
 const send=async(action:PokerOnlineAction)=>{currentDraft.current.amount=0;clearSelection();return onCommand(action);};
 const add=(amount:number,source?:React.RefObject<View|null>)=>{
  if(!enabled||!v.legal.canRaise)return;const total=selection.current.reduce((sum,n)=>sum+n,0);if(total+amount>v.stacks[self])return;
  const order=selection.current.length,token=flightGeneration.current;selection.current=[...selection.current,amount];setSelected(selection.current);
  const animate=(rx:number,ry:number,sx:number,sy:number,tx:number,ty:number)=>{if(token!==flightGeneration.current)return;setFlights(items=>[...items,{id:++flightSerial.current,amount,kind:'bet',order,generation:token,holdUntilLanding:true,from:{x:sx-rx,y:sy-ry},to:{x:tx-rx,y:ty-ry}}]);};
  if(root.current&&source?.current&&potSpot.current)root.current.measureInWindow((rx,ry)=>source.current?.measureInWindow((sx,sy,sw,sh)=>potSpot.current?.measureInWindow((tx,ty,tw,th)=>animate(rx,ry,sx+sw/2,sy+sh/2,tx+tw/2,ty+th-21))));
  else animate(0,0,width/2,panelHeight-woodHeight+44,potLeft+35,panelHeight-woodHeight-toolbarHeight-potGap-21);
 };
 const confirm=()=>{const current=latest.current,draft=currentDraft.current;if(!draft.enabled||!draft.amount||draft.key!==key||selectedKey.current!==key||current.epoch!==v.epoch||current.round!==v.round||current.street!==v.street||current.turn!==self)return;void send({type:'raise',to:draft.raiseTo});};
 const winningCards=v.result?.reason==='showdown'?(v.result.winner==='tie'?[...combinationCards([...v.hand,...v.board]),...combinationCards([...(v.opponentHand??[]),...v.board])]:combinationCards([...(v.result.winner===self?v.hand:v.opponentHand??[]),...v.board])):[];
 const winning=(card:Card|undefined)=>!!card&&winningCards.some(c=>c.rank===card.rank&&c.suit===card.suit);
 const result=v.result?describePokerResult({result:v.result},es,v.names[rival]??'',v.names[self]??'',self):null;
 const ownWidth=tablePlayerCardWidth(width,usableHeight),handsWidth=Math.min(compact?60:74,(width-52)/4);
 const needsRebuy=!!v.result&&v.stacks[self]===0,toolbarHeight=needsRebuy?110:78,ownCardsBottom=v.result?42:0,actionWidth=Math.min(112,Math.max(44,(width-200)/2-4));
 const rivalCardsBottom=opponentHeight+(compact?0:usableHeight<900?15:30)+handsWidth*1.43;
 const roomForBoard=panelHeight-48-woodHeight-toolbarHeight-ownCardsBottom-14-ownWidth*1.43-10-24*Math.max(1,Math.min(1.3,fontScale??1))-rivalCardsBottom-16;
 const cardWidth=Math.min(handsWidth,(width-32-24)/5,v.result?Infinity:Math.max(24,(roomForBoard-10)/1.43)),cardHeight=cardWidth*1.43+10;
 const feltHeight=Math.max(0,panelHeight-48-woodHeight-toolbarHeight),communityTop=Math.max(v.result&&v.result.winner!=='tie'&&v.result.winner!==self?opponentHeight+(compact?0:usableHeight<900?15:30)+handsWidth*1.43+70:0,rivalCardsBottom+8,Math.min((opponentHeight-15+feltHeight)/2-cardHeight/2-0,feltHeight-ownCardsBottom-14-ownWidth*1.43-10-24*Math.max(1,Math.min(1.3,fontScale??1))-cardHeight-8));
 const potLeft=v.result?Math.min(40,Math.max(12,Math.floor((width-(2*handsWidth+7))/2-76))):Math.max(4,actionWidth/2-35),potGap=v.result?(compact?44:58):Math.max(4,(compact?88:128)-10-toolbarHeight);
 const checkOrCall=async()=>{if(!enabled||selection.current.length||callSending.current||latest.current!==v)return;if(v.legal.canCheck){void send({type:'check'});return;}const amount=Math.min(v.legal.toCall,v.stacks[self]),token=callGeneration.current;if(amount<=0)return;callSending.current=true;try{const accepted=await send({type:'call'});if(accepted&&callMounted.current&&token===callGeneration.current&&latest.current.epoch===v.epoch&&latest.current.round===v.round)setCallFlight({id:++flightSerial.current,kind:'bet',amount,from:{x:width/2,y:panelHeight-woodHeight/2},to:{x:potLeft+35,y:panelHeight-woodHeight-toolbarHeight-potGap-21}});}catch{return;}finally{callSending.current=false;}};
 const liveCards=!v.result?combinationCards([...v.hand,...v.board]):[],highlight=(card:Card|undefined)=>!!card&&liveCards.some(c=>c.rank===card.rank&&c.suit===card.suit);
 const rivalAvatar=DOMINO_AVATARS.find(a=>a.id===v.presentation.avatars[rival])??DOMINO_AVATARS[0],rivalPhoto=v.presentation.avatarPhotos[rival];
 return <View ref={root} testID="online-poker-table" onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0)setPanelSize({width,height});}} style={{flex:1,minHeight:0,overflow:'hidden',backgroundColor:C.background}}>
  <View style={{height:48,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={onBack} style={{width:44,height:44,justifyContent:'center'}}><Feather name="chevron-left" size={22} color={C.goldLight}/></Pressable><HomeButton es={es}/><View style={{flex:1,alignItems:'center'}}><Text style={{color:C.ivory,fontSize:16,letterSpacing:3,fontWeight:'600'}}>TEXAS HOLD’EM</Text><Text style={{color:C.gold,fontSize:9,letterSpacing:1.5}}>SOCIAL CLUB · NO LIMIT</Text></View><CancelRoomControl es={es} disabled={!connected||busy||!['playing','paused'].includes(v.phase)} onConfirm={async()=>{const ok=await onCommand({type:'leave'});if(ok)onBack();return ok;}}/><Pressable testID="poker-online-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>setSettings(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={20} color={C.gold}/></Pressable></View>
  <View testID="poker-online-felt" style={{flex:1,minHeight:0,overflow:'hidden'}}>
   <DominoTableBackground opponentHeight={opponentHeight} gift={null} es={es} finished={!!v.result}/>
   <View pointerEvents="none" style={{position:'absolute',zIndex:0,top:(opponentHeight-15+feltHeight)/2-42.5,left:40,right:40,height:85}}><TableStamp title="POKER" engraved/></View>
   <View style={{zIndex:1,height:opponentHeight,flexDirection:'row-reverse',paddingHorizontal:12,alignItems:'flex-end',gap:6}}><View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:6}}><GameSwitchButton whiteDomino targetMode="domino" onSelect={onSwitchGame} disabled={!connected}/><GameSwitchButton blackjack/></View><View testID="poker-opponent-identity" style={{flex:1,minWidth:44,height:opponentHeight}}><OpponentDrinkingAvatar opponentId={rivalPhoto?'selfie':rivalAvatar.id} name={v.names[rival]??''} source={rivalPhoto?{uri:rivalPhoto}:rivalAvatar.image} height={opponentHeight} gift={null} invitation={null} es={es}/></View><View style={{width:82,alignSelf:'flex-start',marginTop:14}}><Text style={{color:C.muted,fontSize:9,textAlign:'center'}}>{es?'MANO':'HAND'} {v.round}</Text><View testID="online-opponent-clock" style={{alignItems:'center',marginTop:6}}><OnlineElapsedTurnTimer clock={connected&&['playing','paused'].includes(v.phase)&&v.turn===rival&&!v.result?v.presentation.turnClock:null} es={es}/></View></View></View>
   <View style={{zIndex:1,height:compact?64:95.5,alignItems:'center',justifyContent:'center'}}><View testID="poker-opponent-cards" style={{position:'absolute',top:compact?0:usableHeight<900?15:30,left:'50%',marginLeft:-(2*handsWidth+6)/2,flexDirection:'row',gap:6}}>{[0,1].map(i=><PokerCard fixedBack key={v.round+':rival:'+i} card={v.opponentHand?.[i]} back={!v.opponentHand} width={handsWidth} animate winning={winning(v.opponentHand?.[i])}/>)}{result&&v.result?.winner===rival?<View testID="poker-online-result-anchor" pointerEvents="none" style={{position:'absolute',top:handsWidth*1.43+16,left:'50%',marginLeft:-Math.min(240,width-32)/2,width:Math.min(240,width-32),zIndex:16}}><PokerResultBanner compact celebrate result={result} paused={holding||v.phase!=='playing'}/></View>:null}</View></View>
   <View style={{position:'absolute',zIndex:1,top:communityTop,left:0,right:0,alignItems:'center'}}><View testID="poker-community-cards" style={{flexDirection:'row',gap:6}}>{[0,1,2,3,4].map(i=><PokerCard key={v.round+':board:'+i} card={v.board[i]} slot width={cardWidth} animate delay={i*60} winning={winning(v.board[i])} combination={highlight(v.board[i])} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'}/>)}</View></View>
   <View pointerEvents="none" style={{position:'absolute',bottom:ownCardsBottom+14+ownWidth*1.43+10,left:0,right:0}}><PokerHandHint visible={!v.result} text={(es?'Tu mano':'Your hand')+' · '+(v.board.length>=3?(es?categoriesES:categoriesEN)[evaluate([...v.hand,...v.board])[0]]:v.hand[0]?.rank===v.hand[1]?.rank?(es?'Pareja en mano':'Pocket pair'):(es?'Sin pareja':'No pair'))} chance={winEstimate?"("+winEstimate.win.toFixed(1)+"%)":"(…)"} chanceLabel={(es?"Probabilidad de ganar: ":"Winning chance: ")+(winEstimate?winEstimate.win.toFixed(1)+"%":es?"calculando":"calculating")} fontScale={fontScale??1}/></View>
   <View style={{position:'absolute',zIndex:1,bottom:ownCardsBottom,left:0,right:0,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,paddingVertical:7,minHeight:82}}><View testID="poker-own-cards" style={{flexDirection:'row',gap:7,transform:[{translateY:0}]}}>{v.hand.map((card,i)=><PokerCard key={v.round+':own:'+i} card={card} width={ownWidth} animate winning={winning(card)} combination={highlight(card)} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'}/>)}</View></View>
   <View testID="poker-online-rival-chip-position" style={{position:'absolute',zIndex:1,left:32,top:opponentHeight+14}}><SeatChipPile amount={v.stacks[rival]} name={v.names[rival]??''} hideName piles={3}/></View>
   <View ref={potSpot} collapsable={false} testID="poker-online-pot-position" style={{position:'absolute',zIndex:1,left:potLeft,bottom:potGap,width:70,height:74}}><PokerPot compactDraft={!v.result} amount={v.pot+selectionTotal} es={es} chips={[...chipAmounts(v.pot),...(selectionTotal?selected.filter((_n,i)=>landed.has(i)):[])]}/></View>
   {result&&v.result?.winner!==rival?<View testID="poker-online-result-anchor" pointerEvents="none" style={{position:'absolute',bottom:0,left:'50%',marginLeft:-Math.min(240,width-32)/2,width:Math.min(240,width-32),zIndex:16}}><PokerResultBanner compact celebrate={v.result?.winner===self} result={result} paused={holding||v.phase!=='playing'}/></View>:null}
  </View>
  <View testID="poker-online-toolbar" style={{height:toolbarHeight,flexShrink:0,alignItems:'center',justifyContent:needsRebuy?'center':'flex-start',backgroundColor:'#123C30'}}>
   {needsRebuy?<View testID="poker-rebuy-row" style={{height:58,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Sin fichas':'No chips'}</Text><View style={{flexDirection:'row',justifyContent:'center',gap:6}}>{[500,1000,2000].map(amount=><Button key={amount} disabled={busy||!connected||v.phase!=='playing'} label={String(amount)} onPress={()=>void onCommand({type:'rebuy',amount})}/>)}</View></View>:null}
   <View testID="poker-toolbar-actions" style={{height:44,flexDirection:'row',gap:6,alignItems:'center'}}>
   <View testID="poker-learning-position" style={{width:44,height:44}}><PokerLearningControl hero={v.hand} board={v.board} es={es} enabled={connected&&v.phase==='playing'&&v.turn===self&&!v.result&&!settings&&!overlayOpen} onOpen={openAnalysis} onClose={closeAnalysis}/></View>
   <OnlineQuickActions appearance="poker" kinds={['knock']} es={es} supported enabled={connected&&!busy&&!settings&&!overlayOpen&&v.phase==='playing'&&!v.result&&v.turn!==self} onSend={kind=>onCommand({type:'attention',kind})}/>
   <OnlineVoiceControl appearance="poker" epoch={v.epoch} seat={self} relay={voice} available={connected&&v.phase==='playing'} es={es} onStatus={setVoiceStatus} opponentName={v.names[rival]??''}/>
  </View>
   {!!voiceStatus&&<Text testID="poker-online-voice-status" accessibilityLabel={voiceStatus} accessibilityLiveRegion="polite" numberOfLines={2} style={{width:Math.max(120,width-2*actionWidth-16),maxWidth:240,height:28,color:C.goldLight,fontSize:11,lineHeight:14,textAlign:'center'}}>{voiceStatus}</Text>}
  </View>
  <View testID="poker-online-wood" onLayout={e=>setWoodHeight(e.nativeEvent.layout.height)} style={{height:woodSize,flexShrink:0,paddingHorizontal:12,paddingTop:4,paddingBottom:4}}>
   <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0,bottom:0}}><WoodSurface/></View>
   <View testID="poker-online-balance-position" style={{position:'absolute',top:-34,left:0,width:actionWidth,height:24,zIndex:26}}><Text testID="poker-online-balance" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8} style={{color:C.goldLight,fontSize:15,lineHeight:20,fontWeight:'700',textAlign:'center'}}>{'$'+available.toLocaleString()}</Text></View>
   <View testID="poker-avatar-axis" pointerEvents="box-none" style={{position:'absolute',top:'50%',marginTop:-36,left:0,right:0,height:72,alignItems:'center',zIndex:25}}><View testID="poker-online-clock-position" style={{height:72,width:72,alignItems:'center',justifyContent:'center'}}><OnlineTurnTimer size={72} circularOnly avatar={v.presentation.avatarPhotos[self]?{uri:v.presentation.avatarPhotos[self]!}:DOMINO_AVATARS.find(a=>a.id===v.presentation.avatars[self])?.image??DOMINO_AVATARS[0].image} avatarLabel={v.names[self]??''} avatarTestID="poker-local-avatar" attentionKey={v.epoch+':'+v.round+':'+v.street+':'+v.turn+':'+v.currentBet+':'+v.bets[self]} clock={v.turn===self?v.presentation.turnClock:null} enabled={enabled} es={es} onPause={()=>void onCommand({type:'pauseTurnTimer'})} onResume={()=>void onCommand({type:'resumeTurnTimer'})}/><Text testID="poker-local-name" accessibilityLabel={v.names[self]??''} numberOfLines={1} style={{position:'absolute',top:69,left:-8,width:88,maxWidth:88,textAlign:'center',lineHeight:14,color:C.ivory,fontSize:12,fontWeight:'600'}}>{v.names[self]}</Text></View></View>
   <OnlineAttentionNotice event={v.presentation.attention} localSeat={self} serverNow={v.presentation.turnClock?.serverNow??v.presentation.resultClock?.serverNow??Date.now()} es={es} dismissalKey={v.round+':'+v.turn+':'+v.phase}/>

  </View>
  <PokerRaiseSlider draftKey={key} visible={enabled&&v.legal.canRaise&&!v.result} thumbWidth={actionWidth} railHeight={woodHeight+(compact?56:96)} railBottom={4} minimum={v.legal.minTo} maximum={v.legal.maxTo} ownBet={v.bets[self]} total={raiseTo} pending={selectionTotal>0} enabled={enabled&&v.legal.canRaise} es={es} onSelect={selectRaiseTotal} onClear={clearSelection} onTap={amount=>{if(tapSending.current||!currentDraft.current.enabled||!v.legal.canRaise||latest.current!==v)return;tapSending.current=true;void send({type:'raise',to:amount}).finally(()=>{tapSending.current=false;});}} onConfirm={confirm}/>
  <View testID="poker-result-hold-position" pointerEvents="box-none" style={{position:'absolute',bottom:48,left:0,right:0,height:0}}>{result&&v.phase==='playing'?<ResultHoldButton width={actionWidth} id="poker-online-hold" presentationKey={resultKey} holding={holding} disabled={!connected} onHold={()=>{setHolding(true);onHold(true);}} onRelease={()=>{setHolding(false);onHold(false);}} es={es}/>:null}</View>
  <FloatingAction compactLabel id="poker-online-fold" label={es?'RETIRAR':'FOLD'} side="right" color="#A4453D" visible={enabled&&!v.result} enabled={enabled} width={actionWidth} bottom={4} onPress={()=>void send({type:'fold'})}/>
  <FloatingAction compactLabel id="poker-online-check-call" label={v.legal.toCall?(es?'IGUALAR ':'CALL ')+v.legal.toCall:(es?'PASAR':'CHECK')} side="right" color="#267B58" visible={enabled&&!v.result} enabled={enabled&&selectionTotal===0} width={actionWidth} bottom={56} onPress={()=>void checkOrCall()}/>
  {callFlight&&<ChipFlight key={'call:'+callFlight.id} flight={callFlight} paused={settings||overlayOpen||holding||!connected||v.phase!=='playing'} onComplete={()=>setCallFlight(current=>current?.id===callFlight.id?null:current)}/>}
  {flights.map(f=><ChipFlight key={f.id} flight={f} paused={settings||overlayOpen||holding||!connected||v.phase!=='playing'} onComplete={()=>{if(f.generation!==flightGeneration.current)return;setFlights(items=>items.filter(item=>item.id!==f.id));setLanded(previous=>new Set([...previous,f.order]));}}/>)}
  <TableSettings matching={false} visible={settings} es={es} onClose={()=>setSettings(false)}/>
  <RoomClosedNotice visible={v.phase==='closed'} es={es} reason={v.closeReason} onBack={onBack}/>
 </View>;
}
