import React,{useEffect,useRef} from 'react';
import {Animated} from 'react-native';
import {useReducedMotion} from '../computer/DrinkGift';
import {PokerContinuation} from './PokerContinuation';
export function PulseContinuation(props:React.ComponentProps<typeof PokerContinuation>){
 const scale=useRef(new Animated.Value(1)).current;const reduced=useReducedMotion();
 useEffect(()=>{scale.setValue(1);if(reduced||props.blocked)return;const motion=Animated.loop(Animated.sequence([Animated.timing(scale,{toValue:1.035,duration:450,useNativeDriver:true}),Animated.timing(scale,{toValue:1,duration:450,useNativeDriver:true}),Animated.delay(350)]));motion.start();return()=>{motion.stop();scale.setValue(1);};},[reduced,props.blocked,scale]);
 return <Animated.View style={{flex:1,transform:[{scale}]}}><PokerContinuation {...props}/></Animated.View>;
}
