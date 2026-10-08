import React,{useState} from 'react';
import {Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Feather} from '@expo/vector-icons';
import {TABLE as C} from '../computer/tableTheme';
import {LOBBY_RULES} from './lobbyRules';

/** Matches the approved Domino entry header without changing Domino or live tables. */
export function LobbyGameHeader({game,es,onBack}:{game:'poker'|'blackjack';es:boolean;onBack:()=>void}){
 const [rules,setRules]=useState(false);const {height}=useWindowDimensions();const insets=useSafeAreaInsets();const compact=height-insets.top-insets.bottom<720;const label=es?'Reglas':'Rules';
 return <>
  <View testID="lobby-game-header" style={{height:compact?48:58,paddingHorizontal:14,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:C.line}}>
   <Pressable testID="lobby-back" accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={onBack} style={{width:44,height:44,justifyContent:'center',alignItems:'center'}}><Feather name="arrow-left" size={20} color={C.ivory}/></Pressable>
   <View style={{flex:1,alignItems:'center'}}><Text testID="lobby-game-title" style={{color:C.ivory,fontSize:17,letterSpacing:4,fontWeight:'600'}}>{game.toUpperCase()}</Text><Text testID="lobby-game-subtitle" style={{color:C.gold,fontSize:8,letterSpacing:2.2,marginTop:3}}>SOCIAL CLUB · PRO</Text></View>
   <Pressable testID="lobby-open-rules" accessibilityRole="button" accessibilityLabel={label} onPress={()=>setRules(true)} style={{minWidth:44,height:44,justifyContent:'center',alignItems:'center',gap:3}}><Feather name="book-open" size={17} color={C.gold}/><Text style={{color:C.muted,fontSize:9}}>{label}</Text></Pressable>
  </View>
  <Modal visible={rules} transparent animationType="fade" onRequestClose={()=>setRules(false)}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(2,12,10,0.82)'}}><View accessibilityViewIsModal style={{maxHeight:'85%',borderRadius:24,padding:24,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,gap:16}}>
    <Text style={{color:C.goldLight,fontSize:20,fontWeight:'600'}}>{game==='poker'?(es?'Reglas de póker':'Poker rules'):(es?'Reglas de Blackjack':'Blackjack rules')}</Text>
    <ScrollView style={{flexShrink:1}}><Text testID="lobby-rules-text" style={{color:C.ivory,fontSize:15,lineHeight:25}}>{LOBBY_RULES[game][es?'es':'en']}</Text></ScrollView>
    <Pressable testID="lobby-close-rules" accessibilityRole="button" accessibilityLabel={es?'Cerrar':'Close'} onPress={()=>setRules(false)} style={{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:1,borderColor:C.gold}}><Text style={{color:C.goldLight,fontSize:14,fontWeight:'700'}}>{es?'Cerrar':'Close'}</Text></Pressable>
   </View></View>
  </Modal>
 </>;
}
