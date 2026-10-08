import {LobbyGameHeader} from '../components/LobbyGameHeader';
import {useBlackjack} from '../blackjack/BlackjackContext';
import React from 'react';
import {Image,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useNav} from '../nav/NavContext';
import {useI18n} from '../i18n/I18nContext';
import {useComputerGame} from '../computer/ComputerGameContext';
import {OpponentCarousel} from '../computer/OpponentChoices';
import {TABLE as C} from '../computer/tableTheme';
import {useTableGame} from './TableGameContext';
import {newHand} from './engine';
import {ClassicPlayingCard as PlayingCard} from '../blackjack/ClassicPlayingCard';

export function CardGameLobby({game}:{game:'poker'|'blackjack'}){
 const {go,back}=useNav();const {lang}=useI18n();const es=lang==='es';const poker=game==='poker';
 const {opponentId,setOpponentId,game:domino}=useComputerGame();
 const {pokerStartingChips:startingChips,setPokerStartingChips:setStartingChips,poker:match,setPoker,pokerName,setPokerName,enterMode}=useTableGame();
 const {name:blackjackName,setName:setBlackjackName}=useBlackjack();
 return <View style={{flex:1,backgroundColor:C.background}}>
 <LobbyGameHeader game={poker?'poker':'blackjack'} es={es} onBack={back}/>
 <ScrollView contentContainerStyle={{padding:20,gap:18}}>
 <View style={{flexDirection:'row',justifyContent:'center',gap:8,paddingTop:12}}>
 <View style={{transform:[{rotate:'-10deg'}]}}><PlayingCard animate={false} card={{rank:14,suit:'s'}} width={64}/></View>
 <View style={{transform:[{rotate:'10deg'}]}}><PlayingCard animate={false} card={{rank:poker?13:11,suit:'h'}} width={64}/></View></View>
 <Text style={{color:C.goldLight,fontSize:18,textAlign:'center'}}>{poker?(es?'Tu próxima mano.':'Your next hand.'):(es?'Una nueva mesa está en camino.':'A new table is on its way.')}</Text>
 {poker?<>
 <Text style={{color:C.muted,fontSize:12}}>{es?'TU NOMBRE':'YOUR NAME'}</Text>
 <TextInput accessibilityLabel={es?'Tu nombre':'Your name'} value={pokerName||blackjackName||domino?.playerName||''} onChangeText={v=>{setPokerName(v);setBlackjackName(v);}} maxLength={30} placeholder={es?'Tú':'You'} placeholderTextColor={C.muted} style={{padding:14,minHeight:50,color:C.ivory,fontSize:16,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.surface}}/>
 <Text style={{color:C.gold,fontSize:12}}>{es?'ELIGE TU RIVAL':'CHOOSE YOUR OPPONENT'}</Text>
 <OpponentCarousel selected={opponentId} onSelect={setOpponentId} es={es}/>
 {!match?<View style={{gap:9}}><Text style={{color:C.gold,fontSize:12}}>{es?'TUS FICHAS INICIALES':'YOUR STARTING CHIPS'}</Text><View style={{flexDirection:'row',gap:8}}>{[500,1000,2000,3000].map(amount=><Pressable key={amount} accessibilityRole="button" accessibilityState={{selected:startingChips===amount}} onPress={()=>setStartingChips(amount)} style={{flex:1,padding:13,borderRadius:12,borderWidth:1,borderColor:startingChips===amount?C.gold:C.line,backgroundColor:C.surface,alignItems:'center'}}><Text style={{color:C.goldLight,fontSize:17}}>{amount.toLocaleString()}</Text></Pressable>)}</View></View>:null}
 <Text style={{color:C.muted,lineHeight:21,textAlign:'center'}}>{es?'Sin límite · Fichas virtuales · Ciegas 10 / 20':'No limit · Virtual chips · Blinds 10 / 20'}</Text>
 <Pressable accessibilityRole="button" onPress={()=>{if(!match)setPoker(newHand(undefined,Math.random,{human:startingChips,computer:5000}));enterMode('poker');go('computerGame');}} style={{padding:16,borderRadius:14,backgroundColor:C.gold,alignItems:'center'}}><Text style={{color:C.background,fontWeight:'700',fontSize:16}}>{match?(es?'Continuar partida':'Continue game'):(es?'Jugar póker':'Play Poker')}</Text></Pressable>
 <Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>{es?'La partida se conserva mientras la app siga abierta.':'Your game stays in memory while the app is open.'}</Text>
 </>:<View style={{padding:24,borderWidth:1,borderColor:C.line,borderRadius:16,backgroundColor:C.surface,gap:10}}><Text style={{color:C.goldLight,fontSize:22,textAlign:'center'}}>{es?'Próximamente':'Coming soon'}</Text><Text style={{color:C.muted,fontSize:15,lineHeight:23,textAlign:'center'}}>{es?'Esta es la entrada de Blackjack. El juego todavía no está disponible.':'This is the Blackjack lobby. The game is not available yet.'}</Text></View>}
 </ScrollView></View>;
}
