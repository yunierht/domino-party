import {useEffect,useRef,useState} from 'react';
import React from 'react';
import {Modal,Text,View} from 'react-native';
import {GoldPressable} from '../components/GoldPressable';
import {TABLE as C} from '../computer/tableTheme';
import {httpTransport} from './transport';
import {onlineEndpoint} from './endpoint';
import {credential,vault as dominoVault} from './credentialStorage';
import {vault as pokerVault} from '../poker/pokerCredentialStorage';
import {OnlineClient} from './client';
import {PokerOnlineClient} from '../poker/PokerOnlineClient';
export type InvitationGame='domino'|'poker';
export async function resolveInvitationGames(endpoint:string,code:string){
 if(!/^(?:\d{6}|[A-F0-9]{10})$/.test(code))throw Error('invalid_code');
 const raw=await httpTransport(endpoint).request('/invitations/'+code+'/games',await credential()) as {games?:unknown};
 if(!raw||!Array.isArray(raw.games)||raw.games.length>2||raw.games.some(g=>g!=='domino'&&g!=='poker')||new Set(raw.games).size!==raw.games.length)throw Error('invalid_snapshot');
 return raw.games as InvitationGame[];
}
/** The probe never joins. A collision requires another explicit game choice. */
export function useCodeInvitation({game,code,endpoint,name,avatar,photo,es,onJoined,explicitGame=false}:{explicitGame?:boolean;game:InvitationGame;code:string;endpoint:string|null;name:string;avatar:string;photo?:string;es:boolean;onJoined:(game:InvitationGame)=>void}){
 const choiceGeneration=useRef(0);
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[choices,setChoices]=useState<InvitationGame[]|null>(null);
 const generation=useRef(0),alive=useRef(true),locked=useRef(false),pending=useRef<OnlineClient|PokerOnlineClient|null>(null),same=useRef<()=>Promise<void>>(async()=>{});
 const valid=(n:number)=>{if(!alive.current||generation.current!==n)throw Error('cancelled_acceptance');};
 useEffect(()=>{generation.current++;void pending.current?.disconnect();pending.current=null;locked.current=false;setBusy(false);setError(null);setChoices(null);},[code]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;void pending.current?.disconnect();};},[]);
 async function choose(target:InvitationGame,n:number){
  valid(n);setChoices(null);
  if(target===game){await same.current();return;}
  const targetEndpoint=onlineEndpoint(target==='poker'?process.env.EXPO_PUBLIC_POKER_ONLINE_URL||process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL:process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);
  const transport=httpTransport(targetEndpoint),client=target==='poker'?new PokerOnlineClient(pokerVault,transport,credential,targetEndpoint):new OnlineClient(dominoVault,transport,credential,targetEndpoint);
  pending.current=client;await client.load();valid(n);if(client.state.error)throw Error(client.state.error);
  if(target==='poker')await (client as PokerOnlineClient).join(name,code,avatar,photo);else await (client as OnlineClient).join(name,code,{avatar,acceptInvitation:true,...(photo?{avatarPhoto:photo}:{})});
  valid(n);if(client.state.error||!client.state.view||client.state.status!=='connected')throw Error(client.state.error??'connection_error');
  pending.current=null;onJoined(target);
 }
 async function run(work:(n:number)=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(true);setError(null);const n=generation.current;try{await work(n);}catch(e){if(alive.current&&generation.current===n)setError(e instanceof Error?e.message:'connection_error');}finally{if(alive.current&&generation.current===n){locked.current=false;setBusy(false);}}}
 function accept(joinSame:()=>Promise<void>){same.current=joinSame;return run(async n=>{if(!endpoint)throw Error('connection_error');if(explicitGame){await joinSame();return;}const games=await resolveInvitationGames(endpoint,code);valid(n);if(!games.length)throw Error('not_found');if(games.length===2){choiceGeneration.current=n;setChoices(games);return;}await choose(games[0],n);});}
 const explanation=error?(error==='not_found'?(es?'Esta invitación ya no está disponible.':'This invitation is no longer available.'):error==='rate_limited'?(es?'Demasiados intentos. Espera y vuelve a intentar.':'Too many attempts. Wait and retry.'):(es?'No se pudo aceptar la invitación. Comprueba la conexión y reintenta.':'Could not accept the invitation. Check the connection and retry.')):null;
 const choiceStamp=choiceGeneration.current;
 const cancelChoice=()=>{generation.current++;setChoices(null);};
 const prompt=<>{explanation&&<Text testID="code-invitation-error" accessibilityRole="alert" style={{color:C.ivory,padding:12}}>{explanation}</Text>}<Modal visible={!!choices} transparent animationType="fade" onRequestClose={cancelChoice}><View style={{flex:1,backgroundColor:'rgba(2,12,10,.85)',padding:24,justifyContent:'center'}}><View style={{padding:20,gap:12,backgroundColor:C.surface,borderRadius:20}}><Text style={{color:C.ivory}}>{es?'Este código existe en ambos juegos. Elige el juego de la invitación.':'This code exists in both games. Choose the invitation’s game.'}</Text>{choices?.map(target=><GoldPressable key={target} finish testID={'invitation-game-'+target} disabled={busy} onPress={()=>void run(async()=>{valid(choiceStamp);await choose(target,choiceStamp);})} style={{minHeight:48,justifyContent:'center',alignItems:'center'}}><Text style={{color:C.goldLight}}>{target==='poker'?'Poker':'Dominó'}</Text></GoldPressable>)}<GoldPressable finish testID="invitation-game-cancel" onPress={cancelChoice} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:C.ivory}}>{es?'Cancelar':'Cancel'}</Text></GoldPressable></View></View></Modal></>;
 return {accept,busy,prompt};
}
