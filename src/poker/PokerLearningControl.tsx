import React,{useEffect,useRef,useState} from 'react';
import {Modal,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {ModalCloseButton} from '../components/ModalCloseButton';
import {TABLE as C} from '../computer/tableTheme';
import {PokerCard} from './PokerCard';
import {evaluate,combinationCards} from './engine';
import {analyzePoker,oddsPercentages,validPokerCards,type PublicPokerCards,type PokerAnalysis} from './pokerOdds';
const namesEN=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
const namesES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full','Póker','Escalera de color'];
export function PokerLearningControl({hero,board,es,enabled=true,onOpen,onClose}:PublicPokerCards&{es:boolean;enabled?:boolean;onOpen?:()=>boolean|void|Promise<boolean|void>;onClose?:()=>void}){
 const [open,setOpen]=useState(false),[opening,setOpening]=useState(false),[analysis,setAnalysis]=useState<{key:string;value:PokerAnalysis}|null>(null),[failed,setFailed]=useState(false),[expanded,setExpanded]=useState(false);
 const {width,height}=useWindowDimensions(),key=JSON.stringify([hero,board]),valid=enabled&&validPokerCards({hero,board});
 const current=useRef({valid,key,onOpen,onClose});current.current={valid,key,onOpen,onClose};const mounted=useRef(true),pendingOpen=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(open)return()=>current.current.onClose?.();},[open]);
 useEffect(()=>{
  if(!open)return;if(!valid){setOpen(false);return;}
  let cancelled=false;setAnalysis(null);setFailed(false);setExpanded(false);
  void analyzePoker({hero,board},{cancelled:()=>cancelled}).then(value=>{if(!cancelled)setAnalysis({key,value});}).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;};
 },[open,key,valid]);
 async function show(){if(!current.current.valid||open||pendingOpen.current)return;pendingOpen.current=true;setOpening(true);const startKey=current.current.key;try{const ready=await current.current.onOpen?.();if(ready===false)return;if(!mounted.current||!current.current.valid||current.current.key!==startKey){current.current.onClose?.();return;}setOpen(true);}catch{current.current.onClose?.();}finally{pendingOpen.current=false;if(mounted.current)setOpening(false);}}
 const tr=(a:string,b:string)=>es?a:b,names=es?namesES:namesEN,result=analysis?.key===key?analysis.value:null;
 const currentCategory=hero.length===2&&board.length>=3?evaluate([...hero,...board])[0]:hero.length===2&&hero[0].rank===hero[1].rank?1:0;
 const compact=(height??800)<700,cardWidth=Math.max(30,Math.min(52,(Math.min(width,480)-84)/(hero.length+board.length))),text={color:C.ivory,fontSize:14,lineHeight:18} as const;
 const marked=validPokerCards({hero,board})?combinationCards([...hero,...board]):[];
 const cards=(values:PublicPokerCards['hero'],size=cardWidth)=><View style={{flexDirection:'row',gap:4}}>{values.map((card,i)=><PokerCard key={`${card.rank}${card.suit}-${i}`} card={card} width={size} combination={marked.some(value=>value.rank===card.rank&&value.suit===card.suit)} combinationLabel={tr("Carta de tu combinación actual","Card in your current combination")}/>)}</View>;
 const group=result?.categories[0];
 return <>
  <Pressable testID="poker-learning-open" accessibilityRole="button" accessibilityLabel={tr('Asistente de entrenamiento','Training assistant')} accessibilityState={{disabled:!valid||opening}} disabled={!valid||opening} onPress={()=>{void show();}} style={{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:C.gold,backgroundColor:'#205541',overflow:'hidden',alignItems:'center',justifyContent:'center',opacity:valid?1:.4}}>
   <View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>{Array.from({length:8},(_,i)=><View key={i} style={{position:'absolute',top:i*6,left:0,width:44,height:1,backgroundColor:'#C0DDAC',opacity:.09,transform:[{rotate:'-25deg'}]}}/>)}</View><Feather name="cpu" color={C.goldLight} size={22}/>
  </Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}><View style={{flex:1,backgroundColor:'rgba(2,12,10,.8)',padding:12,justifyContent:'center'}}><View testID="poker-learning-dialog" accessibilityViewIsModal style={{width:'100%',maxWidth:480,alignSelf:'center',backgroundColor:C.surface,borderColor:C.gold,borderWidth:1,borderRadius:20,padding:14,paddingTop:48,gap:compact?6:8}}>
   <ModalCloseButton es={es} onPress={()=>setOpen(false)} testID="poker-learning-close"/>
   <Text accessibilityRole="header" style={{color:C.goldLight,fontSize:20,fontWeight:'700',textAlign:'center'}}>{tr('Tu análisis','Your analysis')}</Text>
   <Text testID="poker-learning-current-hand" numberOfLines={1} style={{color:C.goldLight,fontSize:14,lineHeight:18,textAlign:'center'}}>{board.length===0?tr('Antes del flop','Before the flop'):tr('Ahora','Now')}: {names[currentCategory]}</Text>
   <View testID="poker-learning-visible-cards" style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><View><Text style={text}>{tr('Tus cartas','Your cards')}</Text>{cards(hero)}</View><View><Text style={text}>{tr('Mesa','Board')}</Text>{board.length?cards(board):<Text style={{...text,color:C.muted}}>{tr('Sin cartas aún','No cards yet')}</Text>}</View></View>
   {!result?<Text accessibilityLiveRegion="polite" style={text}>{failed?tr('No se pudo calcular. Vuelve a intentar.','Could not calculate. Try again.'):tr('Calculando…','Calculating…')}</Text>:<>
    <View testID="poker-learning-overall" style={{padding:8,borderRadius:12,backgroundColor:C.background,gap:4}}><Text style={text}>{tr('Resultado al final de la mano','Outcome at the end of the hand')}</Text><View style={{flexDirection:'row',justifyContent:'space-between'}}>{(['win','tie','loss'] as const).map((kind,i)=><View key={kind} style={{alignItems:'center'}}><Text style={{color:i===0?C.mint:i===1?C.goldLight:C.ivory,fontSize:18,fontWeight:'700'}}>{oddsPercentages(result)[kind]}%</Text><Text style={text}>{[tr('Ganar','Win'),tr('Empatar','Tie'),tr('Perder','Lose')][i]}</Text></View>)}</View></View>
    {!expanded?<View testID="poker-learning-own-options" style={{gap:4}}><Text style={{...text,fontWeight:'700',color:C.goldLight}}>{tr('Tus combinaciones más probables al final','Your most likely final hands')}</Text>{result.heroCategories.slice(0,3).map(option=><View key={option.category} style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={text}>{names[option.category]}</Text><Text style={{...text,fontWeight:'700'}}>{(option.total/result.total*100).toFixed(1)}%</Text></View>)}</View>:null}
    {!expanded?<View testID="poker-learning-rival-options" style={{gap:4}}><Text style={{...text,fontWeight:'700',color:C.goldLight}}>{tr('Combinaciones más probables del rival','Opponent most likely final hands')}</Text>{result.categories.slice(0,3).map(option=><View key={option.category} style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={text}>{names[option.category]}</Text><Text style={{...text,fontWeight:'700'}}>{(option.total/result.total*100).toFixed(1)}%</Text></View>)}</View>:null}
    {expanded&&group&&<View testID="poker-learning-explanation" style={{gap:6}}>
     <Text style={text}>{tr('Son probabilidades de terminar con cada combinación, no de ganar.','These are chances of finishing with each hand, not winning chances.')}</Text>
     <Text style={text}>{tr('Si el rival termina con','If the opponent finishes with')} {names[group.category]}:</Text>
     <Text style={text}>{tr('Ganas','You win')} {oddsPercentages(group).win}% · {tr('Empatan','Tie')} {oddsPercentages(group).tie}% · {tr('Pierdes','You lose')} {oddsPercentages(group).loss}%</Text>
     <Text style={text}>{tr(`Faltan ${result.pending} cartas comunitarias; los posibles repartos ya están incluidos.`,`There are ${result.pending} community cards to come; the possible runouts are included.`)}</Text>
    </View>}
    <Pressable testID={`poker-learning-explain-${group?.category}`} accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(value=>!value)} style={{minHeight:36,justifyContent:'center'}}><Text style={{...text,color:C.goldLight,fontWeight:'700'}}>{expanded?tr('Ver probabilidades','Show probabilities'):tr('Ver explicación','See explanation')}</Text></Pressable>
    <Text style={{color:C.muted,fontSize:12,lineHeight:16}}>{result.exact?tr(`Exacto · ${result.total} manos rivales`,`Exact · ${result.total} opponent hands`):tr(`Aproximación · ${result.total} simulaciones`,`Approximation · ${result.total} simulations`)} · {tr('Rival desconocido, manos equiprobables','Unknown opponent, equally likely hands')}</Text>
   </>}
  </View></View></Modal>
 </>;
}