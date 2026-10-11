import {useEffect,useRef} from 'react';
import {Platform} from 'react-native';
import * as Linking from 'expo-linking';
import appConfig from '../../app.json';
import {useNav} from '../nav/NavContext';
import {parsePokerInvitation} from './pokerInvitation';
/** Repeated link taps can reopen entry; only explicit acceptance joins a room. */
export function PokerOnlineLinkListener(){
 const nav=useNav(),latest=useRef(nav);latest.current=nav;
 useEffect(()=>{let alive=true,warm=false;
  const open=(url:string|null)=>{if(!alive||!url)return;const base=process.env.EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE||process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:undefined),code=parsePokerInvitation(url,base,appConfig.expo.scheme),current=latest.current;if(!code||current.screen==='pokerOnline'&&current.pendingPokerCode===code)return;current.openPokerOnline(code);};
  const subscription=Linking.addEventListener('url',event=>{warm=true;open(event.url);});
  void Linking.getInitialURL().then(url=>{if(!warm)open(url);}).catch(()=>{});
  return()=>{alive=false;subscription.remove();};
 },[]);return null;
}
