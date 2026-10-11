import {ButtonShine} from './ButtonShine';
import React from 'react';
import {Pressable,StyleSheet,View,Text} from 'react-native';
import type {PressableProps,PressableStateCallbackType,ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../theme/ThemeContext';
import {primaryButtonFinish,tintedButtonFinish,PRIMARY_BUTTON_GLOSS} from './primaryButtonFinish';
type Props=PressableProps&{preserveChildKeys?:boolean;surfaceShadow?:boolean;finish?:boolean;finishColor?:string;surfaceStyle?:ViewStyle;gold?:boolean|((state:PressableStateCallbackType)=>boolean)};
/** Same handlers and geometry; original hues receive light, gold fills retain Home finish. */
export const GoldPressable=React.forwardRef<View,Props>(function GoldPressable({gold=true,finish=false,preserveChildKeys=false,surfaceShadow=true,finishColor,surfaceStyle,style,children,...props},ref){
 const {theme,s}=useTheme(),c=theme.colors;
 const isGold=(state:PressableStateCallbackType)=>typeof gold==='function'?gold(state):gold;
 const enabled=(state:PressableStateCallbackType)=>isGold(state)||finish;
 const original=(state:PressableStateCallbackType)=>typeof style==='function'?style(state):style;
 return <Pressable {...props} ref={ref} style={state=>{const base=StyleSheet.flatten(original(state));return enabled(state)?[base,...(surfaceShadow?[primaryButtonFinish(c.gradient,isGold(state)?c.primary:finishColor??(typeof base?.backgroundColor==='string'?base.backgroundColor:'#000000'),state.pressed,s).shadow]:[]),...(isGold(state)&&!finish?[{transform:base?.transform??[{translateY:state.pressed?s(2):0}]}]:[])]:base;}}>{state=>{
  const base=StyleSheet.flatten(original(state))??{},radius:ViewStyle={borderRadius:base.borderRadius,borderTopLeftRadius:base.borderTopLeftRadius,borderTopRightRadius:base.borderTopRightRadius,borderBottomLeftRadius:base.borderBottomLeftRadius,borderBottomRightRadius:base.borderBottomRightRadius};
  return <>{enabled(state)&&<LinearGradient pointerEvents="none" accessible={false} colors={isGold(state)?primaryButtonFinish(c.gradient,c.primary,state.pressed,s).colors:tintedButtonFinish(finishColor??String(base.backgroundColor??'transparent'),state.pressed).colors} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill,radius,{overflow:'hidden',borderWidth:1,borderColor:isGold(state)?'#F6D37B':base.borderColor??'rgba(255,255,255,0.16)'},surfaceStyle]}><LinearGradient pointerEvents="none" colors={isGold(state)?PRIMARY_BUTTON_GLOSS:['rgba(255,255,255,0.16)','rgba(255,255,255,0.03)','rgba(0,0,0,0.10)']} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill}/><View pointerEvents="none" style={{position:'absolute',top:s(4),left:s(8),right:s(8),height:1,backgroundColor:'rgba(255,255,255,0.45)'}}/>{finish&&<ButtonShine paused={props.disabled||state.pressed}/>}</LinearGradient>}{(preserveChildKeys||isGold(state))?React.Children.map(typeof children==='function'?children(state):children,child=>isGold(state)&&React.isValidElement<{style?:any}>(child)&&child.type===Text?React.cloneElement(child,{style:[child.props.style,{color:c.onPrimary,textShadowColor:'rgba(255,255,255,0.25)',textShadowOffset:{width:0,height:1},textShadowRadius:1}]}):child):typeof children==='function'?children(state):children}</>;
 }}</Pressable>;
});
