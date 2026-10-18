import {PlayingIdentity} from '../components/PlayingIdentity';
import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {Header} from '../components/Header';
import {useNav} from '../nav/NavContext';
import {useI18n} from '../i18n/I18nContext';
import {useComputerGame} from '../computer/ComputerGameContext';
import {TABLE as C} from '../computer/tableTheme';
import {OnlinePlayerAvatarPicker} from './OnlinePlayerAvatarPicker';
import {OnlineFriendScreen} from './OnlineFriendScreen';
import {normalizeAvatarName} from './avatarIdentity';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {useAvatarSetupName} from './useAvatarSetupName';

export function OnlineInvitationEntry(){
 const {onlineInvitation,goHome}=useNav(),{lang}=useI18n(),es=lang==='es';
 const {playerAvatarId,setPlayerAvatarId,playerAvatarPhoto,playerAvatarName,setPlayerAvatarPhoto}=useComputerGame();
 const defaultName=playerAvatarId==='selfie'?(playerAvatarName||''):DOMINO_AVATARS.find(avatar=>avatar.id===playerAvatarId)?.name??'';
 const {name,editName,chooseName}=useAvatarSetupName(playerAvatarId,defaultName),[confirmed,setConfirmed]=useState(false);
 useEffect(()=>{setConfirmed(false);},[onlineInvitation]);
 const code=onlineInvitation?.code,validName=normalizeAvatarName(name);
 if(!code)return <View style={{flex:1,padding:20,backgroundColor:C.background}}><Header title={es?'Invitación a dominó':'Domino invitation'} onBackPress={goHome} reserveThemeSpace={false}/><Text accessibilityRole="alert" style={{color:C.ivory}}>{es?'El enlace de invitación no es válido. Pide un enlace nuevo o usa el código de sala.':'The invitation link is invalid. Ask for a new link or use the room code.'}</Text><Pressable accessibilityRole="button" onPress={goHome} style={{minHeight:44,padding:12}}><Text style={{color:C.gold}}>{es?'Volver a Home':'Return to Home'}</Text></Pressable></View>;
 if(confirmed&&validName)return <OnlineFriendScreen initialName={validName} initialAvatar={playerAvatarId} initialAvatarPhoto={playerAvatarPhoto} initialTarget={100} initialMode="points" entry="accept" invitationCode={code} autoAcceptInvitation onBack={goHome}/>;
 return <View style={{flex:1,backgroundColor:C.background,padding:20}}><Header title={es?'Invitación a dominó':'Domino invitation'} onBackPress={goHome} reserveThemeSpace={false}/><Text selectable style={{color:C.goldLight,fontSize:20}}>{code}</Text><Text style={{color:C.ivory,marginVertical:14}}>{es?'Al continuar, aceptarás esta invitación y entrarás a la partida.':'Continuing accepts this invitation and opens the match.'}</Text>
  <PlayingIdentity es={es}/>
  <GoldPressable finish accessibilityRole="button" accessibilityLabel={es?'Continuar con invitación':'Continue with invitation'} disabled={!validName} onPress={()=>setConfirmed(true)} style={{minHeight:48,marginTop:20,backgroundColor:C.gold,borderRadius:12,alignItems:'center',justifyContent:'center',opacity:validName?1:.4}}><Text style={{color:C.background,fontWeight:'700'}}>{es?'Continuar con invitación':'Continue with invitation'}</Text></GoldPressable>
 </View>;
}
