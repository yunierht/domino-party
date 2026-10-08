import React,{useRef,useState} from 'react';
import {View} from 'react-native';
import {FloatingAction} from '../blackjack/FloatingAction';
export function ResultHoldButton({id,holding,visible=true,presentationKey,disabled=false,onHold,onRelease,es}:{id:string;holding:boolean;visible?:boolean;presentationKey?:object|null;disabled?:boolean;onHold:()=>void;onRelease:()=>void;es:boolean}){
 const fallback=useRef({}).current;const key=presentationKey===undefined?fallback:presentationKey;const [dismissed,setDismissed]=useState<object|null>(null);
 const release=()=>{if(key)setDismissed(key);onRelease();};
 return <View pointerEvents="box-none" style={{position:'absolute',left:0,right:0,bottom:'100%',height:54,zIndex:32}}><FloatingAction id={id} label="Hold" side="right" color="#267B58" bottom={8} visible={visible&&!!key&&dismissed!==key} enabled={!disabled} onPressIn={onHold} onPressOut={release} hint={es?'Mantén presionado para pausar; suelta para continuar':'Keep pressed to pause; release to continue'}/></View>;
}