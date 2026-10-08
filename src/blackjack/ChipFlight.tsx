import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Text,View} from 'react-native';
import {ChipStack} from '../poker/CasinoChip';
import {DenominationChip} from './BettingTray';
import {useChipSound} from './useChipSound';
export type Point={x:number;y:number};
export type Flight={id:number;amount:number;kind:'bet'|'win';from:Point;to:Point;landingScale?:number;facingPlayer?:boolean;rackDenomination?:number;holdUntilLanding?:boolean};
export function ChipFlight({flight,paused,sound=false,onComplete,onProgress}:{flight:Flight;paused:boolean;sound?:boolean;onComplete:()=>void;onProgress?:(p:number)=>void}){
 useChipSound(flight.id,flight.kind,sound,paused);
 const value=useRef(new Animated.Value(0)).current;const callbacks=useRef({onComplete,onProgress});callbacks.current={onComplete,onProgress};
 const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{if(alive)setReduced(true);});return()=>{alive=false;};},[]);
 useEffect(()=>{
  if(paused||reduced===null)return;
  if(reduced){callbacks.current.onProgress?.(1);callbacks.current.onComplete();return;}
  let alive=true;const listener=value.addListener(({value:p})=>{if(alive)callbacks.current.onProgress?.(p);});
  const animation=Animated.timing(value,{toValue:1,duration:flight.kind==='win'?1100:420,easing:Easing.out(Easing.cubic),useNativeDriver:true});
  animation.start(({finished})=>{if(alive&&finished){callbacks.current.onProgress?.(1);callbacks.current.onComplete();}});
  return()=>{alive=false;value.removeListener(listener);animation.stop();};
 },[flight.id,paused,reduced,value]);
 return <Animated.View pointerEvents="none" testID={`blackjack-${flight.kind}-flight`} style={{position:'absolute',zIndex:30,left:flight.from.x-(flight.kind==='bet'||flight.rackDenomination!==undefined?25:34),top:flight.from.y-(flight.kind==='bet'||flight.rackDenomination!==undefined?21:22),opacity:value.interpolate({inputRange:[0,.85,1],outputRange:flight.kind==='bet'&&flight.holdUntilLanding?[1,1,1]:[1,1,0]}),transform:[{translateX:value.interpolate({inputRange:[0,1],outputRange:[0,flight.to.x-flight.from.x]})},{translateY:value.interpolate({inputRange:[0,.35,1],outputRange:[0,(flight.to.y-flight.from.y)*.35-35,flight.to.y-flight.from.y]})},{scale:value.interpolate({inputRange:[0,.25,1],outputRange:flight.kind==='bet'?[.92,1.08,flight.landingScale??.92]:[.8,1.18,flight.landingScale??.75]})}]}}>
 {flight.kind==='win'&&flight.rackDenomination===undefined&&<View style={{position:'absolute',left:-12,top:-12,width:92,height:70,borderRadius:35,backgroundColor:'rgba(233,200,115,.16)',borderWidth:1,borderColor:'rgba(255,225,139,.45)'}}/>}
 {flight.kind==='bet'||flight.rackDenomination!==undefined?<DenominationChip amount={flight.amount} facingPlayer={flight.facingPlayer??true}/>:<ChipStack amount={flight.amount} piles/>}{flight.kind==='win'&&flight.rackDenomination===undefined&&<Text style={{color:'#F1DEB3',fontWeight:'800',textAlign:'center'}}>+{flight.amount}</Text>}
 </Animated.View>;
}
