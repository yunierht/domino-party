import {GameSetupLayout} from '../components/GameSetupLayout';
import {lobbyOpponent} from '../computer/lobbyOpponent';
import {OPPONENTS} from '../computer/opponents';
import {GoldPressable} from '../components/GoldPressable';
import {LobbyGameHeader} from '../components/LobbyGameHeader';
import {useBlackjack} from '../blackjack/BlackjackContext';
import React,{useEffect} from 'react';
import {Text,View} from 'react-native';
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
 const {opponentId,setOpponentId,playerAvatarId,game:domino}=useComputerGame();
 const {pokerStartingChips:startingChips,setPokerStartingChips:setStartingChips,poker:match,setPoker,pokerName,setPokerName,enterMode}=useTableGame();
 const selectedOpponent=lobbyOpponent(OPPONENTS,opponentId,playerAvatarId);useEffect(()=>{if(selectedOpponent!==opponentId)setOpponentId(selectedOpponent);},[selectedOpponent,opponentId,setOpponentId]);
 const {name:blackjackName,setName:setBlackjackName}=useBlackjack();
 if(!poker)return <View style={{flex:1,backgroundColor:C.background}}><LobbyGameHeader game="blackjack" es={es} onBack={back}/><Text style={{color:C.ivory,padding:24}}>{es?'Próximamente':'Coming soon'}</Text></View>;
 return <GameSetupLayout game="poker" es={es}
  header={<LobbyGameHeader game="poker" es={es} onBack={back}/>}
  renderArt={roomy=><View style={{flexDirection:'row',gap:6}}><View style={{transform:[{rotate:'-10deg'}]}}><PlayingCard animate={false} card={{rank:14,suit:'s'}} width={roomy?64:54}/></View><View style={{transform:[{rotate:'10deg'}]}}><PlayingCard animate={false} card={{rank:13,suit:'h'}} width={roomy?64:54}/></View></View>}
  renderOpponents={roomy=><OpponentCarousel setup roomy={roomy} tight excludedId={playerAvatarId} selected={selectedOpponent} onSelect={setOpponentId} es={es}/>}
  optionTitle={match?(es?'Reglas de mesa':'Table rules'):(es?'Fichas iniciales':'Starting chips')}
  optionDetail={es?'Fichas virtuales':'Virtual chips'}
  options={match?<Text style={{color:C.muted,fontSize:14,lineHeight:20}}>{es?'Sin límite · Ciegas 10 / 20':'No limit · Blinds 10 / 20'}</Text>:<View style={{flexDirection:'row',gap:6}}>{[500,1000,2000,3000].map(amount=><GoldPressable finish gold={false} key={amount} accessibilityRole="button" accessibilityLabel={amount.toLocaleString()} accessibilityState={{selected:startingChips===amount}} onPress={()=>setStartingChips(amount)} style={{outlineColor:C.goldLight,flex:1,minHeight:44,borderRadius:10,borderWidth:1,borderColor:startingChips===amount?C.gold:C.line,backgroundColor:startingChips===amount?C.raised:C.surface,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.goldLight,fontSize:14,fontWeight:'600'}}>{amount.toLocaleString()}</Text>{startingChips===amount?<Text accessible={false} style={{position:'absolute',right:4,top:2,color:C.gold,fontSize:10}}>✓</Text>:null}</GoldPressable>)}</View>}
  play={<GoldPressable finish accessibilityRole="button" onPress={()=>{if(!match)setPoker(newHand(undefined,Math.random,{human:startingChips,computer:5000}));enterMode('poker');go('computerGame');}} testID="poker-lobby-play" style={{outlineColor:C.goldLight,minHeight:52,padding:12,borderRadius:14,backgroundColor:C.gold,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.background,fontWeight:'700',fontSize:16}}>{match?(es?'Continuar partida':'Continue game'):(es?'Jugar póker':'Play Poker')}</Text></GoldPressable>}
 />;
}
