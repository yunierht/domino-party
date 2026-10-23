import {useEffect,useRef} from 'react';
import {AppState,NativeModules,Platform} from 'react-native';
import * as Linking from 'expo-linking';
import {useNav} from '../nav/NavContext';
import {useTheme} from '../theme/ThemeContext';
import {useGame} from '../state/GameContext';
import {usePlayInvitations} from '../friends/PlayInvitations';
import {randomToken} from '../friends/identity';
import {InstallationRecovery,parseInstallInvitation} from './installInvitation';
import type {InstallRecord} from './installInvitation';
import release from '../../config/social-club-update.json';
import friends from '../../config/friends.json';
type NativeReferrer={read:()=>Promise<InstallRecord>;consume:(key:string)=>Promise<unknown>;ignore:()=>Promise<unknown>};
export function AndroidInstallInvitation(){
 const nav=useNav(),play=usePlayInvitations(),{ready}=useTheme(),{loaded}=useGame(),hydrated=ready&&loaded,latest=useRef({nav,play,hydrated});latest.current={nav,play,hydrated};
 const eligible=!!play?.canRestoreInstallation();
 const changed=useRef<()=>void>(()=>{});
 useEffect(()=>{changed.current();},[nav.screen,eligible,hydrated]);
 useEffect(()=>{
  const native:NativeReferrer|undefined=NativeModules.InstallInvitationReferrer;
  if(Platform.OS!=='android'||!native)return;
  let alive=true,settled=false,superseded=false,active=AppState.currentState==='active',epoch=0;
  const timers:ReturnType<typeof setTimeout>[]=[];
  const safe=()=>latest.current.hydrated&&latest.current.nav.screen==='home'&&!!latest.current.play?.canRestoreInstallation();
  const ignore=()=>{if(superseded)return;superseded=true;epoch++;const persist=(attempt=0)=>{void native.ignore().catch(()=>{if(alive&&attempt<3)timers.push(setTimeout(()=>persist(attempt+1),[2000,10000,30000][attempt]));});};persist();};
  const recovery=new InstallationRecovery({
   read:()=>native.read(),consume:key=>native.consume(key),parse:r=>parseInstallInvitation(r,{online:release.origin,friends:friends.origin},Date.now()),
   current:()=>alive&&active&&settled&&!superseded&&safe(),generation:()=>epoch,
   resolve:async i=>{
    if(i.kind==='play')return latest.current.play!.previewInstallation(i.id);
    const token=await randomToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try{const response=await fetch(release.origin+'/invitations/'+i.id+'/games',{headers:{Authorization:'Bearer '+token},signal:controller.signal});
     if(response.status===404||response.status===410)return false;if(!response.ok)throw Error('retry');
     const body=await response.json();if(!Array.isArray(body.games))throw Error('retry');return body.games.includes(i.kind);
    }finally{clearTimeout(timer);}
   },
   deliver:i=>{if(!safe())return false;const current=latest.current;if(i.kind==='play')return current.play!.openInstallation(i.id);if(i.kind==='poker')current.nav.openPokerOnline(i.id);else current.nav.openOnlineInvitation(i.id);return true;}
  });
  const attempt=()=>{if(!settled||superseded||!active||!safe())return;void recovery.attempt();};
  function retry(){if(superseded)return;for(const timer of timers)clearTimeout(timer);timers.length=0;attempt();for(const ms of [2000,10000,30000,60000])timers.push(setTimeout(attempt,ms));}
  changed.current=()=>{epoch++;if(settled&&latest.current.nav.screen!=='home')ignore();else attempt();};
  const links=Linking.addEventListener('url',()=>ignore());
  const app=AppState.addEventListener('change',state=>{active=state==='active';epoch++;if(active)retry();});
  void Linking.getInitialURL().then(url=>{if(!alive)return;settled=true;if(url)ignore();else if(!safe()&&latest.current.nav.screen!=='home')ignore();else retry();}).catch(()=>{/* An unknown initial intent must not be replaced by a deferred one. */});
  return()=>{alive=false;epoch++;changed.current=()=>{};links.remove();app.remove();for(const t of timers)clearTimeout(t);};
 },[]);
 return null;
}
