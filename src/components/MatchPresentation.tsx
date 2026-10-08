import React,{useId} from 'react';
import {View} from 'react-native';
import Svg,{Circle,Defs,Ellipse,G,LinearGradient as SvgGradient,Line,Path,Rect,Stop} from 'react-native-svg';
import {LinearGradient} from 'expo-linear-gradient';

/** Decorative scorekeeper-only token; does not intercept scoring or form controls. */
export function MatchTeamBadge({color,size=48}:{color:string;size?:number}){
 const id='scorebadge'+useId().replace(/[^a-zA-Z0-9]/g,'');
 return <View pointerEvents="none" accessible={false} style={{width:size,height:size}}><Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
  <Defs><SvgGradient id={id+'metal'} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF6D7"/><Stop offset="0.24" stopColor={color}/><Stop offset="0.65" stopColor="#302B25"/><Stop offset="1" stopColor={color}/></SvgGradient><SvgGradient id={id+'ivory'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFFDF5"/><Stop offset="1" stopColor="#DCD5C5"/></SvgGradient></Defs>
  <Ellipse cx={32} cy={58} rx={24} ry={4} fill="#000" opacity={.35}/><Circle cx={32} cy={30} r={27} fill={'url(#'+id+'metal)'} stroke="#171B1B" strokeWidth={1}/><Circle cx={32} cy={30} r={23} fill="#152520" stroke={color} strokeWidth={1}/><Path d="M12 23A23 23 0 0 1 39 9" fill="none" stroke="#FFF8DE" opacity={.35} strokeWidth={1.2}/>
  {[-15,15].map((angle,i)=><G key={angle} rotation={angle} origin="32,45" transform={`translate(${i?7:-7} 0)`}><Rect x={23} y={14} width={19} height={36} rx={3} fill="#695B43"/><Rect x={21} y={12} width={19} height={36} rx={3} fill={'url(#'+id+'ivory)'} stroke="#C5B995" strokeWidth={.8}/><Line x1={24} y1={30} x2={37} y2={30} stroke="#9B937E" strokeWidth={.65}/><Circle cx={30.5} cy={30} r={1} fill={color}/>{[[26,18],[35,25],[26,35],[35,42],...(i?[[26,25],[35,18]]:[])].map(([cx,cy],n)=><Circle key={n} cx={cx} cy={cy} r={1.8} fill="#20302A"/>)}</G>)}
 </Svg></View>;
}

/** Bevel and rim lighting inside existing panels; no geometry or data changes. */
export function MatchPanelBevel({color,radius=20}:{color:string;radius?:number}){
 return <View pointerEvents="none" accessible={false} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:radius,overflow:'hidden'}}>
  <LinearGradient colors={['rgba(255,255,255,0.14)','rgba(255,255,255,0.015)','rgba(0,0,0,0.26)']} start={{x:0,y:0}} end={{x:.8,y:1}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
  <View style={{position:'absolute',top:2,left:2,right:2,bottom:4,borderRadius:Math.max(2,radius-2),borderWidth:1,borderTopColor:'rgba(255,255,255,0.24)',borderLeftColor:'rgba(255,255,255,0.08)',borderRightColor:'rgba(0,0,0,0.30)',borderBottomColor:'rgba(0,0,0,0.45)'}}/>
  <LinearGradient colors={[color,'rgba(0,0,0,0)']} start={{x:0,y:0}} end={{x:1,y:0}} style={{position:'absolute',top:0,left:20,right:20,height:2,opacity:.8}}/>
 </View>;
}
