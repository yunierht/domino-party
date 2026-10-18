import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Pressable,Text,Vibration,View} from 'react-native';
import {useReducedMotion} from '../computer/DrinkGift';
import {TABLE as C} from '../computer/tableTheme';
import {usePrefs} from '../state/PrefsContext';
import {playTap,playOnlineKnock} from '../sound/sounds';
import type {AttentionEvent,AttentionKind,Seat} from './contract';

const monotonicNow=()=>typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();

const actions:{kind:AttentionKind;emoji:string;es:string;en:string}[]=[
  {kind:'wave',emoji:'👋',es:'Te toca',en:'Your turn'},
  {kind:'knock',emoji:'👊',es:'Toc, toc',en:'Knock, knock'},
  {kind:'look',emoji:'👀',es:'¿Estás ahí?',en:'Are you there?'},
];

/** The server remains authoritative; this cooldown only prevents accidental repeat taps. */
export function OnlineQuickActions({visible=true,enabled,supported,es,onSend,compact=false,stacked=false,kinds,appearance='default'}:{
  kinds?:readonly AttentionKind[];appearance?:'default'|'poker';stacked?:boolean;compact?:boolean;visible?:boolean;enabled:boolean;supported:boolean;es:boolean;
  onSend:(kind:AttentionKind)=>Promise<boolean>|boolean;
}) {
  const [busy,setBusy]=useState(false),[cooling,setCooling]=useState(false);
  const pending=useRef(false),until=useRef(0),alive=useRef(true);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timer.current)clearTimeout(timer.current);};},[]);
  const send=async(kind:AttentionKind)=>{
    if(!visible||!enabled||!supported||pending.current||monotonicNow()<until.current)return;
    pending.current=true;setBusy(true);
    try{
      const accepted=await onSend(kind);
      if(accepted&&alive.current){until.current=monotonicNow()+3000;setCooling(true);
        timer.current=setTimeout(()=>{timer.current=null;if(alive.current)setCooling(false);},3000);}
    }catch{/* The client owns error presentation; a failed send does not start cooldown. */}
    finally{pending.current=false;if(alive.current)setBusy(false);}
  };
  if(!visible||!supported)return null;
  const disabled=!enabled||busy||cooling;
  return <View testID="online-quick-actions" style={{flexDirection:'row',gap:3,alignItems:'center',...(stacked?{width:91,flexWrap:'wrap' as const,justifyContent:'flex-end' as const}:{})}}>
    {actions.filter(action=>!kinds||kinds.includes(action.kind)).map(action=><GoldPressable finish={appearance!=='poker'} gold={false} finishColor="#805438" surfaceStyle={compact?{top:6,bottom:6,left:6,right:6,borderRadius:16,borderColor:'#A77A51',borderWidth:2}:undefined} key={action.kind} testID={`online-attention-${action.kind}`}
      accessibilityRole="button" accessibilityLabel={es?action.es:action.en} accessibilityState={{disabled}}
      disabled={disabled} onPress={()=>void send(action.kind)}
      style={({pressed})=>({width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,
        ...(appearance==='poker'?{backgroundColor:'#205541',borderWidth:1,borderColor:C.gold}:compact?{}:{backgroundColor:pressed?'#765036':'#805438',borderWidth:2,borderColor:'#A77A51',borderTopColor:'#BE8F65',borderBottomColor:'#553A27',borderBottomWidth:pressed?1:3}),
        transform:[{translateY:pressed?1:0}],opacity:disabled ? .55 : 1})}>
      <View pointerEvents="none" style={appearance==='poker'?undefined:compact?{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'transparent',borderWidth:2,borderColor:'#A77A51',borderTopColor:'#BE8F65',borderBottomColor:'#553A27'}:undefined}><Text accessible={false} style={{fontSize:compact?16:20}}>{action.emoji}</Text></View>
    </GoldPressable>)}
  </View>;
}

/** Ephemeral, non-blocking reception. A dismissal never replays the same event. */
export function OnlineAttentionNotice({event,localSeat,serverNow,es,supported=true,dismissalKey=0}:{
  event?:AttentionEvent|null;localSeat:Seat;serverNow:number;es:boolean;supported?:boolean;dismissalKey?:string|number;
}) {
  const prefs=usePrefs(),reduced=useReducedMotion(),preferences=useRef(prefs);preferences.current=prefs;
  const [notice,setNotice]=useState<AttentionEvent|null>(null);
  const seen=useRef(new Set<string>()),active=useRef<string|null>(null),previousDismissal=useRef(dismissalKey);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),knock=useRef<ReturnType<typeof setTimeout>|null>(null);
  const motion=useRef(new Animated.Value(0)).current;
  const sample=useRef({serverNow,receivedAt:monotonicNow()});
  if(sample.current.serverNow!==serverNow)sample.current={serverNow,receivedAt:monotonicNow()};
  const stop=()=>{active.current=null;if(timer.current)clearTimeout(timer.current);if(knock.current)clearTimeout(knock.current);timer.current=null;knock.current=null;motion.stopAnimation();};
  const dismiss=()=>{stop();setNotice(null);};
  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{
    const dismissed=previousDismissal.current!==dismissalKey;previousDismissal.current=dismissalKey;
    if(dismissed||!supported){dismiss();if(event)seen.current.add(event.id);return;}
    if(!event){dismiss();return;}
    const effectiveNow=serverNow+Math.max(0,monotonicNow()-sample.current.receivedAt);
    if(event.from===localSeat||event.expiresAt<=effectiveNow){dismiss();seen.current.add(event.id);return;}
    if(seen.current.has(event.id))return;
    seen.current.add(event.id);
    if(seen.current.size>128)seen.current.delete(seen.current.values().next().value!);
    stop();active.current=event.id;setNotice(event);
    const remaining=Math.min(3000,event.expiresAt-effectiveNow);
    timer.current=setTimeout(dismiss,remaining);
    const current=preferences.current;
    if(current.ready&&event.kind==='wave'&&current.sound)playTap();
    if(current.ready&&event.kind==='knock'){
      if(current.tileSound){playOnlineKnock();
        if(remaining>180)knock.current=setTimeout(()=>{knock.current=null;if(active.current===event.id&&preferences.current.ready&&preferences.current.tileSound)playOnlineKnock();},180);}
      if(current.vibration)Vibration.vibrate(30);
    }
  },[event?.id,event?.from,event?.kind,event?.sentAt,event?.expiresAt,localSeat,serverNow,supported,dismissalKey]);
  useEffect(()=>{
    motion.setValue(0);if(!notice||reduced)return;
    const animation=Animated.sequence([
      Animated.timing(motion,{toValue:-4,duration:160,useNativeDriver:true}),
      Animated.timing(motion,{toValue:3,duration:180,useNativeDriver:true}),
      Animated.timing(motion,{toValue:0,duration:180,useNativeDriver:true}),
    ]);animation.start();return()=>animation.stop();
  },[notice?.id,reduced,motion]);
  if(!notice)return null;
  const action=actions.find(item=>item.kind===notice.kind)!;
  return <Animated.View testID="online-attention-notice" pointerEvents="none" accessibilityLiveRegion="polite"
    accessibilityLabel={es?action.es:action.en} style={{alignSelf:'center',flexDirection:'row',alignItems:'center',gap:6,
      paddingVertical:5,paddingHorizontal:12,borderRadius:16,backgroundColor:C.raised,borderWidth:1,borderColor:C.line,
      transform:[{translateY:reduced?0:motion}]}}>
    <Text accessible={false} style={{fontSize:20}}>{action.emoji}</Text>
    <Text numberOfLines={1} style={{color:C.goldLight,fontSize:13,fontWeight:'600'}}>{es?action.es:action.en}</Text>
  </Animated.View>;
}
