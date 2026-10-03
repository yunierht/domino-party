import {CardSuit} from './PlayingCard';
import React, { createContext, useContext, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Svg, { G, Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import {useNav} from '../nav/NavContext';
import type { PokerGame } from './engine';
import { TABLE as C } from '../computer/tableTheme';
import { useI18n } from '../i18n/I18nContext';
export type TableMode = 'domino' | 'poker';
const Context = createContext<{pokerStartingChips:number;setPokerStartingChips:(amount:number)=>void;pokerName:string;setPokerName:(name:string)=>void;mode:TableMode;poker:PokerGame|null;setPoker:React.Dispatch<React.SetStateAction<PokerGame|null>>;pokerShown:string;setPokerShown:React.Dispatch<React.SetStateAction<string>>;switchTarget:TableMode|'blackjack'|null;requestSwitch:(target:TableMode|'blackjack')=>void;enterMode:(target:TableMode)=>void;}|null>(null);
export function TableGameProvider({children}:{children:React.ReactNode}) {
 const {go}=useNav();
 const [pokerStartingChips,setPokerStartingChips]=useState(1000);
 const [pokerName,setPokerName]=useState('');
 const [pokerShown,setPokerShown]=useState('');
 const [mode,setMode]=useState<TableMode>('domino');const [poker,setPoker]=useState<PokerGame|null>(null);const [switchTarget,setSwitchTarget]=useState<TableMode|'blackjack'|null>(null);
 const {lang}=useI18n();const es=lang==='es';const target=switchTarget==='blackjack'?'Blackjack':switchTarget==='poker'?(es?'póker':'poker'):(es?'dominó':'dominoes');
 return <Context.Provider value={{pokerStartingChips,setPokerStartingChips,pokerName,setPokerName,mode,poker,setPoker,pokerShown,setPokerShown,switchTarget,requestSwitch:setSwitchTarget,enterMode:target=>{setSwitchTarget(null);setMode(target);}}}>{children}
 <Modal visible={switchTarget!==null} transparent animationType="fade" onRequestClose={()=>setSwitchTarget(null)}><View style={{flex:1,backgroundColor:'rgba(2,12,10,.84)',justifyContent:'center',padding:26}}><View accessibilityViewIsModal style={{backgroundColor:C.surface,borderRadius:24,padding:24,borderWidth:1,borderColor:C.line,gap:18}}>
 <Text style={{color:C.ivory,fontSize:23,fontWeight:'600'}}>{es?`¿Quieres cambiar a ${target}?`:`Switch to ${target}?`}</Text>
 <Text style={{color:C.muted,fontSize:15,lineHeight:23}}>{es?'Tu partida actual quedará pausada para continuar al volver.':'Your current game will pause so you can continue when you return.'}</Text>
 <View style={{flexDirection:'row',gap:12}}><Pressable accessibilityRole="button" onPress={()=>setSwitchTarget(null)} style={{flex:1,padding:15,borderRadius:12,backgroundColor:C.raised,alignItems:'center'}}><Text style={{color:C.ivory}}>{es?'Cancelar':'Cancel'}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{if(switchTarget==='blackjack')go('blackjackLobby');else if(switchTarget)setMode(switchTarget);setSwitchTarget(null);}} style={{flex:1,padding:15,borderRadius:12,backgroundColor:C.gold,alignItems:'center'}}><Text style={{color:C.background,fontWeight:'700'}}>{es?'Cambiar':'Switch'}</Text></Pressable></View>
 </View></View></Modal></Context.Provider>;
}
export function useTableGame(){const value=useContext(Context);if(!value)throw Error('TableGameProvider required');return value;}
export function GameSwitchButton({disabled=false,blackjack=false}:{disabled?:boolean;blackjack?:boolean}) {
 const {mode,requestSwitch}=useTableGame();const {lang}=useI18n();const es=lang==='es';const poker=mode==='domino';
 return <Pressable testID="table-game-switch" accessibilityRole="button" accessibilityLabel={blackjack?(es?'Abrir Blackjack':'Open Blackjack'):poker?(es?'Cambiar a póker':'Switch to poker'):(es?'Cambiar a dominó':'Switch to dominoes')} disabled={disabled} onPress={()=>requestSwitch(blackjack?'blackjack':poker?'poker':'domino')} style={{minHeight:66,paddingVertical:6,paddingHorizontal:2,borderRadius:12,backgroundColor:'rgba(8,29,27,.42)',borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center',gap:3,opacity:disabled?.4:1}}>
 {(blackjack||poker)?<CardGameIcon blackjack={blackjack}/>:<View style={{height:36,width:58,alignItems:'center',justifyContent:'center'}}><DominoFan/></View>}<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{fontSize:9,fontWeight:'600',color:C.goldLight}}>{blackjack?'BLACKJACK':poker?'POKER':'DOMINO'}</Text></Pressable>;
}

/** Ivory-and-gold fan inspired by the existing Social Club logo. */
function DominoFan() {
 return <Svg width={54} height={35} viewBox="0 0 64 42" accessible={false}>
  {[-48,48,-25,25,0].map((angle,index)=><G key={angle} rotation={angle} origin="32,38">
   <Rect x={24} y={3} width={17} height={34} rx={3} fill="#91703E"/>
   <Rect x={23} y={2} width={17} height={34} rx={3} fill="#F6E7BF" stroke="#D8B978" strokeWidth={1}/>
   <Line x1={25} y1={19} x2={38} y2={19} stroke="#61482D" strokeWidth={1}/>
   {(index===4?[[27,8],[35,8],[27,14],[35,14],[27,24],[35,24],[27,30],[35,30]]:[[27,8],[35,14],[31,25],[35,30]]).map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r={1.65} fill="#17291F"/>)}
  </G>)}
 </Svg>;
}

function CardGameIcon({blackjack}:{blackjack:boolean}){
 const cards=blackjack?[{rank:'A',suit:'s' as const,red:false,x:13,angle:-12},{rank:'J',suit:'h' as const,red:true,x:31,angle:12}]:[{rank:'Q',suit:'d' as const,red:true,x:5,angle:-18},{rank:'K',suit:'c' as const,red:false,x:23,angle:0},{rank:'A',suit:'s' as const,red:false,x:41,angle:18}];
 return <Svg width={64} height={39} viewBox="0 0 76 46" accessible={false}>
 {cards.map(c=><G key={c.rank} rotation={c.angle} origin={`${c.x+11},26`}><Rect x={c.x} y={5} width={23} height={34} rx={3} fill="#F8F2E4" stroke="#C8B98F" strokeWidth={0.8}/><SvgText x={c.x+4} y={16} fontSize={8.5} fontFamily="sans-serif" fontWeight="bold" fill={c.red?'#A12D35':'#142C24'}>{c.rank}</SvgText><CardSuit suit={c.suit} x={c.x+11.5} y={28} size={12} color={c.red?'#A12D35':'#142C24'}/></G>)}
 </Svg>;
}
