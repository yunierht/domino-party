import React,{useState} from 'react';
import {Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PlayingIdentity} from './PlayingIdentity';
import {TABLE as C} from '../computer/tableTheme';

export function setupGeometry(available:number){
 const roomy=available>600,tight=available<428;
 return {roomy,hero:roomy?108:tight?66:82,profile:roomy?100:tight?76:84,rival:roomy?190:tight?146:164,options:roomy?82:68,gap:roomy?12:tight?4:6,padding:roomy?12:6};
}
type Props={game:'domino'|'poker'|'blackjack';es:boolean;header:React.ReactNode;renderArt:(roomy:boolean)=>React.ReactNode;renderOpponents:(roomy:boolean)=>React.ReactNode;optionTitle:string;optionDetail?:string;options:React.ReactNode;play:React.ReactNode};
/** One setup hierarchy shared by the three games; table behavior stays with each owner. */
export function GameSetupLayout({game,es,header,renderArt,renderOpponents,optionTitle,optionDetail,options,play}:Props){
 const window=useWindowDimensions(),insets=useSafeAreaInsets();
 const [available,setAvailable]=useState<number|null>(null);
 const fallback=window.height-insets.top-insets.bottom-(window.height-insets.top-insets.bottom<720?48:58)-87;
 const g=setupGeometry(available??fallback);
 return <View style={{flex:1,backgroundColor:C.background}}>
  {header}
  <View testID={game+'-lobby-content'} onLayout={e=>setAvailable(e.nativeEvent.layout.height)} style={{flex:1,minHeight:0,paddingHorizontal:12,paddingVertical:g.padding,justifyContent:'center'}}>
   <View testID="setup-stack" style={{width:'100%',maxWidth:520,alignSelf:'center',gap:g.gap}}>
    <View testID="setup-hero" style={{height:g.hero,flexDirection:'row',alignItems:'center',gap:8}}>
     <View style={{flex:1,gap:6}}><Text style={{color:C.ivory,fontSize:24,lineHeight:28,fontWeight:'700'}}>{es?'Tu mesa':'Your table'}</Text><Text style={{color:C.muted,fontSize:14,lineHeight:20}}>{es?'Prepara tu próxima partida.':'Set up your next game.'}</Text></View>
     <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:g.roomy?152:128,height:g.hero,alignItems:'center',justifyContent:'center'}}>{renderArt(g.roomy)}</View>
    </View>
    <View testID="setup-profile" style={{height:g.profile}}><PlayingIdentity es={es} variant="setup" setupSize={g.roomy?84:g.profile-14}/></View>
    <View testID="setup-opponents" style={{height:g.rival,gap:4}}>
     <Text style={{color:C.ivory,fontSize:16,lineHeight:20,fontWeight:'600'}}>{game==='blackjack'?(es?'Elige tu dealer':'Choose your dealer'):(es?'Elige tu rival':'Choose your opponent')}</Text>
     {renderOpponents(g.roomy)}
    </View>
    <View testID="setup-options" style={{minHeight:g.options,gap:6,paddingTop:8}}>
     <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}><Text style={{color:C.ivory,fontSize:14,lineHeight:18,fontWeight:'600'}}>{optionTitle}</Text>{optionDetail?<Text style={{color:C.muted,fontSize:13,lineHeight:18}}>{optionDetail}</Text>:null}</View>
     {options}
    </View>
   </View>
  </View>
  <View testID={game+'-lobby-footer'} style={{paddingHorizontal:12,paddingVertical:8,gap:4,borderTopWidth:1,borderTopColor:C.line}}>
   {play}
   <Text style={{color:C.muted,fontSize:12,lineHeight:16,textAlign:'center'}}>{es?'La partida se conserva mientras la app siga abierta.':'Your game stays in memory while the app is open.'}</Text>
  </View>
 </View>;
}
