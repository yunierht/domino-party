import {useTableVisible} from '../components/GameSettingsBoundary';
import {GoldPressable} from '../components/GoldPressable';
import {useExpiredTurnPulse} from '../components/useExpiredTurnPulse';
import React,{useEffect,useMemo,useState} from 'react';
import {Animated,AppState,Image,Pressable,Text,View} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import {Feather} from '@expo/vector-icons';
import {TABLE as C} from '../computer/tableTheme';
import type {TurnClock} from './contract';

type Props={elapsedOnly?:boolean;size?:number;showIdleRing?:boolean;onWarningChange?:(warning:boolean)=>void;avatar?:React.ComponentProps<typeof Image>['source'];avatarLabel?:string;avatarTestID?:string;circularOnly?:boolean;remindAfterExpiry?:boolean;attentionKey?:string;clock:TurnClock|null|undefined;enabled:boolean;es:boolean;onPause:()=>void;onResume:()=>void};

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

export function OnlineTurnTimer({elapsedOnly=false,size=60,showIdleRing=false,clock,enabled,es,onPause,onResume,attentionKey,remindAfterExpiry=false,circularOnly=false,avatar,avatarLabel,avatarTestID,onWarningChange}:Props){
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>subscription.remove();},[]);
 const visible=useTableVisible()&&foreground;
 const {remaining}=useTurnRemaining(clock,visible);
 const expired=remaining===0;
 const turnWarning=visible&&enabled&&!remindAfterExpiry&&!!avatar&&!!clock&&!clock.paused&&remaining>0&&remaining<=10000;
 useEffect(()=>{onWarningChange?.(turnWarning);},[turnWarning,onWarningChange]);
 useEffect(()=>()=>onWarningChange?.(false),[onWarningChange]);
 const reminder=useExpiredTurnPulse(turnWarning||enabled&&(!avatar||remindAfterExpiry)&&!!clock&&!clock.paused&&expired);
 if(!clock&&!avatar)return null;
 const avatarSize=size*.8,seconds=elapsedOnly?Math.floor(Math.max(0,(clock?.durationMs??0)-remaining)/1000):Math.ceil(remaining/1000),radius=26,circumference=2*Math.PI*radius;
 const fraction=clock?Math.max(0,Math.min(1,remaining/clock.durationMs)):1;
 const canControl=!!clock&&enabled&&(remaining>0||remindAfterExpiry);
 const warning=clock&&(expired||turnWarning)?'#A4453D':C.goldLight;
 const label=clock?.paused?(es?'Reanudar tiempo':'Resume timer'):(es?'Pausar tiempo':'Pause timer');
 return <Animated.View testID="online-turn-timer" style={[{width:size,height:size,alignItems:'center',justifyContent:'center'},reminder]}>
  {(clock||showIdleRing&&avatar)&&<Svg width={size} height={size} viewBox="0 0 60 60" pointerEvents="none" accessible={false} style={{position:'absolute',top:0,left:0}}>
   <Circle cx={30} cy={30} r={radius} fill="none" stroke={clock&&expired?warning:'rgba(255,239,202,0.3)'} strokeWidth={4}/>
   <Circle testID="online-turn-progress" cx={30} cy={30} r={radius} fill="none" stroke={warning} strokeWidth={4}
    strokeDasharray={circumference} strokeDashoffset={circumference*(1-fraction)} strokeLinecap="round" transform="rotate(-90 30 30)"/>
  </Svg>}
  {elapsedOnly?<View accessible accessibilityLabel={es?'Tiempo transcurrido del turno rival':'Opponent turn elapsed time'} accessibilityValue={{min:0,max:(clock?.durationMs??0)/1000,now:seconds,text:`${seconds} ${es?'segundos':'seconds'}`}}><Text testID="online-turn-seconds" style={{color:C.ivory,fontSize:18,fontWeight:'800',fontVariant:['tabular-nums']}}>{seconds}</Text></View>:<GoldPressable surfaceShadow={!circularOnly} finish gold={false} surfaceStyle={{top:size*8/60,bottom:size*8/60,left:size*8/60,right:size*8/60,borderRadius:size*22/60,borderWidth:0}} accessibilityRole="button" accessibilityLabel={avatar?(clock?`${avatarLabel??''} · ${label}`:avatarLabel):label} accessibilityState={{disabled:!canControl}}
   accessibilityValue={clock?{min:0,max:30,now:seconds,text:`${seconds} ${es?'segundos':'seconds'}`}:undefined}
   disabled={!canControl} onPress={canControl?(clock?.paused?onResume:onPause):undefined}
   style={{width:size,height:size,...(circularOnly?{borderRadius:size/2,backgroundColor:'transparent'}:{}),alignItems:'center',justifyContent:'center',gap:1,opacity:canControl?1:.85}}>
   {avatar?<Image testID={avatarTestID??'online-turn-avatar'} accessibilityLabel={avatarLabel} source={avatar} style={{width:avatarSize,height:avatarSize,borderRadius:avatarSize/2}}/>:<><Feather name={clock?.paused?'play':'pause'} size={14} color={warning}/>
   <Text testID="online-turn-seconds" style={{color:expired?warning:C.ivory,fontSize:18,lineHeight:21,fontWeight:'800',fontVariant:['tabular-nums']}}>{seconds}</Text></>}
  </GoldPressable>}
 </Animated.View>;
}

export function OnlineTurnWarning({visible,es}:{visible:boolean;es:boolean}){return visible?<Text testID="turn-warning" accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:C.goldLight,fontSize:11,lineHeight:14,textAlign:'center'}}>{es?'Te toca jugar; el otro jugador espera.':'Your turn; the other player is waiting.'}</Text>:null;}

/** Read-only presentation of the same server clock; owns no turn actions. */
export function OnlineElapsedTurnTimer({clock,es,size=44}:{clock:TurnClock|null|undefined;es:boolean;size?:number}){
 return <OnlineTurnTimer elapsedOnly size={size} clock={clock} enabled={false} es={es} onPause={()=>{}} onResume={()=>{}}/>;
}
