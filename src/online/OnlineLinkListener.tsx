import React,{useEffect,useRef} from 'react';
import {Platform} from 'react-native';
import * as Linking from 'expo-linking';
import appConfig from '../../app.json';
import {useNav} from '../nav/NavContext';
import {parseInvitationLink} from './invitationLink';
/** Every OS event is an intent; a late launch URL cannot override a newer event. */
export function OnlineLinkListener(){
 const nav=useNav(),latest=useRef(nav);latest.current=nav;
 useEffect(()=>{let alive=true,warm=false;
  const open=(url:string|null)=>{if(!alive||!url)return;const base=process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:undefined);const invitation=parseInvitationLink(url,base,appConfig.expo.scheme);if(!invitation)return;const code='code'in invitation?invitation.code:null,current=latest.current;if(current.screen==='onlineInvitation'&&current.onlineInvitation?.code===code)return;current.openOnlineInvitation(code);};
  const subscription=Linking.addEventListener('url',event=>{warm=true;open(event.url);});
  void Linking.getInitialURL().then(url=>{if(!warm)open(url);}).catch(()=>{});
  return()=>{alive=false;subscription.remove();};
 },[]);return null;
}
