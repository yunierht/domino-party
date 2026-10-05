import React from 'react';
import {Text,View} from 'react-native';
import {TABLE as C} from '../computer/tableTheme';

/** The hint can disappear without returning its space to the table layout. */
export function PokerHandHint({visible,text,fontScale=1}:{visible:boolean;text:string;fontScale?:number}){
 const scale=Math.max(1,Math.min(1.3,fontScale));
 return <View testID="poker-hand-hint-lane" style={{height:24*scale,flexShrink:0,justifyContent:'center'}}>
  {visible?<Text accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75} maxFontSizeMultiplier={1.3}
   style={{color:C.goldLight,fontSize:13,lineHeight:18,textAlign:'center',paddingHorizontal:8}}>{text}</Text>:null}
 </View>;
}
