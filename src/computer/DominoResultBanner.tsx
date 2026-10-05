import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Text,View} from 'react-native';

const confettiColumns=[5,11,17,23,77,83,89,95];
const confettiColors=['#F5D58C','#78D7C4','#FFF2D2'];
export function DominoResultBanner({result,paused}:{result:{title:string;detail:string;tone:'win'|'loss'|'tie'};paused:boolean}){
 const progress=useRef(new Animated.Value(0)).current,burst=useRef(new Animated.Value(0)).current;
 const [reduced,setReduced]=useState(true);const [height,setHeight]=useState(80);
 const win=result.tone==='win';const color=win?'#F5D58C':result.tone==='loss'?'#FFB9AF':'#E4EADC';
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{progress.setValue(0);if(paused||reduced)return;const animation=Animated.sequence([Animated.timing(progress,{toValue:1,duration:420,useNativeDriver:true}),Animated.timing(progress,{toValue:.7,duration:480,useNativeDriver:true})]);animation.start();return()=>animation.stop();},[paused,reduced,progress]);
 useEffect(()=>{burst.setValue(0);if(!win||paused||reduced)return;const animation=Animated.timing(burst,{toValue:1,duration:1200,useNativeDriver:true});animation.start();return()=>animation.stop();},[win,paused,reduced,burst]);
 return <View testID="domino-result-banner" onLayout={e=>setHeight(e.nativeEvent.layout.height)} accessibilityLiveRegion="polite" accessibilityLabel={`${result.title}. ${result.detail}`} style={{alignSelf:'center',width:'100%',maxWidth:310,maxHeight:30,paddingVertical:4,paddingHorizontal:12,borderRadius:24,borderWidth:0,borderColor:color,backgroundColor:'transparent',overflow:'hidden'}}>
 {win&&!paused&&(reduced?<View testID="domino-win-static-sparkles" pointerEvents="none" accessible={false} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}>{[false,true].flatMap(right=>[8,20].map(top=><View key={`${right}-${top}`} style={{position:'absolute',top,left:right?undefined:8,right:right?8:undefined,width:4,height:4,backgroundColor:color,transform:[{rotate:'45deg'}]}}/>))}</View>:<View testID="domino-win-confetti" pointerEvents="none" accessible={false} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}>{Array.from({length:16},(_,i)=><Animated.View key={i} style={{position:'absolute',left:`${confettiColumns[i%8]}%`,top:-10,width:i%3===0?5:4,height:i%3===0?5:8,borderRadius:1,backgroundColor:confettiColors[i%3],opacity:burst.interpolate({inputRange:[0,.12,.75,1],outputRange:[0,1,.9,0]}),transform:[{translateX:burst.interpolate({inputRange:[0,.5,1],outputRange:[0,i%2?6:-6,i%2?-5:5]})},{translateY:burst.interpolate({inputRange:[0,1],outputRange:[i<8?0:-height*.65,height+24]})},{rotate:burst.interpolate({inputRange:[0,1],outputRange:[`${i*25}deg`,`${i*25+240}deg`]})}]}}/>)}</View>)}
 <Animated.View style={{zIndex:1,transform:[{scale:reduced?1:progress.interpolate({inputRange:[0,1],outputRange:[.96,1.04]})}]}}><Text numberOfLines={1} adjustsFontSizeToFit style={{color:'#F5F0E4',fontSize:18,fontWeight:'700',letterSpacing:1,textAlign:'center',textShadowColor:'#03110D',textShadowRadius:2}}>{result.title}</Text></Animated.View>
 {result.detail&&<Text style={{zIndex:1,color:'#FFF0D0',fontSize:11,textAlign:'center',marginTop:4,textShadowColor:'#03110D',textShadowRadius:2}}>{result.detail}</Text>}
 </View>;
}
