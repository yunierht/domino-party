import React,{useRef,useState} from 'react';
import {View,Text} from 'react-native';
import {GoldPressable} from '../components/GoldPressable';
import {TABLE as C} from '../computer/tableTheme';
type Props={draftKey?:string;minimum:number;maximum:number;ownBet:number;total:number;pending:boolean;enabled:boolean;es:boolean;onSelect:(total:number)=>void;onClear:()=>void;onConfirm:()=>void;onTap?:(total:number)=>void;visible?:boolean;railHeight?:number;railBottom?:number;thumbWidth?:number};
/** Button edits stay local: they cannot reserve chips, change the pot or start an auto-bet timer. */
export function PokerRaiseSlider(p:Props){
 const minimum=Math.min(p.minimum,p.maximum),width=p.thumbWidth??72,base=Math.max(minimum,Math.min(p.maximum,p.pending?p.total:minimum));
 const signature=[p.draftKey,p.minimum,p.maximum,p.ownBet,p.total,p.pending,p.enabled,p.visible].join(':');
 const [draft,setDraft]=useState({signature,value:base});
 const value=draft.signature===signature?draft.value:base;
 const current=useRef({signature,value});current.current={signature,value};
 if(!(p.visible??p.enabled))return null;
 const adjust=(step:number)=>{if(!p.enabled)return;const next={signature,value:Math.max(minimum,Math.min(p.maximum,current.current.value+step))};current.current=next;setDraft(next);};
 const submit=(amount:number)=>{if(p.enabled)p.onTap?.(amount);};
 const button=(id:string,label:string,action:()=>void,disabled:boolean,gold:boolean,style:object)=>{const adjustment=id==='poker-raise-plus'||id==='poker-raise-minus';return <GoldPressable key={id} testID={id} finish gold={gold} surfaceShadow={!adjustment} finishColor={adjustment?'#205541':undefined} surfaceStyle={adjustment?{top:id==='poker-raise-plus'?14:0,bottom:id==='poker-raise-minus'?14:0,left:2,right:10,borderRadius:9}:undefined} disabled={disabled} accessibilityRole="button" accessibilityLabel={id==='poker-raise-plus'?(p.es?'Aumentar apuesta en 5':'Increase raise by 5'):id==='poker-raise-minus'?(p.es?'Reducir apuesta en 5':'Decrease raise by 5'):label} accessibilityState={{disabled}} onPress={action} style={{minHeight:46,minWidth:44,borderRadius:12,alignItems:'center',justifyContent:'center',opacity:disabled?.45:1,backgroundColor:adjustment?'transparent':gold?C.gold:'#205541',...style}}><Text testID={id==='poker-raise-submit'?'poker-raise-label':undefined} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75} style={{color:gold?C.background:C.ivory,fontSize:13,fontWeight:'800',fontVariant:['tabular-nums'],paddingHorizontal:2,...(adjustment?{transform:[{translateX:-4},{translateY:id==='poker-raise-plus'?7:-7}]}:{})}}>{label}</Text></GoldPressable>;};
 return <View testID="poker-raise-buttons" style={{position:'absolute',bottom:p.railBottom??4,left:0,width:width+44,height:98,zIndex:24}}>
  {button('poker-raise-submit','RAISE '+value.toLocaleString(p.es?'es':'en'),()=>submit(current.current.value),!p.enabled,false,{position:'absolute',top:0,left:0,width})}
  {button('poker-raise-all-in','ALL-IN',()=>submit(p.maximum),!p.enabled,true,{position:'absolute',top:52,left:0,width})}
  {button('poker-raise-plus','+',()=>adjust(5),!p.enabled||value>=p.maximum,false,{position:'absolute',top:-24,left:width,width:44})}
  {button('poker-raise-minus','−',()=>adjust(-5),!p.enabled||value<=minimum,false,{position:'absolute',top:24,left:width,width:44})}
 </View>;
}
