import React,{useRef} from 'react';
import {PanResponder,Platform,Pressable,Text,View} from 'react-native';
import {TABLE as C} from '../computer/tableTheme';
import {scrollRaise} from './raiseAmount';
export function RaiseWheel({value,min,max,disabled,onChange,es}:{value:number;min:number;max:number;disabled:boolean;onChange:(value:number)=>void;es:boolean}){
 const latest=useRef({value,min,max,disabled,onChange});latest.current={value,min,max,disabled,onChange};const start=useRef(value);
 const change=(dy:number)=>{const p=latest.current;if(!p.disabled)p.onChange(scrollRaise(p.value,dy,p.min,p.max));};
 const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>!latest.current.disabled,onMoveShouldSetPanResponder:(_,g)=>!latest.current.disabled&&Math.abs(g.dy)>3,onPanResponderGrant:()=>{start.current=latest.current.value;},onPanResponderMove:(_,g)=>{const p=latest.current;p.onChange(scrollRaise(start.current,g.dy,p.min,p.max));}})).current;
 const wheel=Platform.OS==='web'?{onWheel:(event:{deltaY:number;preventDefault:()=>void})=>{if(!latest.current.disabled){event.preventDefault();change(Math.sign(event.deltaY)*12);}}}:{};
 return <View style={{width:82,height:50,flexDirection:'row',borderWidth:1,borderColor:disabled?C.line:C.gold,borderRadius:12,backgroundColor:'rgba(8,29,27,.42)',opacity:disabled?.4:1,overflow:'hidden'}}>
 <View {...pan.panHandlers} {...wheel} accessible accessibilityRole="adjustable" accessibilityLabel={es?'Subir a. Desliza arriba o abajo para ajustar':'Raise to. Swipe up or down to adjust'} accessibilityValue={{min:Math.min(min,max),max,now:value}} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={e=>change(e.nativeEvent.actionName==='increment'?-12:12)} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
 <Text accessible={false} style={{color:C.muted,fontSize:10,opacity:.5,height:12}}>{value<max?Math.min(max,value+10):' '}</Text>
 <Text style={{color:C.goldLight,fontSize:16,fontWeight:'700',fontVariant:['tabular-nums'],height:24}}>{value}</Text>
 <Text accessible={false} style={{color:C.muted,fontSize:10,opacity:.5,height:12}}>{value>min?Math.max(min,value-10):' '}</Text></View>
 <View style={{width:28,borderLeftWidth:1,borderLeftColor:C.line}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Aumentar apuesta':'Increase bet'} disabled={disabled||value>=max} onPress={()=>change(-12)} style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.gold}}>▴</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={es?'Reducir apuesta':'Decrease bet'} disabled={disabled||value<=min} onPress={()=>change(12)} style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.gold}}>▾</Text></Pressable></View>
 </View>;
}
