import {GameSetupLayout} from '../components/GameSetupLayout';
import {lobbyOpponent} from '../computer/lobbyOpponent';
import {GoldPressable} from '../components/GoldPressable';
import {LobbyGameHeader} from '../components/LobbyGameHeader';
import {useTableGame} from '../poker/TableGameContext';
import {useComputerGame} from '../computer/ComputerGameContext';
import React,{useEffect} from 'react';
import {View,Text} from 'react-native';
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
 return <GameSetupLayout game="blackjack" es={es}
  header={<LobbyGameHeader game="blackjack" es={es} onBack={back}/>}
  renderArt={roomy=><View style={{flexDirection:'row',gap:6}}><View style={{transform:[{rotate:'-10deg'}]}}><PlayingCard animate={false} card={{rank:14,suit:'s'}} width={roomy?64:54}/></View><View style={{transform:[{rotate:'10deg'}]}}><PlayingCard animate={false} card={{rank:11,suit:'h'}} width={roomy?64:54}/></View></View>}
  renderOpponents={roomy=><View><DealerChoices setup roomy={roomy} carousel tight excludedId={playerAvatarId} selected={selected} onSelect={setDealerId}/><Text style={{color:C.gold,fontSize:13,marginTop:2}}>{es?'Desliza para ver más rivales →':'Swipe for more opponents →'}</Text></View>}
  optionTitle={es?'Reglas de mesa':'House rules'}
  options={<View style={{flexDirection:'row',gap:6}}>{[{value:es?'17 suave':'Soft 17',label:es?'Se planta':'Stand',description:es?'Dealer se planta en 17 suave':'Dealer stands on soft 17'},{value:'3:2',label:es?'Blackjack paga':'Blackjack pays',description:es?'Blackjack paga 3:2':'Blackjack pays 3:2'},{value:es?'Virtuales':'Virtual',label:es?'Fichas':'Chips',description:es?'Fichas virtuales':'Virtual chips'}].map(rule=><View key={rule.value} accessibilityLabel={rule.description} style={{flex:1,minHeight:44,justifyContent:'center',alignItems:'center',gap:2}}><Text style={{color:C.goldLight,fontSize:16,fontWeight:'600'}}>{rule.value}</Text><Text style={{color:C.muted,fontSize:13}}>{rule.label}</Text></View>)}</View>}
  play={<GoldPressable finish accessibilityRole="button" onPress={()=>go('blackjackTable')} testID="blackjack-lobby-play" style={{outlineColor:C.goldLight,minHeight:52,padding:12,backgroundColor:C.gold,borderRadius:14,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.background,fontWeight:'700',fontSize:16}}>{game?(es?'Continuar partida':'Continue game'):(es?'Jugar Blackjack':'Play Blackjack')}</Text></GoldPressable>}
 />;
}
