import React, {useEffect, useId, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Text, View} from 'react-native';
import Svg, {Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText} from 'react-native-svg';
import {TrackingStyle} from '../state/trackingAppearanceStore';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const point = (degrees: number, radius: number) => ({
  x:100 + Math.sin(degrees*Math.PI/180)*radius,
  y:100 - Math.cos(degrees*Math.PI/180)*radius,
});

/** A tracking-only dial. Style/color changes keep the animated values and scoring data intact. */
export function TrackingCounter({style, score, target, remaining, color, size, pulse, intensity, label}: {
  style: TrackingStyle; score: number; target: number; remaining: number;
  color: string; size: number; pulse: boolean; intensity: number; label: string;
}) {
  const id = 'tracking-face-' + useId().replace(/[^a-zA-Z0-9]/g,'');
  const [shown, setShown] = useState(score);
  const [reduced, setReduced] = useState(false);
  const count = useRef(new Animated.Value(score)).current;
  const progress = useRef(new Animated.Value(target>0?Math.min(1,Math.max(0,score/target)):0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const beat = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  const fraction = target>0?Math.min(1,Math.max(0,score/target)):0;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {if(active)setReduced(value);}).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
    return () => {active=false;subscription.remove();};
  }, []);
  useEffect(() => {
    count.stopAnimation();
    if(reduced){count.setValue(score);setShown(score);return;}
    const listener = count.addListener(({value})=>setShown(Math.round(value)));
    Animated.timing(count,{toValue:score,duration:650,easing:Easing.out(Easing.cubic),useNativeDriver:false})
      .start(({finished})=>{if(finished)setShown(score);});
    return () => {count.removeListener(listener);count.stopAnimation();};
  }, [score,reduced,count]);
  useEffect(() => {
    Animated.timing(progress,{toValue:fraction,duration:reduced?0:700,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
    return () => progress.stopAnimation();
  }, [fraction,reduced,progress]);
  useEffect(() => {
    if(first.current){first.current=false;return;}
    if(reduced){pop.setValue(1);return;}
    const animation=Animated.sequence([
      Animated.timing(pop,{toValue:1.14,duration:130,easing:Easing.out(Easing.quad),useNativeDriver:true}),
      Animated.spring(pop,{toValue:1,friction:4,useNativeDriver:true}),
    ]);
    animation.start();return()=>{animation.stop();pop.setValue(1);};
  }, [score,reduced,pop]);
  useEffect(() => {
    if(!pulse||reduced){beat.setValue(1);return;}
    const k=Math.min(1,Math.max(0,intensity));
    const animation=Animated.loop(Animated.sequence([
      Animated.timing(beat,{toValue:1.22+.16*k,duration:150-70*k,easing:Easing.out(Easing.quad),useNativeDriver:true}),
      Animated.timing(beat,{toValue:1,duration:150-60*k,easing:Easing.in(Easing.quad),useNativeDriver:true}),
      Animated.timing(beat,{toValue:1+.12+.1*k,duration:120-50*k,useNativeDriver:true}),
      Animated.timing(beat,{toValue:1,duration:170-70*k,useNativeDriver:true}),Animated.delay(750-650*k),
    ]));
    animation.start();return()=>{animation.stop();beat.setValue(1);};
  }, [pulse,intensity,reduced,beat]);

  const path = style==='speedometer'
    ? 'M34.946 165.054 A92 92 0 1 1 165.054 165.054'
    : style==='orbital' ? 'M100 38 A85 62 0 1 1 99.999 38 Z'
    : 'M100 27 A73 73 0 1 1 99.999 27 Z';
  const length = style==='speedometer' ? Math.PI*92*1.5
    : style==='orbital' ? Math.PI*(3*(85+62)-Math.sqrt((3*85+62)*(85+3*62)))
    : Math.PI*146;
  const offset = progress.interpolate({inputRange:[0,1],outputRange:[length,0]});
  const needle = progress.interpolate({inputRange:[0,1],outputRange:[-135,135]});
  const speedometer = style==='speedometer';
  const orbital = style==='orbital';

  return <View accessible accessibilityRole="progressbar" accessibilityLabel={`${label}: ${score} / ${target}`} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(score,target)} aria-valuetext={`${score} / ${target}`}
    accessibilityValue={{min:0,max:target,now:Math.min(score,target),text:`${score} / ${target}`}}
    style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Svg pointerEvents="none" accessible={false} width={size} height={size} viewBox="0 0 200 200" style={{position:'absolute',top:0,left:0}}>
      <Defs><RadialGradient id={id} cx={0.34} cy={0.24} r={0.78}><Stop offset={0} stopColor="#2B3540"/><Stop offset={0.65} stopColor="#151D26"/><Stop offset={1} stopColor="#050A10"/></RadialGradient></Defs>
      {orbital ? <>
        <Ellipse cx={100} cy={100} rx={99} ry={65} rotation={-16} origin="100,100" fill="#182638" stroke="#7399AC" strokeWidth={2}/>
        <Ellipse cx={100} cy={100} rx={91} ry={61} rotation={16} origin="100,100" fill="none" stroke={color} strokeWidth={2} opacity={.5}/>
        <Ellipse cx={100} cy={100} rx={77} ry={54} fill={`url(#${id})`} stroke="#526C80" strokeWidth={2}/>
      </> : <>
        <Circle cx={100} cy={100} r={98} fill={speedometer?'#293039':'#0B141B'} stroke="#75818B" strokeWidth={1.5}/>
        <Circle cx={100} cy={100} r={speedometer?90:84} fill={`url(#${id})`} stroke="#050A10" strokeWidth={3}/>
        {Array.from({length:speedometer?21:40},(_,i)=>{
          const major=i%5===0,angle=speedometer?-135+i*13.5:i*9;
          const a=point(angle,speedometer?(major?70:78):(major?91:94));
          const b=point(angle,speedometer?85:98);
          return <Line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major?(speedometer?'#F5F0E4':color):'#657682'} strokeWidth={major?1.8:1}/>;
        })}
        {speedometer ? [25,50,75].map(value=>{const p=point(-135+value*2.7,56);return <SvgText key={value} x={p.x} y={p.y+5} textAnchor="middle" fill="#E9E7DF" fontSize={14}>{Math.round(target*value/100)}</SvgText>;})
          : <Circle cx={100} cy={100} r={60} fill="#111A23" stroke="#53616B" strokeWidth={2}/>}
      </>}
      <Path d={path} fill="none" stroke="#30404D" strokeWidth={speedometer?5:9}/>
      <AnimatedPath d={path} fill="none" stroke={color} strokeWidth={speedometer?5:9} strokeDasharray={length} strokeDashoffset={offset} strokeLinecap="round"/>
      {speedometer && <>
        {/* Keep the pivot outside AnimatedG: rotation-only native updates omit static origin props. */}
        <G translateX={100} translateY={100}><AnimatedG rotation={needle}><G translateX={-100} translateY={-100}>
          <Path d="M97 101 L98 39 L100 30 L102 39 L103 101 Z" fill={color}/><Line x1={100} y1={100} x2={100} y2={43} stroke="#FFF4D8" strokeWidth={1} opacity={.7}/>
        </G></AnimatedG></G>
        <Circle cx={100} cy={100} r={6} fill="#ADB8C0" stroke="#091018" strokeWidth={2}/>
        <Rect x={50} y={125} width={100} height={52} rx={9} fill="#0B131B" stroke="#43505C"/>
      </>}
    </Svg>
    <Animated.View pointerEvents="none" style={{position:'absolute',top:size*(speedometer?.63:.32),left:0,right:0,alignItems:'center',transform:[{scale:pop}]}}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.5} style={{color,fontSize:size*(speedometer?.205:orbital?.26:.29),fontWeight:'900',lineHeight:size*(speedometer?.23:orbital?.27:.31),fontVariant:['tabular-nums'],textShadowColor:'#000',textShadowOffset:{width:0,height:2},textShadowRadius:3}}>{shown}</Text>
      {!speedometer && <Animated.Text style={{color:pulse?color:'#AEB9C3',fontSize:size*.12,lineHeight:size*.145,fontWeight:'800',transform:[{scale:beat}]}}>{remaining}</Animated.Text>}
    </Animated.View>
    {speedometer && <Animated.Text style={{position:'absolute',top:size*.87,color:pulse?color:'#AEB9C3',fontSize:size*.1,lineHeight:size*.12,fontWeight:'800',transform:[{scale:beat}]}}>{remaining}</Animated.Text>}
  </View>;
}

export function trackingButtonGradient(style: TrackingStyle, color: string): [string,string,string] {
  const green=color==='#65C59A',blue=color==='#68B9F5',red=color==='#AA463B';
  if(style==='speedometer') return green?['#4EB482',color,'#369A6B']:blue?['#438DC1','#C2E5FF','#397DB3']:red?['#602D27',color,'#6D2A24']:['#D2AF63','#FFE8A6','#B99240'];
  if(style==='orbital') return green?['#A5E6AB',color,'#80CAD3']:blue?['#A8F0EC','#82C5FF','#8FA3E4']:red?['#B65347',color,'#82403A']:['#F2D095','#E8B957','#BD824E'];
  return green?['#AFF0CB',color,'#217F54']:blue?['#B9E3FF',color,'#276DAA']:red?['#BC564B',color,'#5E1F1A']:['#FFE6A1',color,'#95651F'];
}
