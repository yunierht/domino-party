import {defaultIceConfiguration} from './iceRuntime';
import type {IceResolver} from './iceConfiguration';
import {NativeModules,PermissionsAndroid,Platform} from 'react-native';
import type {VoicePlatform,VoiceMedia} from './voiceController';
import {createVoiceAudioLease} from './voiceAudioLease';
import {voiceAudioStats} from './voiceAudioStats';
const callAudio=createVoiceAudioLease({
 start:options=>require('react-native-incall-manager').default.start(options),
 stop:()=>require('react-native-incall-manager').default.stop(),
});
/** Lazy loading keeps Expo Go usable when its binary lacks the RTC module. */
export function createVoicePlatform(resolveIce:IceResolver=defaultIceConfiguration):VoicePlatform{
 return{available:()=>!!NativeModules.WebRTCModule&&(Platform.OS!=='android'||!!NativeModules.InCallManager),async acquire(){
  const ice=await resolveIce();
  if(!NativeModules.WebRTCModule||(Platform.OS==='android'&&!NativeModules.InCallManager))throw Error('voice_unavailable');
  if(Platform.OS==='android'&&await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)!==PermissionsAndroid.RESULTS.GRANTED)throw Error('microphone_denied');
  const rtc:typeof import('react-native-webrtc')=require('react-native-webrtc');
  const releaseAudio=Platform.OS==='android'?callAudio.acquire():()=>{};
  let stream:Awaited<ReturnType<typeof rtc.mediaDevices.getUserMedia>>;
  try{stream=await rtc.mediaDevices.getUserMedia({audio:true,video:false});}catch(error){releaseAudio();throw error;}
  let stopped=false;
  const media:VoiceMedia={mute:muted=>stream.getAudioTracks().forEach(track=>{track.enabled=!muted;}),stop(){if(stopped)return;stopped=true;try{stream.getTracks().forEach(track=>track.stop());}finally{try{stream.release();}finally{releaseAudio();}}},peer(callbacks){
   const pc=new rtc.RTCPeerConnection({iceServers:ice.iceServers});stream.getAudioTracks().forEach(track=>pc.addTrack(track,stream));
   pc.onicecandidate=(event:{candidate:InstanceType<typeof rtc.RTCIceCandidate>|null})=>{const c=event.candidate;if(c)callbacks.ice({candidate:c.candidate,sdpMid:c.sdpMid??null,sdpMLineIndex:c.sdpMLineIndex??null});};
   let closed=false,sampling=false;
   const sample=async()=>{if(closed||sampling)return;sampling=true;try{const reports=await pc.getStats();if(!closed)console.info('[voice-audio]',voiceAudioStats(reports.values()));}catch{/* Diagnostics must not interrupt a call. */}finally{sampling=false;}};
   const diagnostics=setInterval(()=>{void sample();},5000);
   pc.onconnectionstatechange=()=>{callbacks.connection(pc.connectionState);if(pc.connectionState==='connected')void sample();};
   return{async offer(){await pc.setLocalDescription(await pc.createOffer());return pc.localDescription!.sdp;},async answer(){await pc.setLocalDescription(await pc.createAnswer());return pc.localDescription!.sdp;},remote:(type,sdp)=>pc.setRemoteDescription(new rtc.RTCSessionDescription({type,sdp})),ice:candidate=>pc.addIceCandidate(new rtc.RTCIceCandidate(candidate)),close:()=>{if(closed)return;closed=true;clearInterval(diagnostics);pc.close();}};
  }};return media;
 }};
}
