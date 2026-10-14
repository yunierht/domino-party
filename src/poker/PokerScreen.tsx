import {PokerHandRankings} from './PokerHandRankings';
import {useTableVisible} from '../components/GameSettingsBoundary';
import {HomeButton} from '../components/HomeButton';
import {PokerOnlineScreen} from './PokerOnlineScreen';
import {useWaitingClock} from '../components/useWaitingClock';
import {OnlineTurnTimer} from '../online/OnlineTurnTimer';
import {usePokerDrink} from './usePokerDrink';
import {DrinkChoices,DrinkInviteButton} from '../computer/DrinkGift';
import {GoldPressable} from '../components/GoldPressable';
import {ModalCloseButton} from '../components/ModalCloseButton';
import {OpponentDrinkingAvatar} from '../computer/OpponentDrinkingAvatar';
import {PokerResultBanner} from './PokerResultBanner';
import {describePokerResult} from './resultPresentation';
import {TableSettings} from '../computer/TableSettings';
import {useBlackjack} from '../blackjack/BlackjackContext';
import {SeatChipPile} from '../blackjack/SeatChipPile';
import {PokerPot} from './PokerPot';
import {ResultHoldButton} from '../components/ResultHoldButton';
import {chipAmounts} from '../blackjack/chipAmounts';
import {BANKROLL_CHIP_SCALE} from '../blackjack/BettingTray';
import {OpponentChoices} from '../computer/OpponentChoices';
import React, {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {useComputerGame} from '../computer/ComputerGameContext';
import {OPPONENTS} from '../computer/opponents';
import {DominoTableBackground} from '../computer/DominoTableBackground';
import {TABLE as C} from '../computer/tableTheme';
import {useI18n} from '../i18n/I18nContext';
import {useNav} from '../nav/NavContext';
import {usePrefs} from '../state/PrefsContext';
import {useTableMusic} from '../sound/useTableMusic';
import {GameSwitchButton,useTableGame} from './TableGameContext';
import {act,combinationCards,evaluate,chooseComputerAction,computerView,legalActions,newHand} from './engine';
import {winningHighlights} from './winningHighlights';
import type {Action} from './engine';
import {WoodSurface,TableStamp} from '../blackjack/TableFinish';
import {ChipStack} from './CasinoChip';
import {CardDealSound} from './CardDealSound';
import {pokerPotBottom} from './tableFit';
import {PokerCard} from './PokerCard';
import {PokerHandHint} from './PokerHandHint';
import {PokerContinuation} from './PokerContinuation';
import {bankruptSeat} from './rebuy';
import {usePokerResultTransition} from './usePokerResultTransition';
import {ChipRaiseTray,SelectedChipPile,RaiseControls} from './ChipRaiseTray';
import {FloatingAction} from '../blackjack/FloatingAction';
import {ChipFlight,type Flight} from '../blackjack/ChipFlight';
import {payoutAwards} from './payoutPresentation';
const labelsES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
const labelsEN=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
function Button({label,onPress,disabled=false,gold=false}:{label:string;onPress:()=>void;disabled?:boolean;gold?:boolean}){return <GoldPressable finish gold={gold} accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:40,flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:4,borderRadius:10,borderWidth:1,borderColor:gold?C.gold:C.line,backgroundColor:gold?'rgba(216,185,120,.86)':'rgba(8,29,27,.42)',opacity:disabled?.4:1}}><Text style={{color:gold?C.background:C.ivory,fontWeight:'700',fontSize:11,textAlign:'center'}}>{label}</Text></GoldPressable>;}
function Chips({amount,label}:{amount:number;label:string}) {return <View style={{alignItems:'center',gap:2}}><Text style={{fontSize:9,color:C.muted,letterSpacing:1}}>{label}</Text><View style={{alignItems:'center',gap:0}}><ChipStack piles amount={amount}/><Text style={{color:C.goldLight,fontSize:18,fontWeight:'700',fontVariant:['tabular-nums']}}>{amount.toLocaleString()}</Text></View></View>;}
export function PokerScreen(){
 const tableVisible=useTableVisible();
 const root=useRef<View>(null),raiseSpot=useRef<View>(null),flightSerial=useRef(0),flightGeneration=useRef(0),ownCards=useRef<View>(null);
 const [selectedChips,setSelectedChips]=useState<number[]>([]);const selectionIndex=useRef(0);const [landed,setLanded]=useState<Set<number>>(new Set());
 const raiseRef=useRef(0),selectionGame=useRef<import('./engine').PokerGame|null>(null);
 const [flights,setFlights]=useState<(Flight&{seat?:'human'|'computer';order?:number;generation?:number})[]>([]);
 const humanBalance=useRef<View>(null),computerBalance=useRef<View>(null),collectedPot=useRef<View>(null),collecting=useRef<import('./engine').PokerGame|null>(null),remaining=useRef(0);
 const completedFlights=useRef(new Set<number>());
 const [progress,setProgress]=useState({human:0,computer:0});
 const {pokerCollected,setPokerCollected,pokerStartingChips,pokerName,poker:g,setPoker,pokerShown:shown,setPokerShown:setShown,switchTarget}=useTableGame();const {game:domino,opponentId,setOpponentId,playerAvatarId,playerAvatarPhoto}=useComputerGame();
 const trackedPot=g?(g.result?.pot??g.total.human+g.total.computer):0;const [potChips,setPotChips]=useState<number[]>(()=>chipAmounts(trackedPot));const potAmount=useRef(trackedPot),potHand=useRef(g?.hand);
 useLayoutEffect(()=>{if(!g)return;const desired=g.result?.pot??g.total.human+g.total.computer;const previous=potAmount.current;const newHand=potHand.current!==g.hand;const selected=selectedChips;setPotChips(current=>{if(newHand||desired<previous)return chipAmounts(desired);const needed=desired-current.reduce((sum,n)=>sum+n,0);if(needed<10)return current;return [...current,...(selected.reduce((sum,n)=>sum+n,0)===desired-previous&&g.last?.player==='human'?selected:chipAmounts(needed))];});potAmount.current=desired;potHand.current=g.hand;},[g]);
 const {lang}=useI18n();const es=lang==='es';const {back,go}=useNav();const {tableMusic,tableMusicTrack,tileSound,ready}=usePrefs();useTableMusic(ready&&tableMusic,tableMusicTrack);
 const window=useWindowDimensions();const insets=useSafeAreaInsets();const compact=window.height-insets.top-insets.bottom<900;
 const [panelHeight,setPanelHeight]=useState(window.height-insets.top-insets.bottom);
 const [handBottom,setHandBottom]=useState(0);
 const usableHeight=window.height-insets.top-insets.bottom;const heroHeight=usableHeight<720?84:Math.min(165,usableHeight*.20);const ownWidth=Math.min(usableHeight<720?60:74,(window.width-52)/4),rivalWidth=ownWidth;

 const [footerHeight,setFooterHeight]=useState(usableHeight<720?94:98);
 const communitySpacing=6,cardWidth=Math.min(ownWidth,(window.width-32-4*communitySpacing)/5);
 const [acceptInvite,setAcceptInvite]=useState(false);const [manualInvite,setManualInvite]=useState(false);const [invite,setInvite]=useState(false);const [drinks,setDrinks]=useState(false);const drinkSelectionLock=useRef(false);
 const [active,setActive]=useState(AppState.currentState==='active');const [picker,setPicker]=useState(false);const [settings,setSettings]=useState(false);const [rules,setRules]=useState(false);const [reset,setReset]=useState(false);const [raise,setRaise]=useState('40');const [error,setError]=useState('');
 const presentation=g?`${g.hand}-${g.board.length}`:'';const dealing=shown!==presentation;
 const paused=!tableVisible||!!switchTarget||picker||rules||settings||reset||drinks||invite||manualInvite||acceptInvite||!active;const [holding,setHolding]=useState(false);const resultHold=useRef(false);const deferredCollections=useRef(new Set<number>());
 useEffect(()=>{resultHold.current=false;setHolding(false);deferredCollections.current.clear();},[g?.hand]);
 useEffect(()=>{if(paused){resultHold.current=false;setHolding(false);}},[paused]);
 const mounted=useRef(true),currentGame=useRef(g);currentGame.current=g;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;resultHold.current=false;flightGeneration.current++;};},[]);
 const showResult=usePokerResultTransition(g,paused||dealing,pokerCollected===g,next=>{setShown('');setPoker(current=>current===g&&!resultHold.current?next:current);},holding,resultHold);
 const {name:blackjackName}=useBlackjack();
 const opponent=OPPONENTS.find(o=>o.id===opponentId)??OPPONENTS[0];const name=pokerName||blackjackName||domino?.playerName||(es?'Tú':'You');
 const drink=usePokerDrink(opponentId,g?.result??null,!paused);
 const waitingForHuman=!!g&&!g.result&&g.turn==='human'&&g.stacks.human>0&&!paused&&!dealing&&!holding;
 const waitingClock=useWaitingClock(g,'poker-turn',waitingForHuman,identity=>{setPoker(current=>{if(current!==identity||current.result||current.turn!=='human')return current;const legal=legalActions(current,'human');return act(current,'human',{type:legal.canCheck?'check':'fold'});});});
 useEffect(()=>{if(!g)setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:5000}));},[g,setPoker]);
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));const nav=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});return()=>{sub.remove();nav.remove();};},[back]);
 useEffect(()=>{if(!presentation||paused)return;const timer=setTimeout(()=>setShown(presentation),700);return()=>clearTimeout(timer);},[presentation,paused]);
 useEffect(()=>{if(!g||g.result||g.turn!=='computer'||paused||dealing)return;const timer=setTimeout(()=>setPoker(current=>current===g?act(g,'computer',chooseComputerAction(computerView(g))):current),950);return()=>clearTimeout(timer);},[g,paused,dealing,setPoker]);
 useEffect(()=>{if(g){raiseRef.current=g.bets.human;setRaise(String(g.bets.human));setSelectedChips([]);selectionIndex.current=0;setLanded(new Set());setError('');flightGeneration.current++;setFlights([]);}},[g]);
 useEffect(()=>{
  if(!g?.result){collecting.current=null;setProgress({human:0,computer:0});return;}
  if(paused||holding||resultHold.current||dealing||pokerCollected===g||collecting.current===g)return;
  collecting.current=g;const awards=payoutAwards(g);const seats=(['human','computer'] as const).filter(s=>awards[s]>0);remaining.current=seats.length;
  for(const seat of seats){const destination=seat==='human'?humanBalance:computerBalance;
   const add=(rx:number,ry:number,sx:number,sy:number,tx:number,ty:number)=>{if(!mounted.current||currentGame.current!==g)return;setFlights(items=>[...items,{id:++flightSerial.current,kind:'win',seat,amount:awards[seat],from:{x:sx-rx,y:sy-ry},to:{x:tx-rx,y:ty-ry}}]);};
   if(root.current&&raiseSpot.current&&destination.current)root.current.measureInWindow((rx,ry)=>raiseSpot.current?.measureInWindow((sx,sy,sw,sh)=>destination.current?.measureInWindow((tx,ty,tw,th)=>add(rx,ry,sx+sw/2,sy+sh/2,tx+tw/2,ty+th/2))));
   else add(0,0,window.width/2,window.height/2,seat==='human'?window.width/2:90,seat==='human'?window.height-footerHeight+12:120);
  }
 },[g,paused,dealing,pokerCollected,holding]);

 if(!g)return <View style={{flex:1,backgroundColor:C.background}}/>;
 const finishCollection=(f:typeof flights[number])=>{if(!mounted.current||currentGame.current!==g||completedFlights.current.has(f.id))return;if(f.seat&&resultHold.current){deferredCollections.current.add(f.id);return;}completedFlights.current.add(f.id);if(f.kind==='bet'){if(f.generation!==flightGeneration.current)return;const order=f.order;if(order!==undefined)setLanded(previous=>new Set(previous).add(order));}setFlights(items=>items.filter(x=>x.id!==f.id));if(f.seat){setProgress(current=>({...current,[f.seat!]:1}));remaining.current--;if(remaining.current===0)setPokerCollected(g);}};
 const releaseHold=()=>{resultHold.current=false;setHolding(false);const ids=[...deferredCollections.current];deferredCollections.current.clear();for(const id of ids){const flight=flights.find(f=>f.id===id);if(flight)finishCollection(flight);}};
 const beginHold=()=>{if(!g.result||paused||dealing||!showResult||currentGame.current!==g)return;resultHold.current=true;setHolding(true);};

 const legal=legalActions(g,'human');const enabled=legal.enabled&&!paused&&!dealing;const pot=g.total.human+g.total.computer;
 const send=(action:Action)=>{if(!enabled)return;try{setPoker(current=>current===g?act(g,'human',action):current);setError('');flightGeneration.current++;setFlights([]);}catch{setError(es?'Revisa el importe de la apuesta.':'Check the bet amount.');}};
 const addChip=(n:number,source:React.RefObject<View|null>)=>{
  if(!enabled||!legal.canRaise||![10,20,50,100].includes(n))return;
  const next=raiseRef.current+n;if(next>legal.maxTo)return;
  raiseRef.current=next;selectionGame.current=g;setRaise(String(next));setSelectedChips(items=>[...items,n]);
  const token=flightGeneration.current;const order=selectionIndex.current++;
  const add=(rx:number,ry:number,sx:number,sy:number,tx:number,ty:number,tw:number,th:number)=>{if(token!==flightGeneration.current||currentGame.current!==g)return;setFlights(items=>[...items,{id:++flightSerial.current,amount:n,kind:'bet',order,generation:token,holdUntilLanding:true,landingScale:BANKROLL_CHIP_SCALE,facingPlayer:true,from:{x:sx-rx,y:sy-ry},to:{x:tx+tw/2-rx,y:ty+th-14-(potChips.length+order)*Math.min(2,8/Math.max(1,potChips.length+selectionIndex.current-1))-21*BANKROLL_CHIP_SCALE-ry}}]);};
  if(root.current&&source.current&&raiseSpot.current)root.current.measureInWindow((rx,ry)=>source.current?.measureInWindow((sx,sy,sw,sh)=>raiseSpot.current?.measureInWindow((tx,ty,tw,th)=>add(rx,ry,sx+sw/2,sy+sh/2,tx,ty,tw,th))));
  else add(0,0,window.width/2,panelHeight-footerHeight+34,potLeft,panelHeight-potBottom-74,70,74);
 };
 const raiseValue=Number(raise);const validRaise=Number.isInteger(raiseValue)&&raiseValue<=legal.maxTo&&raiseValue>g.currentBet&&(raiseValue>=legal.minTo||raiseValue===legal.maxTo);
 const result=g.result;
 const awards=payoutAwards(g);const collectingPending=!!result&&pokerCollected!==g;
 const provisional=!result&&g.turn==='human'&&selectedChips.length&&selectionGame.current===g?Math.max(0,raiseValue-g.bets.human):0;
 const displayBalance=(seat:'human'|'computer')=>Math.round(g.stacks[seat]-(seat==='human'?provisional:0)-(collectingPending?awards[seat]*(1-progress[seat]):0));
 const feltHeight=Math.max(0,panelHeight-48-footerHeight),cardHeight=cardWidth*1.43+10;
 const communityTop=Math.max(heroHeight+(usableHeight<720?0:usableHeight<900?15:30)+cardHeight+8,Math.min((heroHeight-15+feltHeight)/2-cardHeight/2,feltHeight-42-7-cardHeight*2-8));
 const potLeft=Math.min(40,Math.max(12,Math.floor((window.width-(2*ownWidth+7))/2-76)));
 const potBottom=pokerPotBottom(panelHeight,footerHeight,handBottom,window.width<300,usableHeight<720);
 const visiblePot=result?(pokerCollected===g||collecting.current===g?0:result.pot):pot;
 const winners=result?.reason==='showdown'&&!dealing?(result.winner==='tie'?['human','computer'] as const:[result.winner]):[];
 const winningCards=new Set(!dealing?winningHighlights(g).map(c=>`${c.rank}${c.suit}`):[]);
 const marked=(card:typeof g.board[number]|undefined)=>!!card&&winningCards.has(`${card.rank}${card.suit}`);
 const liveCards=new Set(!result&&!dealing?combinationCards([...g.holes.human,...g.board]).map(c=>`${c.rank}${c.suit}`):[]);
 const liveMarked=(card:typeof g.board[number]|undefined)=>!!card&&liveCards.has(`${card.rank}${card.suit}`);
 const currentCategory=g.board.length>=3?(es?labelsES:labelsEN)[evaluate([...g.holes.human,...g.board])[0]]:g.holes.human[0].rank===g.holes.human[1].rank?(es?'Pareja en mano':'Pocket pair'):(es?'Sin pareja':'No pair');
 const stage=({preflop:'PRE-FLOP',flop:'FLOP',turn:'TURN',river:'RIVER',complete:es?'MANO COMPLETA':'HAND COMPLETE'})[g.street];
 const actionText=g.last?({fold:es?'Se retira':'Folds',check:es?'Pasa':'Checks',call:es?'Iguala':'Calls',raise:es?'Sube':'Raises'})[g.last.action.type]+(g.last.action.type==='raise'?` · ${g.last.action.to}`:''):'';
 return <View ref={root} collapsable={false} onLayout={e=>setPanelHeight(e.nativeEvent.layout.height)} style={{flex:1,minHeight:0,backgroundColor:C.background,overflow:'hidden'}}>
 <View style={{height:48,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:C.line,paddingHorizontal:6}}>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={20} color={C.ivory}/></Pressable><HomeButton es={es}/>
 <View style={{flex:1,alignItems:'center'}}><Text style={{color:C.ivory,fontSize:16,letterSpacing:3,fontWeight:'600'}}>TEXAS HOLD’EM</Text><Text style={{color:C.gold,fontSize:9,letterSpacing:1.5}}>SOCIAL CLUB · NO LIMIT</Text></View>
 <Pressable testID="poker-table-invite" accessibilityRole="button" accessibilityLabel={es?'Invitar amigo':'Invite a friend'} onPress={()=>setInvite(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="share-2" size={19} color={C.gold}/></Pressable>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>setSettings(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={20} color={C.gold}/></Pressable></View>
 <View testID="poker-table-surface" style={{flex:1,minHeight:0,overflow:'hidden'}}>
 <View testID="poker-table-background" pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0}}><DominoTableBackground opponentHeight={heroHeight} gift={drink.consuming?null:drink.gift} es={es} finished={drink.expiring}/></View>
 <View pointerEvents="none" style={{position:'absolute',top:(heroHeight-15+usableHeight-48-94)/2-42.5,left:40,right:40,height:85}}><TableStamp title="POKER" engraved/></View>
 <View testID="poker-fixed-table-content" style={{flex:1,minHeight:0}}>
 <View testID="poker-hero" style={{height:heroHeight,flexDirection:'row-reverse',paddingHorizontal:12,alignItems:'flex-end',gap:6}}>
 <View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:6}}><GameSwitchButton whiteDomino/><GameSwitchButton blackjack/></View>
 <Pressable testID="poker-opponent-avatar" accessibilityRole="button" accessibilityLabel={es?`Cambiar rival: ${opponent.name}`:`Change opponent: ${opponent.name}`} onPress={()=>setPicker(true)} style={{flex:1,minWidth:44,height:heroHeight}}><OpponentDrinkingAvatar opponentId={opponentId} name={opponent.name} gift={drink.consuming} invitation={drink.gift} source={opponent.image} height={heroHeight} es={es}/></Pressable>


 <View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:4}}><Text style={{color:C.muted,fontSize:9,textAlign:'center'}}>{es?'MANO':'HAND'} {g.hand}</Text><DrinkInviteButton es={es} compact={usableHeight<720} active={!paused&&!g.result} onPress={()=>{drinkSelectionLock.current=false;setDrinks(true);}}/></View>
 </View>
 <View testID="poker-rival-lane" style={{height:usableHeight<720?64:95.5,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingVertical:7,minHeight:usableHeight<720?64:82,marginRight:0}}>

 <View testID="poker-rival-cards" style={{position:'absolute',top:usableHeight<720?0:usableHeight<900?15:30,left:'50%',marginLeft:-(2*rivalWidth+6)/2,flexDirection:'row',gap:6}}>{g.holes.computer.map((card,i)=><View key={`${g.hand}-computer-${i}`}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&g.board.length===0} winning={winners.includes('computer')&&marked(card)} card={result?.reason==='showdown'?card:undefined} back={result?.reason!=='showdown'} width={rivalWidth} originX={80} delay={i*280}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&g.board.length===0} delay={i*280}/></View>)}</View>
 <Text style={{position:'absolute',right:18,color:C.goldLight,fontSize:10}}>{g.dealer==='computer'?'Ⓓ · SB':'BB'}{g.bets.computer?` · ${g.bets.computer}`:''}</Text></View>
 <View style={{position:'absolute',top:communityTop,left:0,right:0,alignItems:'center',justifyContent:'center'}}>
 <View testID="poker-community-cards" style={{flexDirection:'row',gap:0}}>{Array.from({length:5},(_,i)=>{
 const fresh=!!g.board[i]&&(g.board.length===3||i===g.board.length-1);
 const delay=g.board.length===3?i*140:0;
 return <View key={`${g.hand}-${i}`} style={{marginLeft:i?communitySpacing:0}}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&fresh} card={g.board[i]} slot winning={marked(g.board[i])} combination={liveMarked(g.board[i])} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'} width={cardWidth} originX={80} delay={delay}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&fresh} delay={delay}/></View>;
 })}</View>



 </View>

 <View pointerEvents="none" style={{position:'absolute',bottom:42+14+ownWidth*1.43+10,left:0,right:0}}><PokerHandHint visible={!result&&!dealing} text={`${es?'Tu mano':'Your hand'} · ${currentCategory}`} fontScale={window.fontScale}/></View>
 <View style={{position:'absolute',bottom:42,left:0,right:0,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,paddingVertical:7,minHeight:82}}><View ref={ownCards} collapsable={false} testID="poker-own-cards" onLayout={()=>{root.current?.measureInWindow((_rx,ry)=>ownCards.current?.measureInWindow((_x,y,_w,h)=>setHandBottom(y+h-ry)));}} style={{flexDirection:'row',gap:7,transform:[{translateY:0}]}}>{g.holes.human.map((card,i)=><View key={`${g.hand}-human-${i}`}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&g.board.length===0} winning={winners.includes('human')&&marked(card)} combination={liveMarked(card)} combinationLabel={es?'Carta de tu combinación actual':'Card in your current combination'} card={card} width={ownWidth} originX={80} delay={140+i*280}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&g.board.length===0} delay={140+i*280}/></View>)}</View><Text testID="poker-human-blind-label" style={{position:'absolute',right:18,color:C.goldLight,fontSize:11,transform:[{translateY:-20}]}}>{g.dealer==='human'?'Ⓓ · SB':'BB'}{g.bets.human?` · ${g.bets.human}`:''}</Text></View>


 </View>

 <View ref={computerBalance} collapsable={false} style={{position:'absolute',left:32,top:heroHeight+14,zIndex:12}}><SeatChipPile testID="poker-computer-pile" amount={displayBalance('computer')} name={opponent.name} hideName piles={3}/></View>
 <View testID="poker-message-overlay" pointerEvents={showResult?"box-none":"none"} style={{position:'absolute',left:0,right:0,bottom:0,zIndex:16,minHeight:64,paddingVertical:1,paddingLeft:12,paddingRight:12,justifyContent:'center'}}>
 {showResult&&!dealing?<View testID="poker-result-footer" pointerEvents="none" style={{width:'100%'}}><PokerResultBanner key={g.hand} result={describePokerResult(g,es,opponent.name)} paused={paused||holding}/></View>:null}
 <ResultHoldButton visible={showResult&&!dealing} presentationKey={g.result?g:null} id="poker-result-hold" holding={holding} disabled={paused} onHold={beginHold} onRelease={releaseHold} es={es}/>
 <View style={{alignItems:'center',paddingHorizontal:enabled?106:0}}>{error&&!result?<Text accessibilityLiveRegion='polite' style={{color:'#F0A899',fontSize:11,textAlign:'center'}}>{error}</Text>:null}</View>
 </View>
 </View>
  <View testID='poker-selected-raise' style={{position:'absolute',left:10,bottom:potBottom-36,width:130,height:36,alignItems:'center',justifyContent:'center',zIndex:12}}>{enabled&&raiseValue>g.bets.human&&selectionGame.current===g?<><RaiseControls selectionKey={`${g.hand}-${g.street}-${g.turn}-${selectedChips.length}`} value={raiseValue} min={legal.minTo} max={legal.maxTo} base={g.currentBet} enabled={enabled&&legal.canRaise} es={es} onClear={()=>{raiseRef.current=g.bets.human;setRaise(String(g.bets.human));setSelectedChips([]);selectionIndex.current=0;setLanded(new Set());flightGeneration.current++;setFlights([]);}} onConfirm={()=>{if(validRaise)send({type:'raise',to:raiseValue});}}/></>:null}</View>
 <View ref={raiseSpot} collapsable={false} testID="poker-pot-spot" style={{position:'absolute',left:potLeft,bottom:potBottom,width:70,height:74,zIndex:12}}><View ref={collectedPot} collapsable={false}><PokerPot testID="poker-pot-pile" es={es} amount={result?visiblePot:visiblePot+provisional} capacity={potChips.length+(provisional?selectedChips.length:0)} layers={[...potChips.map((_n,i)=>i),...(provisional?selectedChips.map((_n,i)=>i).filter(i=>landed.has(i)).map(i=>potChips.length+i):[])]} chips={visiblePot||provisional?[...potChips,...(provisional?selectedChips.filter((_n,i)=>landed.has(i)):[])]:[]}/></View></View>
 <View onLayout={e=>setFooterHeight(e.nativeEvent.layout.height)} testID="poker-cpu-wood" style={{backgroundColor:'#704329',height:usableHeight<720?94:98,paddingHorizontal:12,paddingTop:4,paddingBottom:4}}><View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0}}><WoodSurface/></View>

 <View ref={humanBalance} collapsable={false} testID="poker-player-balance" style={{position:'absolute',bottom:2,right:12,zIndex:26}}><Text style={{color:C.goldLight,fontSize:13,fontWeight:'700'}}>{'$'+displayBalance('human').toLocaleString()}</Text></View>
 <View testID="poker-player-chip-position" style={{position:'absolute',top:10,left:12,right:12}}><ChipRaiseTray split chipWidth={Math.min(64,(window.width-120)/4)} balance={displayBalance('human')} value={raiseValue} min={legal.minTo} max={legal.maxTo} base={g.currentBet} enabled={enabled&&legal.canRaise} es={es} onAdd={addChip} onClear={()=>{raiseRef.current=g.bets.human;setRaise(String(g.bets.human));setSelectedChips([]);selectionIndex.current=0;setLanded(new Set());flightGeneration.current++;setFlights([]);}} onConfirm={()=>{if(validRaise)send({type:'raise',to:raiseValue});}}/></View>
 <View testID="poker-cpu-clock" style={{position:'absolute',top:'50%',marginTop:-36,left:'50%',marginLeft:-36,height:72,width:72,alignItems:'center',justifyContent:'center',zIndex:25}}><OnlineTurnTimer size={72} circularOnly avatar={playerAvatarId==='selfie'&&playerAvatarPhoto?{uri:playerAvatarPhoto}:DOMINO_AVATARS.find(a=>a.id===playerAvatarId)?.image??DOMINO_AVATARS[0].image} avatarLabel={name} avatarTestID="table-player-avatar" attentionKey={`poker-cpu:${waitingClock.generation}`} clock={g.turn==='human'&&!g.result?waitingClock.clock:null} enabled={waitingForHuman} es={es} onPause={waitingClock.pause} onResume={waitingClock.resume}/><Text testID="table-player-name" accessibilityLabel={name} numberOfLines={1} style={{position:'absolute',top:69,left:-8,width:88,maxWidth:88,textAlign:'center',lineHeight:14,color:C.ivory,fontSize:12,fontWeight:'600'}}>{name}</Text></View>
 {result&&!showResult&&bankruptSeat(g)?<View testID='poker-bankrupt-continuation' style={{position:'absolute',top:-48,right:12,width:156,minHeight:46}}><PokerContinuation game={g} es={es} blocked={dealing||paused||collectingPending} names={{human:name,computer:opponent.name}} onContinue={next=>{setShown('');setPoker(current=>current===g?next:current);}}/></View>:null}


 </View>

 {flights.map(f=><ChipFlight key={f.id} flight={f} sound={ready&&tileSound} paused={paused||holding} onProgress={f.seat?p=>{if(resultHold.current)return;setProgress(current=>({...current,[f.seat!]:p}));}:undefined} onComplete={()=>finishCollection(f)}/>)}
 <FloatingAction id='poker-fold' color='#A4453D' label={es?'RETIRAR':'FOLD'} side='right' visible={enabled&&!result} enabled={enabled&&!result} onPress={()=>send({type:'fold'})} bottom={footerHeight-2}/>
 <FloatingAction id='poker-check-call' color='#267B58' label={legal.toCall?`${es?'IGUALAR':'CALL'} ${legal.toCall}`:(es?'PASAR':'CHECK')} side='right' visible={enabled&&!result} enabled={enabled&&!result} onPress={()=>send({type:legal.toCall?'call':'check'})} bottom={footerHeight+56}/>
 <FloatingAction id='poker-all-in' color='#B18B44' label='ALL-IN' side='left' visible={enabled&&!result&&legal.canRaise} enabled={enabled&&!result&&legal.canRaise} onPress={()=>send({type:'raise',to:legal.maxTo})} bottom={footerHeight-2}/>
 <Modal visible={picker||rules||reset||drinks} transparent animationType="fade" onRequestClose={()=>{setPicker(false);setRules(false);setReset(false);setDrinks(false);}}><View style={{flex:1,justifyContent:'center',padding:rules?16:22,backgroundColor:'rgba(2,12,10,.86)'}}><View accessibilityViewIsModal style={{maxHeight:'85%',backgroundColor:C.surface,borderRadius:24,padding:rules?16:22,paddingTop:60,gap:16,borderWidth:1,borderColor:C.line}}><Text style={{color:C.goldLight,fontSize:23,fontWeight:'600'}}>{drinks?(es?'Invitar bebida':'Buy me a drink'):picker?(es?'Elige tu rival':'Choose your opponent'):reset?(es?'¿Reiniciar póker?':'Restart poker?'):'Texas Hold’em'}</Text>
 {rules?<Pressable accessibilityRole="button" onPress={()=>{setRules(false);setReset(true);}}><Text style={{color:C.gold}}>{es?'Reiniciar póker':'Restart poker'}</Text></Pressable>:null}
 <ScrollView>{drinks?<DrinkChoices es={es} choose={id=>{if(drinkSelectionLock.current)return;drinkSelectionLock.current=true;drink.invite(id);setDrinks(false);}}/>:picker?<OpponentChoices selected={opponentId} onSelect={id=>{setOpponentId(id);setPicker(false);}}/>:<Text style={{color:C.ivory,fontSize:15,lineHeight:24}}>{reset?(es?`Se reemplazará solo la partida de póker y recibirás ${pokerStartingChips} fichas virtuales y el rival 5,000.`:`Only your poker game will reset. You receive ${pokerStartingChips} virtual chips and your opponent 5,000.`):(es?`Dos cartas privadas y cinco comunitarias. Gana la mejor combinación de cinco cartas.

Ciegas: 10 / 20. El botón paga la ciega pequeña y actúa primero antes del flop; después actúa primero el rival. Puedes pasar, igualar, retirarte o subir hasta todas tus fichas.

Flop: tres cartas. Turn y river: una más cada uno. En all-in se completa la mesa y se comparan las manos. El importe de subida es el total de esta calle.`:`Two private cards and five community cards. The best five-card hand wins.

Blinds: 10 / 20. The button posts the small blind and acts first before the flop; the other player acts first afterward. Check, call, fold or raise up to your full stack.

Flop: three cards. Turn and river: one each. An all-in runs out the board and compares hands. Raise amounts are the total bet for this street.`)}</Text>}{rules&&<PokerHandRankings es={es}/>}</ScrollView>
 <ModalCloseButton finish es={es} onPress={()=>{setPicker(false);setRules(false);setReset(false);setDrinks(false);}}/>
 <View style={{flexDirection:'row',gap:10}}>{reset?<Button gold label={es?'Reiniciar':'Restart'} onPress={()=>{setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:5000}));setShown('');setReset(false);}}/>:null}</View>
 </View></View></Modal>
 <TableSettings onAcceptInvitation={()=>{setSettings(false);setAcceptInvite(true);}} onInvite={()=>{setSettings(false);setManualInvite(true);}} matching={false} visible={settings} es={es} onClose={()=>setSettings(false)} onRules={()=>{setSettings(false);setRules(true);}}/>
 <>{(invite||manualInvite||acceptInvite)&&<Modal visible onRequestClose={()=>{setInvite(false);setManualInvite(false);setAcceptInvite(false);}}><PokerOnlineScreen inviteOnly={invite} manualOnly={manualInvite} onClose={()=>{setInvite(false);setManualInvite(false);setAcceptInvite(false);}}/></Modal>}</>
 </View>;
}
