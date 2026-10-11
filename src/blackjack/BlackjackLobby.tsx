import {lobbyOpponent} from '../computer/lobbyOpponent';
import {PlayingIdentity} from '../components/PlayingIdentity';
import {GoldPressable} from '../components/GoldPressable';
import {LobbyGameHeader} from '../components/LobbyGameHeader';
import {useTableGame} from '../poker/TableGameContext';
import {useComputerGame} from '../computer/ComputerGameContext';
import React,{useEffect} from 'react';
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
 const {pokerName,setPokerName}=useTableGame();const {game:domino,playerAvatarId}=useComputerGame();
 const selected=lobbyOpponent(DEALERS,DEALERS.find(o=>o.id===dealerId)?.id??DEALERS[0].id,playerAvatarId);useEffect(()=>{if(playerAvatarId===dealerId&&selected!==dealerId)setDealerId(selected);},[playerAvatarId,dealerId,selected,setDealerId]);
 return <View style={{flex:1,backgroundColor:C.background}}><LobbyGameHeader game="blackjack" es={es} onBack={back}/><ScrollView contentContainerStyle={{padding:20,gap:18}}>
 <View style={{flexDirection:'row',justifyContent:'center',gap:8}}><PlayingCard animate={false} card={{rank:14,suit:'s'}} width={64}/><PlayingCard animate={false} card={{rank:11,suit:'h'}} width={64}/></View>
 <PlayingIdentity es={es} variant="blackjack"/>
 <Text style={{color:C.gold}}>{es?'ELIGE TU DEALER':'CHOOSE YOUR DEALER'}</Text><DealerChoices excludedId={playerAvatarId} selected={selected} onSelect={setDealerId}/>
 <Text style={{color:C.muted,textAlign:'center',lineHeight:22}}>{es?'Dealer se planta en 17 suave · Blackjack paga 3:2 · Fichas virtuales':'Dealer stands on soft 17 · Blackjack pays 3:2 · Virtual chips'}</Text>
 <GoldPressable finish accessibilityRole="button" onPress={()=>go('blackjackTable')} style={{padding:16,backgroundColor:C.gold,borderRadius:14,alignItems:'center'}}><Text style={{color:C.background,fontWeight:'700'}}>{game?(es?'Continuar partida':'Continue game'):(es?'Jugar Blackjack':'Play Blackjack')}</Text></GoldPressable>
 <Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>{es?'La ronda se conserva mientras la app siga abierta.':'The round stays in memory while the app is open.'}</Text>
 </ScrollView></View>;
}
