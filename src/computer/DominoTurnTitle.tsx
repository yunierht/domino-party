import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Text} from 'react-native';
/** Pulse only the current title; status text remains visible while inactive. */
export function DominoTurnTitle({active,label,compact=false,children}:{active:boolean;label?:string;compact?:boolean;children?:React.ReactNode}){
 const pulse=useRef(new Animated.Value(1)).current;const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{pulse.setValue(1);if(!active||reduced!==false)return;const animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1.07,duration:210,useNativeDriver:true}),Animated.timing(pulse,{toValue:1,duration:210,useNativeDriver:true}),Animated.delay(3180)]));const timer=setTimeout(()=>animation.start(),3600);return()=>{clearTimeout(timer);animation.stop();};},[active,reduced,pulse]);
 return <Animated.View testID="domino-turn-title" pointerEvents="none" accessibilityLiveRegion="polite" style={{marginTop:compact?4:0,transform:[{scale:pulse}]}}>{children??<Text testID={active&&reduced===false?'domino-attention-pulsing':'domino-attention-static'} numberOfLines={1} adjustsFontSizeToFit style={{color:'#F5F0E4',fontSize:compact?11:18,lineHeight:compact?14:20,fontWeight:'600',textAlign:'center'}}>{label}</Text>}</Animated.View>;
}
