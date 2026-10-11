import {useTableVisible} from './GameSettingsBoundary';
import {useEffect,useRef,useState} from 'react';import {Animated,AppState} from 'react-native';import {usePrefs} from '../state/PrefsContext';import {useReducedMotion} from '../computer/DrinkGift';import {turnReminders} from './turnReminder';import {turnReminderFeedback} from './turnReminderFeedback';
export function useTurnReminder(key:string|undefined,active:boolean,running:()=>boolean=()=>true,interval=15000){
 active=active&&useTableVisible();
 const prefs=usePrefs(),reduced=useReducedMotion(),pulse=useRef(new Animated.Value(0)).current;
 const [foreground,setForeground]=useState(AppState.currentState==='active'),foregroundRef=useRef(foreground);foregroundRef.current=foreground;
 const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const latest=useRef({key,active,prefs,reduced,running});latest.current={key,active,prefs,reduced,running};const cancelSound=useRef<(()=>void)|undefined>(undefined);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{foregroundRef.current=state==='active';setForeground(state==='active');if(state!=='active'){cancelSound.current?.();pulse.stopAnimation();pulse.setValue(0);}});return()=>sub.remove();},[pulse]);
 const enabled=active&&foreground&&prefs.ready&&!!key;
 useEffect(()=>{if(!enabled||!key)return;const subscription=turnReminders.subscribe(key,()=>{const p=latest.current;const current=()=>mounted.current&&foregroundRef.current&&latest.current.active&&latest.current.key===key&&latest.current.running();if(!current())return;cancelSound.current?.();cancelSound.current=turnReminderFeedback({vibration:p.prefs.vibration,sound:p.prefs.sound&&p.prefs.tileSound,current:()=>current()&&(!(p.prefs.sound&&p.prefs.tileSound)||(latest.current.prefs.sound&&latest.current.prefs.tileSound))});if(!p.reduced){pulse.stopAnimation();pulse.setValue(0);Animated.sequence([Animated.timing(pulse,{toValue:1,duration:100,useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:220,useNativeDriver:true})]).start();}},interval);return()=>{subscription();cancelSound.current?.();pulse.stopAnimation();pulse.setValue(0);};},[key,enabled,pulse,interval]);
 return{transform:[{translateY:pulse.interpolate({inputRange:[0,1],outputRange:[0,-2]})},{scale:pulse.interpolate({inputRange:[0,1],outputRange:[1,1.04]})}]};
}
