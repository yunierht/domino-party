import {useTableGame} from '../poker/TableGameContext';
import {useComputerGame} from '../computer/ComputerGameContext';
import React from 'react';
import {View,Text,Pressable,ScrollView,TextInput} from 'react-native';
import {useNav} from '../nav/NavContext';
import {useI18n} from '../i18n/I18nContext';
import {TABLE as C} from '../computer/tableTheme';
import {DEALERS,DealerChoices} from './dealers';
import {ClassicPlayingCard as PlayingCard} from './ClassicPlayingCard';
import {useBlackjack} from './BlackjackContext';
import {newRound} from './engine';
export function BlackjackLobby(){
 const {go,back}=useNav();const {lang}=useI18n();const es=lang==='es';const {game,setGame,name,setName,dealerId,setDealerId}=useBlackjack();
 const {pokerName,setPokerName}=useTableGame();const {game:domino}=useComputerGame();
 const selected=DEALERS.find(o=>o.id===dealerId)?.id??DEALERS[0].id;
 return <View style={{flex:1,backgroundColor:C.background}}><ScrollView contentContainerStyle={{padding:20,gap:18}}>
 <Pressable accessibilityRole="button" onPress={back}><Text style={{color:C.goldLight,fontSize:16}}>‹ {es?'Volver':'Back'}</Text></Pressable>
 <Text style={{color:C.goldLight,fontSize:26,textAlign:'center'}}>Blackjack</Text>
 <View style={{flexDirection:'row',justifyContent:'center',gap:8}}><PlayingCard animate={false} card={{rank:14,suit:'s'}} width={64}/><PlayingCard animate={false} card={{rank:11,suit:'h'}} width={64}/></View>
 <Text style={{color:C.muted}}>{es?'TU NOMBRE':'YOUR NAME'}</Text><TextInput accessibilityLabel={es?'Tu nombre':'Your name'} value={pokerName||name||domino?.playerName||''} onChangeText={v=>{setName(v);setPokerName(v);}} maxLength={30} placeholder={es?'Tú':'You'} placeholderTextColor={C.muted} style={{minHeight:50,padding:14,color:C.ivory,borderWidth:1,borderColor:C.line,borderRadius:12}}/>
 <Text style={{color:C.gold}}>{es?'ELIGE TU DEALER':'CHOOSE YOUR DEALER'}</Text><DealerChoices selected={selected} onSelect={setDealerId}/>
 <Text style={{color:C.muted,textAlign:'center',lineHeight:22}}>{es?'Dealer se planta en 17 suave · Blackjack paga 3:2 · Fichas virtuales':'Dealer stands on soft 17 · Blackjack pays 3:2 · Virtual chips'}</Text>
 <Pressable accessibilityRole="button" onPress={()=>go('blackjackTable')} style={{padding:16,backgroundColor:C.gold,borderRadius:14,alignItems:'center'}}><Text style={{color:C.background,fontWeight:'700'}}>{game?(es?'Continuar partida':'Continue game'):(es?'Jugar Blackjack':'Play Blackjack')}</Text></Pressable>
 <Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>{es?'La ronda se conserva mientras la app siga abierta.':'The round stays in memory while the app is open.'}</Text>
 </ScrollView></View>;
}
