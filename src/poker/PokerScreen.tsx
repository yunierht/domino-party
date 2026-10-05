import {OpponentDrinkingAvatar} from '../computer/OpponentDrinkingAvatar';
import {PokerTurnPrompt} from './PokerTurnPrompt';
import {PokerResultBanner} from './PokerResultBanner';
import {describePokerResult} from './resultPresentation';
import {TableSettings} from '../computer/TableSettings';
import {useBlackjack} from '../blackjack/BlackjackContext';
import {SeatChipPile} from '../blackjack/SeatChipPile';
import {OpponentChoices} from '../computer/OpponentChoices';
import React, {useEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
import {communityCardWidth,pokerBoardZoneHeight} from './tableFit';
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
function Button({label,onPress,disabled=false,gold=false}:{label:string;onPress:()=>void;disabled?:boolean;gold?:boolean}){return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:40,flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:4,borderRadius:10,borderWidth:1,borderColor:gold?C.gold:C.line,backgroundColor:gold?'rgba(216,185,120,.86)':'rgba(8,29,27,.42)',opacity:disabled?.4:1}}><Text style={{color:gold?C.background:C.ivory,fontWeight:'700',fontSize:11,textAlign:'center'}}>{label}</Text></Pressable>;}
function Chips({amount,label}:{amount:number;label:string}) {return <View style={{alignItems:'center',gap:2}}><Text style={{fontSize:9,color:C.muted,letterSpacing:1}}>{label}</Text><View style={{alignItems:'center',gap:0}}><ChipStack piles amount={amount}/><Text style={{color:C.goldLight,fontSize:18,fontWeight:'700',fontVariant:['tabular-nums']}}>{amount.toLocaleString()}</Text></View></View>;}
export function PokerScreen(){
 const root=useRef<View>(null),raiseSpot=useRef<View>(null),flightSerial=useRef(0),flightGeneration=useRef(0);
 const [selectedChips,setSelectedChips]=useState<number[]>([]);
 const [flights,setFlights]=useState<(Flight&{seat?:'human'|'computer'})[]>([]);
 const humanBalance=useRef<View>(null),computerBalance=useRef<View>(null),collectedPot=useRef<View>(null),collecting=useRef<import('./engine').PokerGame|null>(null),remaining=useRef(0);
 const completedFlights=useRef(new Set<number>());
 const [progress,setProgress]=useState({human:0,computer:0});
 const {pokerCollected,setPokerCollected,pokerStartingChips,pokerName,poker:g,setPoker,pokerShown:shown,setPokerShown:setShown,switchTarget}=useTableGame();const {game:domino,opponentId,setOpponentId}=useComputerGame();
 const {lang}=useI18n();const es=lang==='es';const {back}=useNav();const {tableMusic,tableMusicTrack,tileSound,ready}=usePrefs();useTableMusic(ready&&tableMusic,tableMusicTrack);
 const window=useWindowDimensions();const insets=useSafeAreaInsets();const compact=window.height-insets.top-insets.bottom<900;
 const [panelHeight,setPanelHeight]=useState(window.height-insets.top-insets.bottom);
 const [boardZoneY,setBoardZoneY]=useState(202);const [boardRowY,setBoardRowY]=useState(0);
 const usableHeight=window.height-insets.top-insets.bottom;const heroHeight=usableHeight<720?105:Math.min(165,usableHeight*.20);const ownWidth=72;const rivalWidth=Math.min(usableHeight<720?54:68,(window.width-64)/4);

 const [footerHeight,setFooterHeight]=useState(130);const [messageHeight,setMessageHeight]=useState(64);
 const boardHeight=pokerBoardZoneHeight(panelHeight,heroHeight,footerHeight,24*Math.max(1,Math.min(1.3,window.fontScale)),compact?255:280,messageHeight);
 const cardWidth=Math.min(communityCardWidth(window.width,panelHeight,heroHeight,48+boardZoneY+boardRowY),Math.max(24,(boardHeight-4)/1.43));
 const [active,setActive]=useState(AppState.currentState==='active');const [picker,setPicker]=useState(false);const [settings,setSettings]=useState(false);const [rules,setRules]=useState(false);const [reset,setReset]=useState(false);const [raise,setRaise]=useState('40');const [error,setError]=useState('');
 const presentation=g?`${g.hand}-${g.board.length}`:'';const dealing=shown!==presentation;
 const paused=!!switchTarget||picker||rules||settings||reset||!active;
 const mounted=useRef(true),currentGame=useRef(g);currentGame.current=g;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;flightGeneration.current++;};},[]);
 const showResult=usePokerResultTransition(g,paused||dealing,pokerCollected===g,next=>{setShown('');setPoker(current=>current===g?next:current);});
 const {name:blackjackName}=useBlackjack();
 const opponent=OPPONENTS.find(o=>o.id===opponentId)??OPPONENTS[0];const name=pokerName||blackjackName||domino?.playerName||(es?'Tú':'You');
 useEffect(()=>{if(!g)setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:pokerStartingChips}));},[g,setPoker]);
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));const nav=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});return()=>{sub.remove();nav.remove();};},[back]);
 useEffect(()=>{if(!presentation||paused)return;const timer=setTimeout(()=>setShown(presentation),700);return()=>clearTimeout(timer);},[presentation,paused]);
 useEffect(()=>{if(!g||g.result||g.turn!=='computer'||paused||dealing)return;const timer=setTimeout(()=>setPoker(current=>current===g?act(g,'computer',chooseComputerAction(computerView(g))):current),950);return()=>clearTimeout(timer);},[g,paused,dealing,setPoker]);
 useEffect(()=>{if(g){setRaise(String(g.bets.human));setSelectedChips([]);setError('');flightGeneration.current++;setFlights([]);}},[g?.hand,g?.street,g?.currentBet,g?.turn]);
 useEffect(()=>{
  if(!g?.result){collecting.current=null;setProgress({human:0,computer:0});return;}
  if(paused||dealing||pokerCollected===g||collecting.current===g)return;
  collecting.current=g;const awards=payoutAwards(g);const seats=(['human','computer'] as const).filter(s=>awards[s]>0);remaining.current=seats.length;
  for(const seat of seats){const destination=seat==='human'?humanBalance:computerBalance;
   const add=(rx:number,ry:number,sx:number,sy:number,tx:number,ty:number)=>{if(!mounted.current||currentGame.current!==g)return;setFlights(items=>[...items,{id:++flightSerial.current,kind:'win',seat,amount:awards[seat],from:{x:sx-rx,y:sy-ry},to:{x:tx-rx,y:ty-ry}}]);};
   if(root.current&&raiseSpot.current&&destination.current)root.current.measureInWindow((rx,ry)=>raiseSpot.current?.measureInWindow((sx,sy,sw,sh)=>destination.current?.measureInWindow((tx,ty,tw,th)=>add(rx,ry,sx+sw/2,sy+sh/2,tx+tw/2,ty+th/2))));
   else add(0,0,window.width/2,window.height/2,seat==='human'?55:90,120);
  }
 },[g,paused,dealing,pokerCollected]);

 if(!g)return <View style={{flex:1,backgroundColor:C.background}}/>;
 const legal=legalActions(g,'human');const enabled=legal.enabled&&!paused&&!dealing;const pot=g.total.human+g.total.computer;
 const send=(action:Action)=>{if(!enabled)return;try{setPoker(current=>current===g?act(g,'human',action):current);setError('');flightGeneration.current++;setFlights([]);}catch{setError(es?'Revisa el importe de la apuesta.':'Check the bet amount.');}};
 const addChip=(n:number,source:React.RefObject<View|null>)=>{
  if(!enabled||!legal.canRaise)return;
  setRaise(current=>String(Math.min(legal.maxTo,Number(current)+n)));setSelectedChips(items=>[...items,n]);
  const token=flightGeneration.current;
  if(root.current&&source.current&&raiseSpot.current)root.current.measureInWindow((rx,ry)=>source.current?.measureInWindow((sx,sy,sw,sh)=>raiseSpot.current?.measureInWindow((tx,ty,tw,th)=>{if(token===flightGeneration.current)setFlights(items=>[...items,{id:++flightSerial.current,amount:n,kind:'bet',from:{x:sx+sw/2-rx,y:sy+sh/2-ry},to:{x:tx+tw/2-rx,y:ty+th/2-ry}}]);})));
 };
 const raiseValue=Number(raise);const validRaise=Number.isInteger(raiseValue)&&raiseValue<=legal.maxTo&&raiseValue>g.currentBet&&(raiseValue>=legal.minTo||raiseValue===legal.maxTo);
 const result=g.result;
 const awards=payoutAwards(g);const collectingPending=!!result&&pokerCollected!==g;
 const displayBalance=(seat:'human'|'computer')=>Math.round(g.stacks[seat]-(collectingPending?awards[seat]*(1-progress[seat]):0));
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
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={20} color={C.ivory}/></Pressable>
 <View style={{flex:1,alignItems:'center'}}><Text style={{color:C.ivory,fontSize:16,letterSpacing:3,fontWeight:'600'}}>TEXAS HOLD’EM</Text><Text style={{color:C.gold,fontSize:9,letterSpacing:1.5}}>SOCIAL CLUB · NO LIMIT</Text></View>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>setSettings(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={20} color={C.gold}/></Pressable></View>
 <View testID="poker-table-surface" style={{flex:1,minHeight:0,overflow:'hidden'}}>
 <View testID="poker-table-background" pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0}}><DominoTableBackground opponentHeight={heroHeight} gift={null} es={es} finished={false}/></View>
 <View pointerEvents="none" style={{position:'absolute',top:(usableHeight<900?120:150)+148,left:40,right:40,height:85}}><TableStamp title="POKER" engraved/></View>
 <ScrollView testID="poker-fixed-table-content" scrollEnabled={false} bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false} style={{flex:1,minHeight:0}} contentContainerStyle={{flexGrow:1,paddingBottom:55+messageHeight}}>
 <View testID="poker-hero" style={{height:heroHeight,flexDirection:'row-reverse',paddingHorizontal:12,alignItems:'flex-end',gap:6}}>
 <View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:6}}><GameSwitchButton whiteDomino/><GameSwitchButton blackjack/></View>
 <Pressable testID="poker-opponent-avatar" accessibilityRole="button" accessibilityLabel={es?`Cambiar rival: ${opponent.name}`:`Change opponent: ${opponent.name}`} onPress={()=>setPicker(true)} style={{flex:1,minWidth:44,height:heroHeight}}><OpponentDrinkingAvatar opponentId={opponentId} name={opponent.name} gift={null} invitation={null} source={opponent.image} height={heroHeight} es={es}/></Pressable>


 <View style={{width:82,alignSelf:'flex-start',marginTop:14,gap:4}}><Text style={{color:C.muted,fontSize:9,textAlign:'center'}}>{es?'MANO':'HAND'} {g.hand}</Text></View>
 </View>
 <View testID="poker-rival-lane" style={{height:95.5,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingVertical:7,minHeight:82,marginRight:0}}>

 <View testID="poker-rival-cards" style={{position:'absolute',top:usableHeight<900?15:30,left:'50%',marginLeft:-(2*rivalWidth+6)/2,flexDirection:'row',gap:6}}>{g.holes.computer.map((card,i)=><View key={`${g.hand}-computer-${i}`}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&g.board.length===0} winning={winners.includes('computer')&&marked(card)} card={result?.reason==='showdown'?card:undefined} back={result?.reason!=='showdown'} width={rivalWidth} originX={80} delay={i*280}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&g.board.length===0} delay={i*280}/></View>)}</View>
 <Text style={{position:'absolute',right:18,color:C.goldLight,fontSize:10}}>{g.dealer==='computer'?'Ⓓ · SB':'BB'}{g.bets.computer?` · ${g.bets.computer}`:''}</Text></View>
 <View onLayout={e=>setBoardZoneY(e.nativeEvent.layout.y)} style={{flex:1,minHeight:boardHeight,alignItems:'center',justifyContent:'flex-end',gap:8,paddingBottom:0,paddingHorizontal:16}}>
 <View onLayout={e=>setBoardRowY(e.nativeEvent.layout.y)} style={{flexDirection:'row',gap:4}}>{Array.from({length:5},(_,i)=>{
 const fresh=!!g.board[i]&&(g.board.length===3||i===g.board.length-1);
 const delay=g.board.length===3?i*140:0;
 return <View key={`${g.hand}-${i}`}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&fresh} card={g.board[i]} slot winning={marked(g.board[i])} highlight={liveMarked(g.board[i])} width={cardWidth} originX={80} delay={delay}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&fresh} delay={delay}/></View>;
 })}</View>



 </View>
 <PokerHandHint visible={!result&&!dealing} text={`${es?'Tu mano':'Your hand'} · ${currentCategory}`} fontScale={window.fontScale}/>
 <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,paddingVertical:7,minHeight:82}}><View style={{flexDirection:'row',gap:7}}>{g.holes.human.map((card,i)=><View key={`${g.hand}-human-${i}`}><PokerCard winnerLabel={es?'Carta de combinación ganadora':'Winning combination card'} animate={dealing&&g.board.length===0} winning={winners.includes('human')&&marked(card)} highlight={liveMarked(card)} card={card} width={ownWidth} originX={80} delay={140+i*280}/><CardDealSound sound={ready&&tileSound} active={dealing&&!paused&&g.board.length===0} delay={140+i*280}/></View>)}</View><Text style={{position:'absolute',right:18,color:C.goldLight,fontSize:11}}>{g.dealer==='human'?'Ⓓ · SB':'BB'}{g.bets.human?` · ${g.bets.human}`:''}</Text></View>


 </ScrollView>

 <View ref={computerBalance} collapsable={false} style={{position:'absolute',left:42,top:heroHeight-65,zIndex:12}}><SeatChipPile testID="poker-computer-pile" amount={displayBalance('computer')} name={opponent.name} hideName totalAbove/></View>
 <View ref={humanBalance} collapsable={false} style={{position:'absolute',left:12,bottom:140,zIndex:12}}><SeatChipPile testID="poker-player-pile" amount={displayBalance('human')} name={name}/></View>
 <View ref={raiseSpot} collapsable={false} testID='poker-selected-raise' style={{position:'absolute',right:24,top:heroHeight+52,width:128,alignItems:'center',minHeight:54,justifyContent:'center',zIndex:12}}>{result&&visiblePot>0?<View ref={collectedPot} collapsable={false}><SeatChipPile testID="poker-pot-pile" chipScale={1/.55} amount={visiblePot} name={es?'BOTE':'POT'}/></View>:enabled&&raiseValue>g.bets.human?<><SelectedChipPile chips={selectedChips}/><Text numberOfLines={1} style={{color:C.goldLight,fontWeight:'700',fontSize:12}}>{es?'Subir a':'Raise to'} · {raiseValue}</Text><RaiseControls selectionKey={`${g.hand}-${g.street}-${g.turn}-${selectedChips.length}`} value={raiseValue} min={legal.minTo} max={legal.maxTo} base={g.currentBet} enabled={enabled&&legal.canRaise} es={es} onClear={()=>{setRaise(String(g.bets.human));setSelectedChips([]);flightGeneration.current++;setFlights([]);}} onConfirm={()=>{if(validRaise)send({type:'raise',to:raiseValue});}}/></>:visiblePot>0?<View ref={collectedPot} collapsable={false}><SeatChipPile testID="poker-pot-pile" chipScale={1/.55} amount={visiblePot} name={es?'BOTE':'POT'}/></View>:null}</View>
 <View testID="poker-message-overlay" pointerEvents="none" onLayout={e=>setMessageHeight(e.nativeEvent.layout.height)} style={{position:'absolute',left:0,right:0,bottom:0,zIndex:16,minHeight:64,paddingVertical:1,paddingHorizontal:12,justifyContent:'center'}}>
 {showResult&&!dealing?<View testID="poker-result-footer" pointerEvents="none" style={{width:'100%'}}><PokerResultBanner key={g.hand} result={describePokerResult(g,es,opponent.name)} paused={paused}/></View>:null}
 <View style={{alignItems:'center',paddingHorizontal:enabled?106:0}}>{error&&!result?<Text accessibilityLiveRegion='polite' style={{color:'#F0A899',fontSize:11,textAlign:'center'}}>{error}</Text>:null}{!result&&!error?<><PokerTurnPrompt active={enabled} label={dealing?(es?'Repartiendo…':'Dealing…'):g.turn==='human'?(es?'Tu turno':'Your Turn'):`${opponent.name} ${es?'está pensando…':'is thinking…'}`}/><Text style={{color:C.muted,fontSize:14,lineHeight:20,paddingBottom:2,marginTop:3}}>{g.last?`${g.last.player==='human'?name:opponent.name}: ${actionText}`:(es?'Ciegas 10 / 20':'Blinds 10 / 20')}</Text></>:null}</View>
 </View>
 </View>
 <View onLayout={e=>setFooterHeight(e.nativeEvent.layout.height)} style={{backgroundColor:'#704329',paddingHorizontal:12,paddingTop:22,paddingBottom:10,minHeight:87,gap:0}}><View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0}}><WoodSurface/></View>

 <ChipRaiseTray value={raiseValue} min={legal.minTo} max={legal.maxTo} base={g.currentBet} enabled={enabled&&legal.canRaise} es={es} onAdd={addChip} onClear={()=>{setRaise(String(g.bets.human));setSelectedChips([]);flightGeneration.current++;setFlights([]);}} onConfirm={()=>{if(validRaise)send({type:'raise',to:raiseValue});}}/>
 {result&&!showResult&&bankruptSeat(g)?<View testID='poker-bankrupt-continuation' style={{alignSelf:'center',width:156,minHeight:46}}><PokerContinuation game={g} es={es} blocked={dealing||paused||collectingPending} names={{human:name,computer:opponent.name}} onContinue={next=>{setShown('');setPoker(current=>current===g?next:current);}}/></View>:null}


 </View>

 {flights.map(f=><ChipFlight key={f.id} flight={f} sound={ready&&tileSound} paused={paused} onProgress={f.seat?p=>setProgress(current=>({...current,[f.seat!]:p})):undefined} onComplete={()=>{if(!mounted.current||currentGame.current!==g||completedFlights.current.has(f.id))return;completedFlights.current.add(f.id);setFlights(items=>items.filter(x=>x.id!==f.id));if(f.seat){setProgress(current=>({...current,[f.seat!]:1}));remaining.current--;if(remaining.current===0)setPokerCollected(g);}}}/>)}
 <FloatingAction id='poker-fold' color='#A4453D' label={es?'RETIRAR':'FOLD'} side='right' visible={enabled&&!result} enabled={enabled&&!result} onPress={()=>send({type:'fold'})} bottom={footerHeight-2}/>
 <FloatingAction id='poker-check-call' color='#267B58' label={legal.toCall?`${es?'IGUALAR':'CALL'} ${legal.toCall}`:(es?'PASAR':'CHECK')} side='right' visible={enabled&&!result} enabled={enabled&&!result} onPress={()=>send({type:legal.toCall?'call':'check'})} bottom={footerHeight+56}/>
 <FloatingAction id='poker-all-in' color='#B18B44' label='ALL-IN' side='left' visible={enabled&&!result&&legal.canRaise} enabled={enabled&&!result&&legal.canRaise} onPress={()=>send({type:'raise',to:legal.maxTo})} bottom={footerHeight-2}/>
 <Modal visible={picker||rules||reset} transparent animationType="fade" onRequestClose={()=>{setPicker(false);setRules(false);setReset(false);}}><View style={{flex:1,justifyContent:'center',padding:22,backgroundColor:'rgba(2,12,10,.86)'}}><View accessibilityViewIsModal style={{maxHeight:'85%',backgroundColor:C.surface,borderRadius:24,padding:22,gap:16,borderWidth:1,borderColor:C.line}}><Text style={{color:C.goldLight,fontSize:23,fontWeight:'600'}}>{picker?(es?'Elige tu rival':'Choose your opponent'):reset?(es?'¿Reiniciar póker?':'Restart poker?'):'Texas Hold’em'}</Text>
 {rules?<Pressable accessibilityRole="button" onPress={()=>{setRules(false);setReset(true);}}><Text style={{color:C.gold}}>{es?'Reiniciar póker':'Restart poker'}</Text></Pressable>:null}
 <ScrollView>{picker?<OpponentChoices selected={opponentId} onSelect={id=>{setOpponentId(id);setPicker(false);}}/>:<Text style={{color:C.ivory,fontSize:15,lineHeight:24}}>{reset?(es?`Se reemplazará solo la partida de póker y ambos jugadores recibirán ${pokerStartingChips} fichas virtuales.`:`Only your poker game will reset. Both players receive ${pokerStartingChips} virtual chips.`):(es?`Dos cartas privadas y cinco comunitarias. Gana la mejor combinación de cinco cartas.

Ciegas: 10 / 20. El botón paga la ciega pequeña y actúa primero antes del flop; después actúa primero el rival. Puedes pasar, igualar, retirarte o subir hasta todas tus fichas.

Flop: tres cartas. Turn y river: una más cada uno. En all-in se completa la mesa y se comparan las manos. El importe de subida es el total de esta calle.`:`Two private cards and five community cards. The best five-card hand wins.

Blinds: 10 / 20. The button posts the small blind and acts first before the flop; the other player acts first afterward. Check, call, fold or raise up to your full stack.

Flop: three cards. Turn and river: one each. An all-in runs out the board and compares hands. Raise amounts are the total bet for this street.`)}</Text>}</ScrollView>
 <View style={{flexDirection:'row',gap:10}}><Button label={es?'Cerrar':'Close'} onPress={()=>{setPicker(false);setRules(false);setReset(false);}}/>{reset?<Button gold label={es?'Reiniciar':'Restart'} onPress={()=>{setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:pokerStartingChips}));setShown('');setReset(false);}}/>:null}</View>
 </View></View></Modal>
 <TableSettings matching={false} visible={settings} es={es} onClose={()=>setSettings(false)} onRules={()=>{setSettings(false);setRules(true);}}/>
 </View>;
}
