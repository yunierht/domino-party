import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing} from 'react-native';
import {ClassicPlayingCard} from './ClassicPlayingCard';
/** Artistic table emblem, never a card added to either hand. */
export function NaturalCardAccent({paused,reduced:override,victory=false}:{paused:boolean;reduced?:boolean;victory?:boolean}){
 const arc=useRef(new Animated.Value(0)).current;const [preference,setPreference]=useState(true);const reduced=override??preference;
 useEffect(()=>{if(override!==undefined)return;let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setPreference(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setPreference);return()=>{alive=false;sub.remove();};},[override]);
 useEffect(()=>{arc.setValue(0);if(paused||reduced)return;const animation=Animated.timing(arc,{toValue:1,duration:1500,easing:Easing.inOut(Easing.quad),useNativeDriver:true});animation.start();return()=>animation.stop();},[paused,reduced,arc]);
 return <Animated.View testID="blackjack-natural-card-accent" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:64,opacity:paused?0:reduced?.8:arc.interpolate({inputRange:[0,.08,.94,1],outputRange:[0,1,1,0]}),transform:[{translateY:reduced?0:arc.interpolate({inputRange:[0,.4,.6,.88,1],outputRange:[0,-35,-38,0,0]})},{rotate:reduced?'0deg':arc.interpolate({inputRange:[0,.4,.6,.88,1],outputRange:['0deg','-8deg','12deg','0deg','0deg']})},{scale:reduced?1:arc.interpolate({inputRange:[0,.4,.6,.88,1],outputRange:[1,1.2,1.22,1,1]})}]}}>
 <ClassicPlayingCard card={{rank:14,suit:'s'}} width={64} animate={false} highlight={victory}/>
 </Animated.View>;
}
