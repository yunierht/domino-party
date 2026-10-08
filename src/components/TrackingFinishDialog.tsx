import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Modal,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import {Button} from './ui';

export function TrackingFinishDialog({visible,onRematch,onNewMatch,onHome}:{visible:boolean;onRematch:()=>void;onNewMatch:()=>void;onHome:()=>void}){
 const {theme,s}=useTheme();const {t}=useI18n();const insets=useSafeAreaInsets();const [reduced,setReduced]=useState(false);const chosen=useRef(false);
 useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{active=false;sub.remove();};},[]);
 useEffect(()=>{chosen.current=false;},[visible]);
 const choose=(action:()=>void)=>{if(chosen.current)return;chosen.current=true;action();};
 return <Modal visible={visible} transparent animationType={reduced?'none':'fade'} onRequestClose={()=>choose(onHome)}>
  <View style={{flex:1,backgroundColor:'rgba(0,0,0,.55)',alignItems:'center',justifyContent:'center',paddingHorizontal:s(20),paddingTop:insets.top+s(20),paddingBottom:insets.bottom+s(20)}}>
   <View testID="tracking-finish-popup" accessibilityViewIsModal style={{width:'100%',maxWidth:s(340),backgroundColor:theme.colors.surface,padding:s(22),borderRadius:s(20),gap:s(14),borderWidth:1,borderColor:theme.colors.border}}>
    <Button label={t.rematch} onPress={()=>choose(onRematch)} fullWidth/>
    <Button label={t.newTeams} onPress={()=>choose(onNewMatch)} variant="secondary" fullWidth/>
    <Button label={t.backHome} onPress={()=>choose(onHome)} variant="ghost" fullWidth/>
   </View>
  </View>
 </Modal>;
}
