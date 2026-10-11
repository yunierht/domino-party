import {useEffect,useRef} from 'react';
import {Platform} from 'react-native';
import * as Linking from 'expo-linking';
import appConfig from '../../app.json';
import {useNav} from '../nav/NavContext';
import {parseBlackjackInvitation} from './blackjackInvitation';
export function BlackjackOnlineLinkListener(){const url=Linking.useURL(),handled=useRef<string|null>(null),{openBlackjackOnline}=useNav();
 useEffect(()=>{if(!url||handled.current===url)return;handled.current=url;const base=process.env.EXPO_PUBLIC_BLACKJACK_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:undefined),code=parseBlackjackInvitation(url,base,appConfig.expo.scheme);if(code)openBlackjackOnline(code);},[url,openBlackjackOnline]);return null;
}
