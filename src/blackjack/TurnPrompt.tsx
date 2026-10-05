import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Text} from 'react-native';
export function TurnPrompt({visible,label,attention=false}:{visible:boolean;label:string;attention?:boolean}){
 const pulse=useRef(new Animated.Value(1)).current;const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{pulse.setValue(1);if(!visible||!attention||reduced!==false)return;let animation:ReturnType<typeof Animated.loop>|undefined;const timer=setTimeout(()=>{animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1.07,duration:210,useNativeDriver:true}),Animated.timing(pulse,{toValue:1,duration:210,useNativeDriver:true}),Animated.delay(3180)]));animation.start();},3600);return()=>{clearTimeout(timer);animation?.stop();};},[visible,attention,label,reduced,pulse]);
 if(!visible)return null;
 return <Animated.View testID="blackjack-turn-prompt" pointerEvents="none" accessibilityLiveRegion="polite" style={{alignItems:'center',marginBottom:4,zIndex:16,transform:[{scale:pulse}]}}><Text style={{color:'#F5F0E4',fontSize:18,fontWeight:'600',textAlign:'center'}}>{label}</Text></Animated.View>;
}
