import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Text} from 'react-native';
export function TurnPrompt({visible,label}:{visible:boolean;label:string}){
 const pulse=useRef(new Animated.Value(1)).current;const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{pulse.setValue(1);if(!visible||reduced!==false)return;const animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1.07,duration:210,useNativeDriver:true}),Animated.timing(pulse,{toValue:1,duration:210,useNativeDriver:true}),Animated.delay(140),Animated.timing(pulse,{toValue:1.045,duration:170,useNativeDriver:true}),Animated.timing(pulse,{toValue:1,duration:170,useNativeDriver:true}),Animated.delay(900)]));animation.start();return()=>animation.stop();},[visible,reduced,pulse]);
 if(!visible)return null;
 return <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={{alignItems:'center',marginBottom:4,zIndex:16,transform:[{scale:pulse}]}}><Text style={{color:'#ECD6A1',fontSize:16,fontWeight:'700',textAlign:'center'}}>{label}</Text></Animated.View>;
}
