import {useEffect,useMemo,useState} from 'react';
import {AccessibilityInfo,Animated,Easing} from 'react-native';
import {playRoundDeal} from '../sound/sounds';

/** Deal presentation consumes public round identity, never a private Game or AI timer. */
export function useOnlineDeal(round:number,fresh:boolean,ready:boolean,sound:boolean){
  const progress=useMemo(()=>new Animated.Value(fresh?0:1),[round]);
  const [finished,setFinished]=useState(fresh?0:round);
  const [reduced,setReduced]=useState<boolean|null>(null);
  useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReduced(v);}).catch(()=>{if(active)setReduced(true);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{active=false;sub.remove();};},[]);
  const dealing=fresh&&finished!==round;
  useEffect(()=>{
    if(!dealing||!ready||reduced===null)return;
    if(reduced){progress.setValue(1);setFinished(round);return;}
    let alive=true;
    const stop=sound?playRoundDeal():()=>{};
    const animation=Animated.timing(progress,{toValue:1,duration:1300,easing:Easing.linear,useNativeDriver:true});
    animation.start(({finished:done})=>{if(alive&&done)setFinished(round);});
    return()=>{alive=false;animation.stop();stop();};
  },[dealing,ready,reduced,round,sound,progress]);
  return {progress,dealing};
}
