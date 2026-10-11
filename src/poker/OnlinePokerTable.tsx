import {HomeButton} from '../components/HomeButton';
import {TableSettings} from '../computer/TableSettings';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Image,Text,View,Pressable,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {TABLE as C} from '../computer/tableTheme';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {DominoTableBackground} from '../computer/DominoTableBackground';
import {GoldPressable} from '../components/GoldPressable';
import {ResultHoldButton} from '../components/ResultHoldButton';
import {OnlineTurnTimer} from '../online/OnlineTurnTimer';
import {OnlineVoiceControl} from '../online/OnlineVoiceControl';
import type {VoiceRelay} from '../online/OnlineVoiceControl';
import {OnlineQuickActions,OnlineAttentionNotice} from '../online/OnlineQuickActions';
import {PokerCard} from './PokerCard';
import {PokerPot} from './PokerPot';
import {ChipRaiseTray,RaiseControls,SelectedChipPile} from './ChipRaiseTray';
import {SeatChipPile} from '../blackjack/SeatChipPile';
import {WoodSurface,TableStamp} from '../blackjack/TableFinish';
import {combinationCards} from './engine';
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
 const {height,width}=useWindowDimensions(),compact=height<740,self=v.seat,rival:Seat=self==='human'?'computer':'human';
 const [settings,setSettings]=useState(false);
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
 const cardWidth=Math.min(compact?43:56,(width-54)/5),handsWidth=compact?41:52;
 return <View testID="online-poker-table" style={{flex:1,backgroundColor:C.background}}>
  <View style={{height:44,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={onBack} style={{width:44,height:44,justifyContent:'center'}}><Feather name="chevron-left" size={22} color={C.goldLight}/></Pressable><HomeButton es={es} color={C.gold}/><Text style={{flex:1,textAlign:'center',color:C.goldLight,fontSize:14,fontWeight:'700'}}>POKER ONLINE</Text>{onShare&&<Pressable testID="poker-online-table-share" accessibilityRole="button" accessibilityLabel={es?'Compartir invitación':'Share invitation'} onPress={onShare} style={{width:44,height:44,justifyContent:'center',alignItems:'center'}}><Feather name="share-2" size={19} color={C.gold}/></Pressable>}<Pressable testID="poker-online-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>setSettings(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={20} color={C.gold}/></Pressable></View>
  <View style={{flex:1,paddingHorizontal:12}}>
   <DominoTableBackground opponentHeight={compact?105:140} gift={null} es={es} finished={!!v.result}/>
   <View style={{flex:.34,minHeight:compact?156:184,alignItems:'center',justifyContent:'center',gap:3}}>
    <View style={{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}><View style={{width:80,alignItems:'center'}}><SeatChipPile amount={v.stacks[rival]} name={v.names[rival]??''} hideName totalAbove chipScale={.6} piles={3}/></View><View style={{flex:1,alignItems:'center'}}><Avatar view={v} seat={rival} width={compact?84:118}/></View><View style={{width:80}}/></View>
    <View testID="poker-opponent-cards" style={{flexDirection:'row',gap:6}}>{[0,1].map(i=><PokerCard key={`${v.round}:rival:${i}`} card={v.opponentHand?.[i]} back={!v.opponentHand} width={handsWidth} animate winning={winning(v.opponentHand?.[i])}/>)}</View>
   </View>
   <View style={{flex:.34,minHeight:compact?94:112,justifyContent:'center',alignItems:'center',gap:5}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{color:C.muted,fontSize:11}}>{es?'Mano':'Hand'} {v.round} · {v.street==='complete'?(es?'Resultado':'Result'):v.street}</Text><Text style={{color:C.gold,fontSize:11}}>{es?'Apuesta':'Bet'} {v.bets[self]} / {v.bets[rival]}</Text></View>
    <View testID="poker-community-cards" style={{flexDirection:'row',gap:5}}>{[0,1,2,3,4].map(i=><PokerCard key={`${v.round}:board:${i}`} card={v.board[i]} slot width={cardWidth} animate delay={i*60} winning={winning(v.board[i])}/>)}</View>
   </View>
   <View style={{flex:.32,minHeight:compact?88:92,alignItems:'center',justifyContent:'center',gap:3}}>
    {result?<PokerResultBanner result={result} paused={holding||v.phase!=='playing'}/>:<View pointerEvents="none" style={{position:'absolute',width:200,opacity:.5}}><TableStamp title="POKER"/></View>}
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}><View testID="poker-own-cards" style={{flexDirection:'row',gap:6,transform:[{translateY:compact?6:8}]}}>{v.hand.map((card,i)=><PokerCard key={`${v.round}:own:${i}`} card={card} width={handsWidth} animate winning={winning(card)}/>)}</View><PokerPot amount={v.pot} es={es}/></View>
   </View>
  </View>
  <View testID="poker-online-wood" style={{minHeight:258,flexShrink:0,paddingHorizontal:12,paddingTop:4,paddingBottom:4,gap:4}}>
   <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0,bottom:0}}><WoodSurface/></View>
   {result&&v.phase==='playing'?<ResultHoldButton id="poker-online-hold" presentationKey={resultKey} holding={holding} disabled={!connected} onHold={()=>{setHolding(true);onHold(true);}} onRelease={()=>{setHolding(false);onHold(false);}} es={es}/>:null}
   <View testID="poker-wood-controls" style={{flexDirection:'row',alignItems:'center',gap:4,minHeight:60}}>
    <View style={{width:80,alignItems:'flex-start'}}><OnlineVoiceControl epoch={v.epoch} seat={self} relay={voice} available={connected&&v.phase==='playing'} es={es} onStatus={setVoiceStatus} opponentName={v.names[rival]??''}/></View>
    <View style={{flex:1,minWidth:0,alignItems:'center'}}><Avatar view={v} seat={self} width={44} own/></View><View style={{width:80,alignItems:'flex-end'}}></View>
   </View>
   <View testID="poker-online-clock-position" style={{position:'absolute',top:4,bottom:4,right:12,width:80,alignItems:'flex-end',justifyContent:'center'}}><OnlineTurnTimer circularOnly attentionKey={`poker:${v.epoch}:${v.round}:${v.street}:${v.turn}:${v.currentBet}:${v.bets[self]}`} clock={v.presentation.turnClock} enabled={enabled} es={es} onPause={()=>void onCommand({type:'pauseTurnTimer'})} onResume={()=>void onCommand({type:'resumeTurnTimer'})}/></View>
   <View testID="poker-wood-attention" style={{height:44,alignItems:'flex-end',paddingRight:68}}><View style={{display:v.phase==='playing'&&!v.result&&v.turn!==self?'flex':'none'}}><OnlineQuickActions compact es={es} supported enabled={connected&&!busy&&v.phase==='playing'&&!v.result&&v.turn!==self} onSend={kind=>onCommand({type:'attention',kind})}/></View></View>
   <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8}}><Text testID="poker-online-balance" style={{color:C.goldLight,fontSize:14,fontWeight:'700'}}>{available.toLocaleString()}</Text><Text accessibilityLiveRegion="polite" style={{color:voiceStatus?C.goldLight:C.ivory,fontSize:10,lineHeight:12,textAlign:'center',flexShrink:1}}>{voiceStatus??(v.phase==='paused'?(es?'Esperando reconexión · 2 min':'Waiting for reconnection · 2 min'):v.phase==='closed'?(es?'Sala cerrada sin ganador':'Room closed without winner'):v.result?(es?'Resultado':'Result'):v.turn===self?(es?'Tu turno':'Your turn'):(v.names[rival]??''))}</Text></View>
   <OnlineAttentionNotice event={v.presentation.attention} localSeat={self} serverNow={v.presentation.turnClock?.serverNow??v.presentation.resultClock?.serverNow??Date.now()} es={es} dismissalKey={`${v.round}:${v.turn}:${v.phase}`}/>
   {v.phase==='closed'?<Text style={{color:C.ivory,textAlign:'center'}}>{es?'Sal de la mesa para crear otra invitación.':'Leave the table to create another invitation.'}</Text>:v.result&&v.stacks[self]===0?<View style={{gap:5}}><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Sin fichas · Reponer fichas virtuales':'No chips · Refill virtual chips'}</Text><View style={{flexDirection:'row',justifyContent:'center',gap:6}}>{[500,1000,2000].map(amount=><Button key={amount} disabled={busy||!connected||v.phase!=='playing'} label={String(amount)} onPress={()=>void onCommand({type:'rebuy',amount})}/>)}</View></View>:<>
    <View style={{paddingRight:80}}><ChipRaiseTray value={raiseTo} min={v.legal.minTo} max={v.legal.maxTo} base={v.bets[self]} enabled={enabled&&v.legal.canRaise} es={es} balance={available} onAdd={add} onClear={()=>setSelected([])} onConfirm={confirm}/></View>
    <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:5}}>
     {selectionTotal>0?<><SelectedChipPile chips={selected}/><RaiseControls value={raiseTo} min={v.legal.minTo} max={v.legal.maxTo} base={v.currentBet} enabled={enabled&&v.legal.canRaise} es={es} selectionKey={key} onClear={()=>{currentDraft.current.amount=0;setSelected([]);}} onConfirm={confirm}/></>:<>
      <Button id="poker-online-fold" label="Fold" disabled={!enabled} onPress={()=>void send({type:'fold'})}/>
      <Button id="poker-online-check-call" label={v.legal.toCall?`Call ${v.legal.toCall}`:'Check'} disabled={!enabled} onPress={()=>void send({type:v.legal.canCheck?'check':'call'})}/>
      <Button id="poker-online-all-in" label="All-in" disabled={!enabled||!v.legal.canRaise} onPress={()=>void send({type:'raise',to:v.legal.maxTo})}/>
     </>}
    </View>
   </>}
  </View>
 <TableSettings onInvite={onInviteCode?()=>{setSettings(false);onInviteCode();}:undefined} matching={false} visible={settings} es={es} onClose={()=>setSettings(false)}/>
 </View>;
}
