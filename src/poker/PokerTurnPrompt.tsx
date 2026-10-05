import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated} from 'react-native';
/** Wait3600ms first, then one gentle beat every3600ms while human action is pending. */
export function PokerTurnPrompt({active,label}:{active:boolean;label:string}){
 const pulse=useRef(new Animated.Value(1)).current;const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{pulse.setValue(1);if(!active||reduced!==false)return;const animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1.07,duration:210,useNativeDriver:true}),Animated.timing(pulse,{toValue:1,duration:210,useNativeDriver:true}),Animated.delay(3180)]));const initialWait=setTimeout(()=>animation.start(),3600);return()=>{clearTimeout(initialWait);animation.stop();};},[active,reduced,pulse]);
 return <Animated.Text testID="poker-turn-prompt" accessibilityLiveRegion="polite" style={{color:'#F5F0E4',fontSize:18,fontWeight:'600',textAlign:'center',transform:[{scale:pulse}]}}>{label}</Animated.Text>;
}
