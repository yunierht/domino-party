import {OpponentChoices} from '../computer/OpponentChoices';
import React, {useEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Image,Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
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
import {act,bestFive,combinationCards,evaluate,chooseComputerAction,computerView,legalActions,newHand} from './engine';
import type {Action} from './engine';
import {ChipStack} from './CasinoChip';
import {DealerHands} from './DealerHands';
import {communityCardWidth} from './tableFit';
import {PlayingCard} from './PlayingCard';
const labelsES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
const labelsEN=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
function Button({label,onPress,disabled=false,gold=false}:{label:string;onPress:()=>void;disabled?:boolean;gold?:boolean}){return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:40,flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:4,borderRadius:10,borderWidth:1,borderColor:gold?C.gold:C.line,backgroundColor:gold?'rgba(216,185,120,.86)':'rgba(8,29,27,.42)',opacity:disabled?.4:1}}><Text style={{color:gold?C.background:C.ivory,fontWeight:'700',fontSize:11,textAlign:'center'}}>{label}</Text></Pressable>;}
function Chips({amount,label}:{amount:number;label:string}) {return <View style={{alignItems:'center',gap:2}}><Text style={{fontSize:9,color:C.muted,letterSpacing:1}}>{label}</Text><View style={{alignItems:'center',gap:0}}><ChipStack piles amount={amount}/><Text style={{color:C.goldLight,fontSize:18,fontWeight:'700',fontVariant:['tabular-nums']}}>{amount.toLocaleString()}</Text></View></View>;}
export function PokerScreen(){
 const dealerAnchor=useRef<View>(null);
 const {pokerStartingChips,pokerName,poker:g,setPoker,pokerShown:shown,setPokerShown:setShown,switchTarget}=useTableGame();const {game:domino,opponentId,setOpponentId}=useComputerGame();
 const {lang}=useI18n();const es=lang==='es';const {back}=useNav();const {tableMusic,tileSound,ready}=usePrefs();useTableMusic(ready&&tableMusic);
 const window=useWindowDimensions();const insets=useSafeAreaInsets();const compact=window.height-insets.top-insets.bottom<720;
 const [panelHeight,setPanelHeight]=useState(window.height-insets.top-insets.bottom);
 const [boardZoneY,setBoardZoneY]=useState(202);const [boardRowY,setBoardRowY]=useState(0);
 const heroHeight=compact?120:150;const cardWidth=communityCardWidth(window.width,panelHeight,heroHeight,48+boardZoneY+boardRowY);const ownWidth=compact?60:72;
 const [rivalNotice,setRivalNotice]=useState<Action|null>(null);
 const [raiseOpen,setRaiseOpen]=useState(false);
 const [active,setActive]=useState(AppState.currentState==='active');const [picker,setPicker]=useState(false);const [rules,setRules]=useState(false);const [reset,setReset]=useState(false);const [raise,setRaise]=useState('40');const [error,setError]=useState('');
 const presentation=g?`${g.hand}-${g.board.length}`:'';const dealing=shown!==presentation;
 const paused=!!switchTarget||picker||rules||reset||!active;
 const opponent=OPPONENTS.find(o=>o.id===opponentId)??OPPONENTS[0];const name=pokerName||domino?.playerName||(es?'Tú':'You');
 useEffect(()=>{if(!g)setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:pokerStartingChips}));},[g,setPoker]);
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));const nav=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});return()=>{sub.remove();nav.remove();};},[back]);
 useEffect(()=>{if(!presentation||paused)return;const timer=setTimeout(()=>setShown(presentation),g?.board.length===0?2200:g?.board.length===3?1750:750);return()=>clearTimeout(timer);},[presentation,paused]);
 useEffect(()=>{if(!g||g.result||g.turn!=='computer'||paused||dealing)return;const timer=setTimeout(()=>setPoker(current=>current===g?act(g,'computer',chooseComputerAction(computerView(g))):current),950);return()=>clearTimeout(timer);},[g,paused,dealing,setPoker]);
 useEffect(()=>{if(g){const legal=legalActions(g,'human');setRaise(String(Math.min(legal.maxTo,legal.minTo)));setError('');}},[g?.hand,g?.street,g?.currentBet]);
 useEffect(()=>{
  if(g?.last?.player!=='computer'){setRivalNotice(null);return;}
  setRivalNotice(g.last.action);
  const timer=setTimeout(()=>setRivalNotice(null),3500);
  return()=>clearTimeout(timer);
 },[g?.last,g?.hand]);
 if(!g)return <View style={{flex:1,backgroundColor:C.background}}/>;
 const legal=legalActions(g,'human');const enabled=legal.enabled&&!paused&&!dealing;const pot=g.total.human+g.total.computer;
 const send=(action:Action)=>{if(!enabled)return;try{setPoker(current=>current===g?act(g,'human',action):current);setError('');}catch{setError(es?'Revisa el importe de la apuesta.':'Check the bet amount.');}};
 const raiseValue=Number(raise);const validRaise=Number.isInteger(raiseValue)&&raiseValue<=legal.maxTo&&raiseValue>g.currentBet&&(raiseValue>=legal.minTo||raiseValue===legal.maxTo);
 const result=g.result;const matchOver=!!result&&(g.stacks.human===0||g.stacks.computer===0);
 const outcome=result?(result.winner==='tie'?(es?'Bote repartido':'Split pot'):`${result.winner==='human'?name:opponent.name} ${es?'gana':'wins'} · ${result.pot}`):'';
 const winners=result?.reason==='showdown'&&!dealing?(result.winner==='tie'?['human','computer'] as const:[result.winner]):[];
 const winningCards=new Set(winners.flatMap(seat=>bestFive([...g.board,...g.holes[seat]]).map(c=>`${c.rank}${c.suit}`)));
 const marked=(card:typeof g.board[number]|undefined)=>!!card&&winningCards.has(`${card.rank}${card.suit}`);
 const liveCards=new Set(!result&&!dealing?combinationCards([...g.holes.human,...g.board]).map(c=>`${c.rank}${c.suit}`):[]);
 const liveMarked=(card:typeof g.board[number]|undefined)=>!!card&&liveCards.has(`${card.rank}${card.suit}`);
 const currentCategory=g.board.length>=3?(es?labelsES:labelsEN)[evaluate([...g.holes.human,...g.board])[0]]:g.holes.human[0].rank===g.holes.human[1].rank?(es?'Pareja en mano':'Pocket pair'):(es?'Sin pareja':'No pair');
 const ranks=result?.ranks;const category=ranks?((es?labelsES:labelsEN)[ranks[result?.winner==='computer'?'computer':'human'][0]]):'';
 const stage=({preflop:'PRE-FLOP',flop:'FLOP',turn:'TURN',river:'RIVER',complete:es?'MANO COMPLETA':'HAND COMPLETE'})[g.street];
 const actionText=g.last?({fold:es?'Se retira':'Folds',check:es?'Pasa':'Checks',call:es?'Iguala':'Calls',raise:es?'Sube':'Raises'})[g.last.action.type]+(g.last.action.type==='raise'?` · ${g.last.action.to}`:''):'';
 return <View onLayout={e=>setPanelHeight(e.nativeEvent.layout.height)} style={{flex:1,backgroundColor:C.background,overflow:'hidden'}}>
 <View style={{height:48,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:C.line,paddingHorizontal:6}}>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={20} color={C.ivory}/></Pressable>
 <View style={{flex:1,alignItems:'center'}}><Text style={{color:C.ivory,fontSize:16,letterSpacing:3,fontWeight:'600'}}>TEXAS HOLD’EM</Text><Text style={{color:C.gold,fontSize:9,letterSpacing:1.5}}>SOCIAL CLUB · NO LIMIT</Text></View>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Cambiar rival':'Change opponent'} onPress={()=>setPicker(true)} style={{width:66,minHeight:36,padding:5,backgroundColor:C.surface,borderRadius:12,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',gap:4}}><Text numberOfLines={1} style={{flex:1,color:C.goldLight,fontSize:11}}>{opponent.name}</Text><Feather name="users" color={C.goldLight} size={14}/></Pressable>
 <Pressable accessibilityRole="button" accessibilityLabel={es?'Reglas de póker':'Poker rules'} onPress={()=>setRules(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={20} color={C.gold}/></Pressable></View>
 <View pointerEvents="none" style={{position:'absolute',top:48,bottom:0,left:5,right:12}}><DominoTableBackground opponentHeight={heroHeight} gift={null} es={es} finished={false}/></View>
 <View style={{flex:1,minHeight:0}}>
 <View style={{height:heroHeight,flexDirection:'row-reverse',paddingHorizontal:12,alignItems:'flex-end',gap:5}}>
 <View style={{width:76,alignSelf:'flex-start',marginTop:10,gap:6}}><GameSwitchButton/><GameSwitchButton blackjack/></View>
 <Image source={opponent.depthImage} resizeMode="contain" accessibilityLabel={opponent.name} style={{flex:1,height:heroHeight}}/>
 {rivalNotice?<View pointerEvents="none" accessibilityLiveRegion="polite" style={{position:'absolute',bottom:2,left:120,right:88,alignItems:'center',zIndex:30}}><View style={{paddingHorizontal:10,paddingVertical:6,borderRadius:12,borderWidth:1,borderColor:C.gold,backgroundColor:'rgba(5,27,20,.95)'}}><Text style={{color:C.goldLight,fontSize:12,fontWeight:'700',textAlign:'center'}}>{rivalNotice.type==='raise'?`${es?'Subo a':'Raise to'} ${rivalNotice.to}`:({call:es?'Igualo':'Call',fold:es?'Me retiro':'Fold',check:es?'Paso':'Check'})[rivalNotice.type]}</Text></View></View>:null}

 <View style={{width:108,alignSelf:'flex-start',marginTop:8,padding:5,borderRadius:12,backgroundColor:'rgba(5,27,20,.55)',gap:3}}>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3}}><View style={{width:48,height:34,overflow:'hidden'}}><View style={{transform:[{scale:.68}],transformOrigin:'top left'}}><ChipStack piles amount={result?result.pot:pot}/></View></View><View style={{alignItems:'center'}}><Text style={{color:C.muted,fontSize:9}}>{es?'BOTE':'POT'}</Text><Text style={{color:C.goldLight,fontSize:16,fontWeight:'700'}}>{result?result.pot:pot}</Text></View></View>
 <Text style={{color:C.goldLight,fontSize:9,textAlign:'center'}}>{stage}</Text><Text style={{color:C.muted,fontSize:9,textAlign:'center'}}>{es?'MANO':'HAND'} {g.hand}</Text></View>
 </View>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingVertical:7,minHeight:82,marginRight:0}}>
 <View style={{position:'absolute',right:window.width/2+(compact?30:35)+2+12}}><Chips amount={g.stacks.computer} label={opponent.name.toUpperCase()}/></View>
 <View style={{flexDirection:'row',gap:4}}>{g.holes.computer.map((card,i)=><View key={`${g.hand}-computer-${i}`}><PlayingCard animate={dealing&&g.board.length===0} highlight={winners.includes('computer')&&marked(card)} card={result?.reason==='showdown'?card:undefined} back={result?.reason!=='showdown'} width={compact?30:35} originX={42-i*10} originY={-18} delay={240+i*1000}/><DealerHands sound={ready&&tileSound} anchor={dealerAnchor} active={dealing&&!paused&&g.board.length===0} delay={i*1000} cardWidth={compact?30:35} releaseX={42-i*10}/></View>)}</View>
 <Text style={{position:'absolute',right:18,color:C.goldLight,fontSize:10}}>{g.dealer==='computer'?'Ⓓ · SB':'BB'}{g.bets.computer?` · ${g.bets.computer}`:''}</Text></View>
 <View onLayout={e=>setBoardZoneY(e.nativeEvent.layout.y)} style={{flex:1,minHeight:compact?135:160,alignItems:'center',justifyContent:'center',gap:compact?4:13,paddingHorizontal:16}}>
 <View onLayout={e=>setBoardRowY(e.nativeEvent.layout.y)} style={{flexDirection:'row',gap:4}}><View ref={dealerAnchor} collapsable={false} pointerEvents="none" style={{position:'absolute',left:(5*cardWidth+16)/2+window.width/2-14,top:cardWidth*.715,width:1,height:1}}/>{Array.from({length:5},(_,i)=>{
 const fresh=!!g.board[i]&&(g.board.length===3||i===g.board.length-1);
 const delay=g.board.length===3?i*500:0;
 return <View key={`${g.hand}-${i}-${g.board[i]?.rank??'empty'}-${g.board[i]?.suit??''}`}><PlayingCard animate={dealing&&fresh} card={g.board[i]} highlight={marked(g.board[i])||liveMarked(g.board[i])} width={cardWidth} originX={28+(4-i)*6} originY={-18} delay={delay+240}/><DealerHands sound={ready&&tileSound} anchor={dealerAnchor} active={dealing&&!paused&&fresh} delay={delay} cardWidth={cardWidth} releaseX={28+(4-i)*6}/></View>;
 })}</View>

 <View style={{minHeight:48,marginTop:10,justifyContent:'center',alignItems:'center'}}><Text numberOfLines={1} style={{color:result?C.goldLight:C.ivory,fontSize:18,fontWeight:'600'}}>{result?outcome:dealing?(es?'Repartiendo…':'Dealing…'):g.turn==='human'?(es?'Tu turno':'Your turn'):`${opponent.name} ${es?'está pensando…':'is thinking…'}`}</Text><Text style={{color:C.muted,fontSize:14,marginTop:3}}>{result?(result.reason==='fold'?(es?'Sin mostrar cartas':'Cards stay hidden'):category):g.last?`${g.last.player==='human'?name:opponent.name}: ${actionText}`:(es?'Ciegas 10 / 20':'Blinds 10 / 20')}</Text></View>
 </View>
 {!result&&!dealing?<Text accessibilityLiveRegion="polite" style={{color:C.goldLight,fontSize:13,textAlign:'center',paddingTop:2,paddingBottom:3}}>{es?'Tu mano':'Your hand'} · {currentCategory}</Text>:null}
 <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:18,paddingVertical:7,minHeight:82}}><View style={{position:'absolute',right:window.width/2+ownWidth+3.5+12}}><Chips amount={g.stacks.human} label={name.toUpperCase()}/></View><View style={{flexDirection:'row',gap:7}}>{g.holes.human.map((card,i)=><View key={`${g.hand}-human-${i}`}><PlayingCard animate={dealing&&g.board.length===0} highlight={(winners.includes('human')&&marked(card))||liveMarked(card)} card={card} width={ownWidth} originX={42-i*10} originY={-18} delay={740+i*1000}/><DealerHands sound={ready&&tileSound} anchor={dealerAnchor} active={dealing&&!paused&&g.board.length===0} delay={500+i*1000} cardWidth={ownWidth} releaseX={42-i*10}/></View>)}</View><Text style={{position:'absolute',right:18,color:C.goldLight,fontSize:11}}>{g.dealer==='human'?'Ⓓ · SB':'BB'}{g.bets.human?` · ${g.bets.human}`:''}</Text></View>
 </View>
 <View style={{backgroundColor:'transparent',paddingHorizontal:14,paddingTop:4,paddingBottom:2,gap:4}}>
 {result?<View style={{flexDirection:'row'}}><Button gold label={matchOver?(es?`Nueva partida · ${pokerStartingChips} fichas`:`New game · ${pokerStartingChips} chips`):(es?'Siguiente mano':'Next hand')} onPress={()=>{setShown('');setPoker(matchOver?newHand(undefined,Math.random,{human:pokerStartingChips,computer:pokerStartingChips}):newHand(g));}}/></View>:<>
 <View style={{flexDirection:'row',gap:4,alignItems:'center'}}><Button label={es?'Retirar':'Fold'} disabled={!enabled} onPress={()=>send({type:'fold'})}/><Button gold label={legal.toCall?`${es?'Igualar':'Call'} ${legal.toCall}`:(es?'Pasar':'Check')} disabled={!enabled} onPress={()=>send({type:legal.toCall?'call':'check'})}/><Button label={es?'All-in':'All-in'} disabled={!enabled||!legal.canRaise} onPress={()=>send({type:'raise',to:legal.maxTo})}/><Button label={es?'Subir':'Raise'} disabled={!enabled||!legal.canRaise} onPress={()=>setRaiseOpen(true)}/></View></>}
 {error?<Text style={{color:'#F0A899',fontSize:11}}>{error}</Text>:null}

 </View>
 <Modal visible={raiseOpen} transparent animationType="fade" onRequestClose={()=>setRaiseOpen(false)}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(2,12,10,.82)'}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:290,alignSelf:'center',backgroundColor:C.surface,borderRadius:22,padding:18,gap:14,borderWidth:1,borderColor:C.line}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12}}><Text style={{color:C.goldLight,fontSize:22}}>{es?'Subir a':'Raise to'}</Text><Text accessibilityLabel={es?'Importe seleccionado':'Selected amount'} style={{color:C.goldLight,fontSize:28,fontWeight:'700',fontVariant:['tabular-nums']}}>{raise}</Text></View><View style={{gap:8}}>{[5,10,20,50,100].map(step=>{
 const minimum=Math.min(legal.minTo,legal.maxTo);
 const canMinus=enabled&&legal.canRaise&&raiseValue-step>=minimum;
 const canPlus=enabled&&legal.canRaise&&raiseValue+step<=legal.maxTo;
 return <View key={step} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}>
 <Pressable accessibilityRole="button" accessibilityLabel={`${es?'Restar':'Subtract'} ${step}`} accessibilityState={{disabled:!canMinus}} disabled={!canMinus} onPress={()=>setRaise(String(raiseValue-step))} style={{width:48,height:42,borderRadius:10,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center',opacity:canMinus?1:.3}}><Text style={{color:C.goldLight,fontSize:23}}>−</Text></Pressable>
 <Text style={{width:52,color:C.ivory,fontSize:17,textAlign:'center',fontVariant:['tabular-nums']}}>{step}</Text>
 <Pressable accessibilityRole="button" accessibilityLabel={`${es?'Sumar':'Add'} ${step}`} accessibilityState={{disabled:!canPlus}} disabled={!canPlus} onPress={()=>setRaise(String(raiseValue+step))} style={{width:48,height:42,borderRadius:10,borderWidth:1,borderColor:C.gold,alignItems:'center',justifyContent:'center',opacity:canPlus?1:.3}}><Text style={{color:C.goldLight,fontSize:23}}>+</Text></Pressable>
 </View>;
 })}</View><View style={{flexDirection:'row',gap:10}}><Button label={es?'Cancelar':'Cancel'} onPress={()=>setRaiseOpen(false)}/><Button gold label={es?'Confirmar':'Confirm'} disabled={!enabled||!legal.canRaise||!validRaise} onPress={()=>{send({type:'raise',to:raiseValue});setRaiseOpen(false);}}/></View></View></View></Modal>
 <Modal visible={picker||rules||reset} transparent animationType="fade" onRequestClose={()=>{setPicker(false);setRules(false);setReset(false);}}><View style={{flex:1,justifyContent:'center',padding:22,backgroundColor:'rgba(2,12,10,.86)'}}><View accessibilityViewIsModal style={{maxHeight:'85%',backgroundColor:C.surface,borderRadius:24,padding:22,gap:16,borderWidth:1,borderColor:C.line}}><Text style={{color:C.goldLight,fontSize:23,fontWeight:'600'}}>{picker?(es?'Elige tu rival':'Choose your opponent'):reset?(es?'¿Reiniciar póker?':'Restart poker?'):'Texas Hold’em'}</Text>
 {rules?<Pressable accessibilityRole="button" onPress={()=>{setRules(false);setReset(true);}}><Text style={{color:C.gold}}>{es?'Reiniciar póker':'Restart poker'}</Text></Pressable>:null}
 <ScrollView>{picker?<OpponentChoices selected={opponentId} onSelect={id=>{setOpponentId(id);setPicker(false);}}/>:<Text style={{color:C.ivory,fontSize:15,lineHeight:24}}>{reset?(es?`Se reemplazará solo la partida de póker y ambos jugadores recibirán ${pokerStartingChips} fichas virtuales.`:`Only your poker game will reset. Both players receive ${pokerStartingChips} virtual chips.`):(es?`Dos cartas privadas y cinco comunitarias. Gana la mejor combinación de cinco cartas.

Ciegas: 10 / 20. El botón paga la ciega pequeña y actúa primero antes del flop; después actúa primero el rival. Puedes pasar, igualar, retirarte o subir hasta todas tus fichas.

Flop: tres cartas. Turn y river: una más cada uno. En all-in se completa la mesa y se comparan las manos. El importe de subida es el total de esta calle.`:`Two private cards and five community cards. The best five-card hand wins.

Blinds: 10 / 20. The button posts the small blind and acts first before the flop; the other player acts first afterward. Check, call, fold or raise up to your full stack.

Flop: three cards. Turn and river: one each. An all-in runs out the board and compares hands. Raise amounts are the total bet for this street.`)}</Text>}</ScrollView>
 <View style={{flexDirection:'row',gap:10}}><Button label={es?'Cerrar':'Close'} onPress={()=>{setPicker(false);setRules(false);setReset(false);}}/>{reset?<Button gold label={es?'Reiniciar':'Restart'} onPress={()=>{setPoker(newHand(undefined,Math.random,{human:pokerStartingChips,computer:pokerStartingChips}));setShown('');setReset(false);}}/>:null}</View>
 </View></View></Modal>
 </View>;
}
