import React,{useEffect,useRef} from 'react';
import {Animated,PanResponder} from 'react-native';
import {useReducedMotion} from '../computer/DrinkGift';
import {dragTilt,shouldTilt} from './tableTilt';
/** Center-pivot presentation only; game controls and chip trays sit outside. */
export function TiltSurface({children,testID,enabled=true}:{children:React.ReactNode;testID:string;enabled?:boolean}){
 const reduced=useReducedMotion();const flags=useRef({enabled,reduced});flags.current={enabled,reduced};
 const angle=useRef(new Animated.Value(6)).current;const state=useRef({angle:6,start:6,moved:false});
 const pan=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>false,
  onMoveShouldSetPanResponderCapture:(_,g)=>flags.current.enabled&&shouldTilt(g),
  onPanResponderGrant:()=>{state.current.start=state.current.angle;state.current.moved=false;angle.stopAnimation(v=>{if(!state.current.moved)state.current.start=v;});},
  onPanResponderMove:(_,g)=>{if(!flags.current.enabled)return;state.current.moved=true;const target=dragTilt(state.current.start,g.dy);state.current.angle=target;if(flags.current.reduced)angle.setValue(target);else Animated.timing(angle,{toValue:target,duration:90,useNativeDriver:true}).start();},
  onPanResponderRelease:(_,g)=>{if(!flags.current.enabled)return;state.current.moved=true;const target=dragTilt(state.current.start,g.dy);state.current.angle=target;if(flags.current.reduced)angle.setValue(target);else Animated.timing(angle,{toValue:target,duration:90,useNativeDriver:true}).start();},
  onPanResponderTerminationRequest:()=>true,
 } )).current;
 useEffect(()=>()=>angle.stopAnimation(),[angle]);
 return <Animated.View testID={testID} {...pan.panHandlers} style={{flex:1,minHeight:0,transformOrigin:'center',transform:[{perspective:1000},{rotateX:angle.interpolate({inputRange:[0,20],outputRange:['0deg','20deg'],extrapolate:'clamp'})},{scale:angle.interpolate({inputRange:[0,20],outputRange:[1,.92],extrapolate:'clamp'})}]}}>{children}</Animated.View>;
}
