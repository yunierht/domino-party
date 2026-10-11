import {useTableVisible} from '../components/GameSettingsBoundary';
import {GoldPressable} from '../components/GoldPressable';
import {useExpiredTurnPulse} from '../components/useExpiredTurnPulse';
import React,{useEffect,useMemo,useState} from 'react';
import {Animated,AppState,Pressable,Text,View} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import {Feather} from '@expo/vector-icons';
import {TABLE as C} from '../computer/tableTheme';
import type {TurnClock} from './contract';

type Props={circularOnly?:boolean;remindAfterExpiry?:boolean;attentionKey?:string;clock:TurnClock|null|undefined;enabled:boolean;es:boolean;onPause:()=>void;onResume:()=>void};

/** Only animates the server's remaining time; expiration never issues a game action. */
function useTurnRemaining(clock:TurnClock|null|undefined,visible:boolean){
 const anchor=useMemo(()=>clock?{remainingMs:clock.remainingMs,paused:clock.paused,receivedAt:performance.now()}:null,
  [clock?.durationMs,clock?.remainingMs,clock?.deadline,clock?.serverNow,clock?.paused]);
 const [now,setNow]=useState(()=>performance.now());
 useEffect(()=>{
  if(!anchor||!visible)return;
  setNow(performance.now());
  if(anchor.paused||anchor.remainingMs===0)return;
  const timer=setInterval(()=>{
   const next=performance.now();setNow(next);
   if(next-anchor.receivedAt>=anchor.remainingMs)clearInterval(timer);
  },100);
  return()=>clearInterval(timer);
 },[anchor,visible]);
 return{remaining:anchor?Math.max(0,anchor.remainingMs-(anchor.paused?0:Math.max(0,now-anchor.receivedAt))):0,running:()=>!!anchor&&!anchor.paused&&performance.now()-anchor.receivedAt<anchor.remainingMs};
}

export function OnlineTurnTimer({clock,enabled,es,onPause,onResume,attentionKey,remindAfterExpiry=false,circularOnly=false}:Props){
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>subscription.remove();},[]);
 const visible=useTableVisible()&&foreground;
 const {remaining}=useTurnRemaining(clock,visible);
 const expired=remaining===0;
 const reminder=useExpiredTurnPulse(enabled&&!!clock&&!clock.paused&&expired);
 if(!clock)return null;
 const seconds=Math.ceil(remaining/1000),radius=26,circumference=2*Math.PI*radius;
 const fraction=Math.max(0,Math.min(1,remaining/clock.durationMs));
 const canControl=enabled&&(remaining>0||remindAfterExpiry);
 const warning=expired?'#A4453D':C.goldLight;
 const label=clock.paused?(es?'Reanudar tiempo':'Resume timer'):(es?'Pausar tiempo':'Pause timer');
 return <Animated.View testID="online-turn-timer" style={[{width:60,height:60,alignItems:'center',justifyContent:'center'},reminder]}>
  <Svg width={60} height={60} viewBox="0 0 60 60" pointerEvents="none" accessible={false} style={{position:'absolute',top:0,left:0}}>
   <Circle cx={30} cy={30} r={radius} fill="none" stroke={expired?warning:'rgba(255,239,202,0.3)'} strokeWidth={4}/>
   <Circle testID="online-turn-progress" cx={30} cy={30} r={radius} fill="none" stroke={warning} strokeWidth={4}
    strokeDasharray={circumference} strokeDashoffset={circumference*(1-fraction)} strokeLinecap="round" transform="rotate(-90 30 30)"/>
  </Svg>
  <GoldPressable surfaceShadow={!circularOnly} finish gold={false} surfaceStyle={{top:8,bottom:8,left:8,right:8,borderRadius:22,borderWidth:0}} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:!canControl}}
   accessibilityValue={{min:0,max:30,now:seconds,text:`${seconds} ${es?'segundos':'seconds'}`}}
   disabled={!canControl} onPress={canControl?(clock.paused?onResume:onPause):undefined}
   style={{width:60,height:60,...(circularOnly?{borderRadius:30,backgroundColor:'transparent'}:{}),alignItems:'center',justifyContent:'center',gap:1,opacity:canControl?1:.85}}>
   <Feather name={clock.paused?'play':'pause'} size={14} color={warning}/>
   <Text testID="online-turn-seconds" style={{color:expired?warning:C.ivory,fontSize:18,lineHeight:21,fontWeight:'800',fontVariant:['tabular-nums']}}>{seconds}</Text>
  </GoldPressable>
 </Animated.View>;
}
