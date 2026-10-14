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
import {OnlineTurnTimer} from '../online/OnlineTurnTimer';
import {OnlineVoiceControl} from '../online/OnlineVoiceControl';
import type {VoiceRelay} from '../online/OnlineVoiceControl';
import {OnlineQuickActions,OnlineAttentionNotice} from '../online/OnlineQuickActions';
import {FloatingAction} from '../blackjack/FloatingAction';
import {PokerCard} from './PokerCard';
import {PokerPot} from './PokerPot';
import {ChipRaiseTray,RaiseControls,SelectedChipPile} from './ChipRaiseTray';
import {SeatChipPile} from '../blackjack/SeatChipPile';
import {WoodSurface,TableStamp} from '../blackjack/TableFinish';
import {combinationCards,evaluate} from './engine';
import type {Card,Seat} from './engine';
import type {PokerOnlineView,PokerOnlineAction} from './onlineContract';
import {PokerResultBanner} from './PokerResultBanner';
type Props={view:PokerOnlineView;busy:boolean;connected:boolean;es:boolean;onCommand:(action:PokerOnlineAction)=>Promise<boolean>;onHold:(held:boolean)=>void;voice:VoiceRelay;onBack:()=>void;onShare?:()=>void;onInviteCode?:()=>void;overlayOpen?:boolean};
function Button({label,onPress,disabled=false,id}:{label:string;onPress:()=>void;disabled?:boolean;id?:string}){return <GoldPressable finish testID={id} disabled={disabled} accessibilityRole="button" accessibilityState={{disabled}} onPress={onPress} style={{minHeight:42,paddingHorizontal:12,paddingVertical:9,borderRadius:12,backgroundColor:C.gold,alignItems:'center',justifyContent:'center',opacity:disabled?.45:1}}><Text style={{color:C.background,fontWeight:'700',fontSize:13,textAlign:'center'}}>{label}</Text></GoldPressable>;}
function Avatar({view,seat,width=76,own=false}:{view:PokerOnlineView;seat:Seat;width?:number;own?:boolean}){const id=view.presentation.avatars[seat],photo=view.presentation.avatarPhotos[seat],item=DOMINO_AVATARS.find(a=>a.id===id);return <View testID={own?'poker-local-identity':'poker-opponent-identity'} style={{alignItems:'center',width:own?'100%':110,gap:own?2:0}}><Image testID={own?'poker-local-avatar':'poker-opponent-avatar'} accessibilityLabel={view.names[seat]??''} source={photo?{uri:photo}:item?.image??DOMINO_AVATARS[0].image} resizeMode={own||photo?'cover':'contain'} style={{width,height:own?width:width*.8,borderRadius:own?22:photo?12:0,borderWidth:own?1:0,borderColor:view.turn===seat?C.gold:C.line}}/><Text testID={own?'poker-local-name':'poker-opponent-name'} numberOfLines={own?2:1} style={{color:own?C.ivory:C.goldLight,fontSize:own?12:13,lineHeight:own?14:16,fontWeight:'600',textAlign:'center',maxWidth:own?160:110}}>{view.names[seat]}</Text></View>;}
const categoriesES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
const categoriesEN=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
/** Renders filtered snapshots. It cannot execute AI, shuffle, settle or reveal hidden cards. */
export function OnlinePokerTable({view:v,busy,connected,es,onCommand,onHold,voice,onBack,onShare,onInviteCode,overlayOpen=false}:Props){
 const {height,width,fontScale}=useWindowDimensions(),insets=useSafeAreaInsets(),usableHeight=height-insets.top-insets.bottom,woodSize=usableHeight<720?94:98,compact=usableHeight<720,opponentHeight=compact?84:Math.min(165,usableHeight*.2),self=v.seat,rival:Seat=self==='human'?'computer':'human';
 const [panelHeight,setPanelHeight]=useState(usableHeight);
 const [settings,setSettings]=useState(false),[woodHeight,setWoodHeight]=useState(woodSize);
 const [selected,setSelected]=useState<number[]>([]),[holding,setHolding]=useState(false),[voiceStatus,setVoiceStatus]=useState<string|null>(null);
 const key=`${v.epoch}:${v.round}:${v.street}:${v.turn}`,selectedKey=useRef(key),latest=useRef(v);latest.current=v;
 const enabled=connected&&!busy&&!settings&&!overlayOpen&&v.legal.enabled,selectionTotal=selectedKey.current===key?selected.reduce((s,n)=>s+n,0):0;
 const available=v.stacks[self]-selectionTotal,raiseTo=v.bets[self]+selectionTotal;
 const currentDraft=useRef({enabled,key,raiseTo,amount:selectionTotal});currentDraft.current={enabled,key,raiseTo,amount:selectionTotal};
 const resultKey=useMemo(()=>({key:`${v.code}:${v.round}`}),[v.code,v.round]);
 useEffect(()=>{selectedKey.current=key;setSelected([]);},[key]);
 useEffect(()=>{if(!connected||v.phase!=='playing'){setSelected([]);setHolding(false);onHold(false);}},[connected,v.phase,onHold]);
 const send=async(action:PokerOnlineAction)=>{currentDraft.current.amount=0;setSelected([]);return onCommand(action);};
 const add=(amount:number)=>{if(!enabled||!v.legal.canRaise)return;setSelected(previous=>{const total=previous.reduce((sum,n)=>sum+n,0);return total+amount<=v.stacks[self]?[...previous,amount]:previous;});};
 const confirm=()=>{const current=latest.current,draft=currentDraft.current;if(!draft.enabled||!draft.amount||draft.key!==key||selectedKey.current!==key||current.epoch!==v.epoch||current.round!==v.round||current.street!==v.street||current.turn!==self)return;void send({type:'raise',to:draft.raiseTo});};
 const winningCards=v.result?.reason==='showdown'?(v.result.winner==='tie'?[...combinationCards([...v.hand,...v.board]),...combinationCards([...(v.opponentHand??[]),...v.board])]:combinationCards([...(v.result.winner===self?v.hand:v.opponentHand??[]),...v.board])):[];
 const winning=(card:Card|undefined)=>!!card&&winningCards.some(c=>c.rank===card.rank&&c.suit===card.suit);
 const result=v.result?{title:v.result.winner==='tie'?(es?'EMPATE':'TIE'):v.result.winner===self?(es?'GANASTE':'YOU WIN'):(es?'GANA ':'WINNER: ')+(v.names[rival]??''),detail:v.result.reason==='fold'?(es?'Retirada · Bote ':'Fold · Pot ')+v.result.pot:(es?'Bote ':'Pot ')+v.result.pot+' · '+(es?categoriesES:categoriesEN)[v.result.ranks?.[v.result.winner==='tie'?self:v.result.winner]?.[0]??0],tone:(v.result.winner==='tie'?'tie':v.result.winner===self?'win':'loss') as 'win'|'tie'|'loss'}:null;
 const handsWidth=Math.min(compact?60:74,(width-52)/4),cardWidth=Math.min(handsWidth,(width-32-24)/5),cardHeight=cardWidth*1.43+10;
 const feltHeight=Math.max(0,panelHeight-48-woodHeight),communityTop=Math.max(opponentHeight+(compact?0:usableHeight<900?15:30)+cardHeight+8,Math.min((opponentHeight-15+feltHeight)/2-cardHeight/2,feltHeight-42-7-cardHeight*2-8));
 const potLeft=Math.min(40,Math.max(12,Math.floor((width-(2*handsWidth+7))/2-76))),potGap=compact?44:58;
 const liveCards=!v.result?combinationCards([...v.hand,...v.board]):[],highlight=(card:Card|undefined)=>!!card&&liveCards.some(c=>c.rank===card.rank&&c.suit===card.suit);
 const rivalAvatar=DOMINO_AVATARS.find(a=>a.id===v.presentation.avatars[rival])??DOMINO_AVATARS[0],rivalPhoto=v.presentation.avatarPhotos[rival];
 return <View testID="online-poker-table" onLayout={e=>setPanelHeight(e.nativeEvent.layout.height)} style={{flex:1,backgroundColor:C.background}}>
  <View style={{height:48,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={onBack} style={{width:44,height:44,justifyContent:'center'}}><Feather name="chevron-left" size={22} color={C.goldLight}/></Pressable><HomeButton es={es}/><View style={{flex:1,alignItems:'center'}}><Text style={{color:C.ivory,fontSize:16,letterSpacing:3,fontWeight:'600'}}>TEXAS HOLD’EM</Text><Text style={{color:C.gold,fontSize:9,letterSpacing:1.5}}>SOCIAL CLUB · NO LIMIT</Text></View><CancelRoomControl es={es} disabled={!connected||busy||!['playing','paused'].includes(v.phase)} onConfirm={async()=>{const ok=await onCommand({type:'leave'});if(ok)onBack();return ok;}}/><Pressable testID="poker-online-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>setSettings(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={20} color={C.gold}/></Pressable></View>
  <View testID="poker-online-felt" style={{flex:1,minHeight:0,overflow:'hidden'}}>
   <DominoTableBackground opponentHeight={opponentHeight} gift={null} es={es} finished={!!v.result}/>
   <View style={{height:opponentHeight,flexDirection:'row-reverse',paddingHorizontal:12,alignItems:'flex-end',gap:6}}><View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:6}}><GameSwitchButton whiteDomino/><GameSwitchButton blackjack/></View><View testID="poker-opponent-identity" style={{flex:1,minWidth:44,height:opponentHeight}}><OpponentDrinkingAvatar opponentId={rivalPhoto?'selfie':rivalAvatar.id} name={v.names[rival]??''} source={rivalPhoto?{uri:rivalPhoto}:rivalAvatar.image} height={opponentHeight} gift={null} invitation={null} es={es}/></View><View style={{width:82,alignSelf:'flex-start',marginTop:14}}><Text style={{color:C.muted,fontSize:9,textAlign:'center'}}>{es?'MANO':'HAND'} {v.round}</Text></View></View>
   <View style={{height:compact?64:95.5,alignItems:'center',justifyContent:'center'}}><View testID="poker-opponent-cards" style={{position:'absolute',top:compact?0:usableHeight<900?15:30,left:'50%',marginLeft:-(2*handsWidth+6)/2,flexDirection:'row',gap:6}}>{[0,1].map(i=><PokerCard key={v.round+':rival:'+i} card={v.opponentHand?.[i]} back={!v.opponentHand} width={handsWidth} animate winning={winning(v.opponentHand?.[i])}/>)}</View></View>
   <View style={{position:'absolute',top:communityTop,left:0,right:0,alignItems:'center'}}><View testID="poker-community-cards" style={{flexDirection:'row',gap:6}}>{[0,1,2,3,4].map(i=><PokerCard key={v.round+':board:'+i} card={v.board[i]} slot width={cardWidth} animate delay={i*60} winning={winning(v.board[i])} combination={highlight(v.board[i])} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'}/>)}</View></View>
   <View pointerEvents="none" style={{position:'absolute',top:(opponentHeight-15+feltHeight)/2-42.5,left:40,right:40,height:85}}><TableStamp title="POKER" engraved/></View>
   <View pointerEvents="none" style={{position:'absolute',bottom:42+14+handsWidth*1.43+10,left:0,right:0}}><PokerHandHint visible={!v.result} text={(es?'Tu mano':'Your hand')+' · '+(v.board.length>=3?(es?categoriesES:categoriesEN)[evaluate([...v.hand,...v.board])[0]]:v.hand[0]?.rank===v.hand[1]?.rank?(es?'Pareja en mano':'Pocket pair'):(es?'Sin pareja':'No pair'))} fontScale={fontScale??1}/></View>
   <View style={{position:'absolute',bottom:42,left:0,right:0,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,paddingVertical:7,minHeight:82}}><View testID="poker-own-cards" style={{flexDirection:'row',gap:7,transform:[{translateY:0}]}}>{v.hand.map((card,i)=><PokerCard key={v.round+':own:'+i} card={card} width={handsWidth} animate winning={winning(card)} combination={highlight(card)} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'}/>)}</View></View>
   <View style={{position:'absolute',left:32,top:opponentHeight+14}}><SeatChipPile amount={v.stacks[rival]} name={v.names[rival]??''} hideName piles={3}/></View>
   <View testID="poker-online-pot-position" style={{position:'absolute',left:potLeft,bottom:potGap,width:70,height:74}}><PokerPot amount={v.pot} es={es}/></View>
   {result?<View style={{position:'absolute',bottom:0,left:12,right:12,minHeight:64,justifyContent:'center'}}><PokerResultBanner result={result} paused={holding||v.phase!=='playing'}/></View>:null}
  </View>
  <View testID="poker-online-wood" onLayout={e=>setWoodHeight(e.nativeEvent.layout.height)} style={{height:woodSize,flexShrink:0,paddingHorizontal:12,paddingTop:4,paddingBottom:4}}>
   <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0,bottom:0}}><WoodSurface/></View>
   {result&&v.phase==='playing'?<ResultHoldButton id="poker-online-hold" presentationKey={resultKey} holding={holding} disabled={!connected} onHold={()=>{setHolding(true);onHold(true);}} onRelease={()=>{setHolding(false);onHold(false);}} es={es}/>:null}
   <View testID="poker-wood-controls" style={{position:'absolute',top:2,left:12,right:12,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}><View style={{position:'absolute',top:-46,left:0,width:80,alignItems:'flex-start'}}><OnlineVoiceControl epoch={v.epoch} seat={self} relay={voice} available={connected&&v.phase==='playing'} es={es} onStatus={setVoiceStatus} opponentName={v.names[rival]??''}/></View></View>
   <View style={{position:'absolute',bottom:2,right:12,zIndex:26}}><Text testID="poker-online-balance" style={{color:C.goldLight,fontSize:13,fontWeight:'700'}}>{'$'+available.toLocaleString()}</Text></View>
   <View testID="poker-online-clock-position" style={{position:'absolute',top:'50%',marginTop:-36,left:'50%',marginLeft:-36,height:72,width:72,alignItems:'center',justifyContent:'center',zIndex:25}}><OnlineTurnTimer size={72} circularOnly avatar={v.presentation.avatarPhotos[self]?{uri:v.presentation.avatarPhotos[self]!}:DOMINO_AVATARS.find(a=>a.id===v.presentation.avatars[self])?.image??DOMINO_AVATARS[0].image} avatarLabel={v.names[self]??''} avatarTestID="poker-local-avatar" attentionKey={v.epoch+':'+v.round+':'+v.street+':'+v.turn+':'+v.currentBet+':'+v.bets[self]} clock={v.turn===self?v.presentation.turnClock:null} enabled={enabled} es={es} onPause={()=>void onCommand({type:'pauseTurnTimer'})} onResume={()=>void onCommand({type:'resumeTurnTimer'})}/><Text testID="poker-local-name" accessibilityLabel={v.names[self]??''} numberOfLines={1} style={{position:'absolute',top:69,left:-8,width:88,maxWidth:88,textAlign:'center',lineHeight:14,color:C.ivory,fontSize:12,fontWeight:'600'}}>{v.names[self]}</Text></View>
   <OnlineAttentionNotice event={v.presentation.attention} localSeat={self} serverNow={v.presentation.turnClock?.serverNow??v.presentation.resultClock?.serverNow??Date.now()} es={es} dismissalKey={v.round+':'+v.turn+':'+v.phase}/>
   {voiceStatus?<Text accessibilityLiveRegion="polite" style={{position:'absolute',bottom:woodHeight+4,left:88,right:88,color:C.ivory,fontSize:12,lineHeight:18,textAlign:'center'}}>{voiceStatus}</Text>:null}
   {v.result&&v.stacks[self]===0?<View style={{position:'absolute',top:-48,right:12,width:156,minHeight:46}}><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Sin fichas':'No chips'}</Text><View style={{flexDirection:'row',justifyContent:'center',gap:6}}>{[500,1000,2000].map(amount=><Button key={amount} disabled={busy||!connected||v.phase!=='playing'} label={String(amount)} onPress={()=>void onCommand({type:'rebuy',amount})}/>)}</View></View>:<View style={{position:'absolute',top:10,left:12,right:12}}><ChipRaiseTray split chipWidth={Math.min(64,(width-120)/4)} value={raiseTo} min={v.legal.minTo} max={v.legal.maxTo} base={v.bets[self]} enabled={enabled&&v.legal.canRaise} es={es} balance={available} onAdd={add} onClear={()=>setSelected([])} onConfirm={confirm}/></View>}
  </View>
  {v.phase==='playing'&&!v.result&&v.turn!==self&&<View testID="poker-wood-attention" style={{position:'absolute',bottom:woodHeight+8,left:12}}><OnlineQuickActions compact es={es} supported enabled={connected&&!busy&&v.phase==='playing'&&!v.result&&v.turn!==self} onSend={kind=>onCommand({type:'attention',kind})}/></View>}
  <FloatingAction id="poker-online-fold" label={es?'RETIRAR':'FOLD'} side="right" color="#A4453D" visible={enabled&&!v.result} enabled={enabled} bottom={woodHeight-2} onPress={()=>void send({type:'fold'})}/>
  <FloatingAction id="poker-online-check-call" label={v.legal.toCall?(es?'IGUALAR ':'CALL ')+v.legal.toCall:(es?'PASAR':'CHECK')} side="right" color="#267B58" visible={enabled&&!v.result} enabled={enabled} bottom={woodHeight+56} onPress={()=>void send({type:v.legal.canCheck?'check':'call'})}/>
  <FloatingAction id="poker-online-all-in" label="ALL-IN" side="left" color="#B18B44" visible={enabled&&!v.result&&v.legal.canRaise} enabled={enabled&&v.legal.canRaise} bottom={woodHeight-2} onPress={()=>void send({type:'raise',to:v.legal.maxTo})}/>
  {selectionTotal>0&&<View style={{position:'absolute',bottom:woodHeight+potGap-36,left:10,width:130,height:36,alignItems:'center'}}><RaiseControls value={raiseTo} min={v.legal.minTo} max={v.legal.maxTo} base={v.currentBet} enabled={enabled&&v.legal.canRaise} es={es} selectionKey={key} onClear={()=>{currentDraft.current.amount=0;setSelected([]);}} onConfirm={confirm}/></View>}
  <TableSettings matching={false} visible={settings} es={es} onClose={()=>setSettings(false)}/>
  <RoomClosedNotice visible={v.phase==='closed'} es={es} reason={v.closeReason} onBack={onBack}/>
 </View>;
}
