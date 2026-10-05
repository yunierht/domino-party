import React, {useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,View} from 'react-native';
import Svg,{Defs,Pattern,Rect,Path,G,Circle,LinearGradient,Stop,Text as SvgText} from 'react-native-svg';
import type {Card} from './engine';
const symbols={s:'♠',h:'♥',d:'♦',c:'♣'};
const pipLayouts:Record<number,number[][]>={
 2:[[.5,.24],[.5,.76]],3:[[.5,.24],[.5,.5],[.5,.76]],
 4:[[.32,.24],[.68,.24],[.32,.76],[.68,.76]],
 5:[[.32,.24],[.68,.24],[.5,.5],[.32,.76],[.68,.76]],
 6:[[.32,.24],[.68,.24],[.32,.5],[.68,.5],[.32,.76],[.68,.76]],
 7:[[.32,.24],[.68,.24],[.5,.37],[.32,.5],[.68,.5],[.32,.76],[.68,.76]],
 8:[[.32,.24],[.68,.24],[.5,.37],[.32,.5],[.68,.5],[.5,.63],[.32,.76],[.68,.76]],
 9:[[.32,.22],[.68,.22],[.32,.4],[.68,.4],[.5,.5],[.32,.6],[.68,.6],[.32,.78],[.68,.78]],
 10:[[.32,.22],[.68,.22],[.5,.31],[.32,.4],[.68,.4],[.32,.6],[.68,.6],[.5,.69],[.32,.78],[.68,.78]]
};
export function CardSuit({suit,x,y,size,color,flip=false}:{suit:Card['suit'];x:number;y:number;size:number;color:string;flip?:boolean}){
 const paths={h:'M10 18C7 15 0 10 0 5C0-1 8-2 10 4C12-2 20-1 20 5C20 10 13 15 10 18Z',d:'M10 0L19 10L10 20L1 10Z',s:'M10 0C7 4 0 8 0 12C0 18 7 18 9 14L7 20H13L11 14C13 18 20 18 20 12C20 8 13 4 10 0Z',c:'M10 0C3 0 3 8 7 10C0 5-3 15 3 17C6 18 8 16 9 14L7 20H13L11 14C12 17 17 19 20 14C23 8 15 6 13 10C17 7 17 0 10 0Z'};
 return <G transform={`translate(${x} ${y}) rotate(${flip?180:0}) scale(${size/20}) translate(-10 -10)`}><Path d={paths[suit]} fill={color}/></G>;
}
export function PlayingCard({card,highlight=false,back=false,width=52,delay=0,originY=-100,originX=0,animate=true,onLanded,faceArtwork}:{card?:Card;highlight?:boolean;back?:boolean;width?:number;delay?:number;originY?:number;originX?:number;animate?:boolean;onLanded?:()=>void;faceArtwork?:React.ReactNode}) {
 const value=useRef(new Animated.Value(animate?0:1)).current;const [reduced,setReduced]=useState<boolean|null>(null);
 const landedCallback=useRef(onLanded);landedCallback.current=onLanded;
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});return()=>{alive=false;};},[]);
 useEffect(()=>{
  if(!card&&!back){value.setValue(1);return;}
  if(!animate){value.setValue(1);landedCallback.current?.();return;}
  if(reduced===null){value.setValue(0);return;}
  if(reduced){value.setValue(1);landedCallback.current?.();return;}
  value.setValue(0);let active=true;
  const a=Animated.timing(value,{toValue:1,duration:240,delay,useNativeDriver:true});
  a.start(({finished})=>{if(active&&finished)landedCallback.current?.();});
  return()=>{active=false;a.stop();};
 },[value,reduced,delay,animate,card?.rank,card?.suit,back]);
 const names:Record<number,string>={11:'J',12:'Q',13:'K',14:'A'};const rank=card?(names[card.rank]??String(card.rank)):'';const color=card&&(card.suit==='h'||card.suit==='d')?'#A1313F':'#142E29';
 return <Animated.View accessibilityLabel={back?'Hidden card':card?`${rank} ${symbols[card.suit]}`:'Empty community card'} style={{width,height:width*1.43,borderRadius:7,backgroundColor:back?'#FAF4E7':card?'#F8F1DF':'rgba(2,20,14,.17)',borderWidth:highlight?2:1,borderColor:highlight?'#E9C873':card||back?'#DDC999':'rgba(220,201,153,.25)',opacity:value,transform:[{translateX:value.interpolate({inputRange:[0,1],outputRange:[originX,0]})},{translateY:value.interpolate({inputRange:[0,.4,1],outputRange:[originY,originY-7,0]})},{rotate:value.interpolate({inputRange:[0,1],outputRange:['-7deg','0deg']})}],boxShadow:highlight?'0px 0px 7px rgba(233,200,115,.6)':card||back?'0px 3px 5px rgba(0,0,0,.22)':undefined}}>
 {back?<View style={{flex:1,margin:Math.max(1,width*.035),borderWidth:.5,borderColor:'#A52838',borderRadius:Math.max(2,width*.06),overflow:'hidden'}}><Svg width="100%" height="100%"><Defs><Pattern id="woven" width="8" height="8" patternUnits="userSpaceOnUse"><Rect width="8" height="8" fill="#98283B"/><Path d="M4 0L8 4L4 8L0 4Z" stroke="#F4DED0" strokeWidth={0.6} fill="none"/><Path d="M3 4H5M4 3V5" stroke="#F4DED0" strokeWidth={0.6}/></Pattern></Defs><Rect width="100%" height="100%" fill="url(#woven)"/></Svg></View>:card?faceArtwork??<Svg width="100%" height="100%" viewBox="0 0 100 143">
 <Defs>
 <LinearGradient id="cardPaperShade" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFFEF6"/><Stop offset={0.55} stopColor="#F8F3E7"/><Stop offset="1" stopColor="#EBE2CE"/></LinearGradient>
 <Pattern id="cardPaperGrain" width="6" height="7" patternUnits="userSpaceOnUse"><Circle cx="1" cy="2" r={0.45} fill="#87734F" opacity={0.19}/><Circle cx="4.5" cy="5" r={0.35} fill="#87734F" opacity={0.14}/><Path d="M.5 5.5l1.2-.3M3 1l1 .2" stroke="#C2B69B" strokeWidth={0.35} opacity={0.22}/><Path d="M2 4h1M4 1h.7" stroke="#FFFFFF" strokeWidth={0.4} opacity={0.6}/></Pattern>
 </Defs>
 <Rect width="100" height="143" rx="6" fill="url(#cardPaperShade)"/><Rect width="100" height="143" rx="6" fill="url(#cardPaperGrain)"/>

 <Rect x="1" y="1" width="98" height="141" rx="6" fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={0.7}/>
 {[false,true].map(bottom=><G key={String(bottom)} transform={bottom?'translate(100 143) rotate(180)':undefined}><SvgText x="12" y="21" textAnchor="middle" fill={color} fontSize="18" fontFamily="sans-serif" fontWeight="bold">{rank}</SvgText><CardSuit suit={card.suit} x={12} y={38} size={11} color={color}/></G>)}
 {pipLayouts[card.rank]?pipLayouts[card.rank].map(([x,y],i)=><CardSuit key={i} suit={card.suit} x={x*100} y={y*143} size={card.rank>=7?15:19} color={color} flip={y>.5}/>):card.rank===14?<CardSuit suit={card.suit} x={50} y={71.5} size={40} color={color}/>:<G><Rect x="26" y="30" width="48" height="83" rx="2" fill="#EEE4CF" stroke="#B69B62" strokeWidth={0.8}/><Path d="M32 50L30 38L39 43L50 34L61 43L70 38L68 50Z" fill="#B69B62" stroke={color} strokeWidth={0.7}/><SvgText x="50" y="75" textAnchor="middle" fill={color} fontSize="25" fontFamily="sans-serif" fontWeight="bold">{rank}</SvgText><CardSuit suit={card.suit} x={50} y={99} size={16} color={color} flip/></G>}
 </Svg>:null}</Animated.View>;
}
