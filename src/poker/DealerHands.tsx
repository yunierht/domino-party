import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,View} from 'react-native';
import {playCardDeal} from '../sound/sounds';
import {useReducedMotion} from '../computer/DrinkGift';
/** A short card-release gesture; the hand leaves the playing surface afterward. */
export function DealerHands({active,anchor,sound=false,delay=0,cardWidth=52,releaseX=36,releaseY=-18}:{active:boolean;sound?:boolean;anchor:React.RefObject<View|null>;delay?:number;cardWidth?:number;releaseX?:number;releaseY?:number}){
 const base=useRef<View>(null);
 const [origin,setOrigin]=useState<{x:number;y:number}|null>(null);
 useEffect(()=>{
  setOrigin(null);if(!active)return;
  let cancelled=false;
  const frame=requestAnimationFrame(()=>anchor.current?.measureInWindow((ax,ay)=>base.current?.measureInWindow((bx,by)=>{
   if(!cancelled)setOrigin({x:ax-bx-cardWidth/2-releaseX,y:ay-by-cardWidth*.715-releaseY});
  })));
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[active,anchor,cardWidth,releaseX,releaseY]);
 const motion=useRef(new Animated.Value(0)).current;const reduced=useReducedMotion();
 useEffect(()=>{
  motion.setValue(0);if(!active||reduced||!origin)return;
  const strokes=Array.from({length:1},()=>Animated.sequence([Animated.timing(motion,{toValue:1,duration:500,easing:Easing.linear,useNativeDriver:true}),Animated.timing(motion,{toValue:0,duration:0,useNativeDriver:true})]));
  const animation=Animated.sequence([Animated.delay(delay),...strokes]);animation.start();return()=>{animation.stop();motion.setValue(0);};
 },[active,delay,reduced,motion,origin]);
 useEffect(()=>{
  if(!active||!sound)return;
  let stop:(()=>void)|undefined;
  const timer=setTimeout(()=>{stop=playCardDeal();},delay+240);
  return()=>{clearTimeout(timer);stop?.();};
 },[active,sound,delay]);
 if(!active||reduced)return null;
 return <View ref={base} collapsable={false} pointerEvents="none" style={{position:'absolute',left:0,top:0,width:1,height:1,zIndex:20}}><Animated.View pointerEvents="none" accessible={false} style={{position:'absolute',left:cardWidth/2-32+releaseX,top:cardWidth*.715-78+releaseY,width:145,height:96,zIndex:20,opacity:motion.interpolate({inputRange:[0,.16,.7,1],outputRange:[0,1,1,0]}),transform:[{translateX:motion.interpolate({inputRange:[0,.25,.48,.62,1],outputRange:[origin?.x??0,(origin?.x??0)*.2,0,0,origin?.x??0]})},{translateY:motion.interpolate({inputRange:[0,.25,.48,.62,1],outputRange:[origin?.y??0,(origin?.y??0)*.2,0,0,origin?.y??0]})},{rotate:motion.interpolate({inputRange:[0,.25,.48,.62,1],outputRange:['10deg','4deg','0deg','-4deg','8deg']})}]}}><View style={{width:145,height:96,overflow:'hidden'}}>{[0,1,2,3].map((frame)=><Animated.View key={frame} style={{position:'absolute',width:145,height:96,overflow:'hidden',opacity:motion.interpolate({inputRange:frame===0?[0,.25,.32,1]:frame===1?[0,.25,.32,.43,.49,1]:frame===2?[0,.43,.49,.57,.64,1]:[0,.57,.64,1],outputRange:frame===0?[1,1,0,0]:frame===3?[0,0,1,1]:[0,0,1,1,0,0]})}}><Image source={require('../../assets/poker-dealing-poses-v2.png')} resizeMode="stretch" style={{position:'absolute',width:580,height:193.33,left:-145*frame,top:-45}}/></Animated.View>)}</View></Animated.View></View>;
}
