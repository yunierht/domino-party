import {useEffect,useRef,useState} from 'react';
import {Animated,AppState} from 'react-native';
import {useReducedMotion} from '../computer/DrinkGift';
import {useTableVisible} from './GameSettingsBoundary';
/** Expiry draws attention visually; timers never own audio or haptic feedback. */
export function useExpiredTurnPulse(expired:boolean){
 const visible=useTableVisible(),reduced=useReducedMotion(),pulse=useRef(new Animated.Value(0)).current;
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{pulse.stopAnimation();pulse.setValue(0);if(!expired||!visible||!foreground||reduced)return;const animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:450,useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:650,useNativeDriver:true})]));animation.start();return()=>{animation.stop();pulse.stopAnimation();pulse.setValue(0);};},[expired,visible,foreground,reduced,pulse]);
 return{transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[1,1.04]})}]};
}
