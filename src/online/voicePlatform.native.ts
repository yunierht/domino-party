import {NativeModules,PermissionsAndroid,Platform} from 'react-native';
import type {VoicePlatform,VoiceMedia} from './voiceController';
/** Lazy loading keeps Expo Go usable when its binary lacks the RTC module. */
export function createVoicePlatform():VoicePlatform{
 return{available:()=>!!NativeModules.WebRTCModule,async acquire(){
  if(!NativeModules.WebRTCModule)throw Error('voice_unavailable');
  if(Platform.OS==='android'&&await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)!==PermissionsAndroid.RESULTS.GRANTED)throw Error('microphone_denied');
  const rtc:typeof import('react-native-webrtc')=require('react-native-webrtc');
  const stream=await rtc.mediaDevices.getUserMedia({audio:true,video:false});
  const media:VoiceMedia={mute:muted=>stream.getAudioTracks().forEach(track=>{track.enabled=!muted;}),stop(){stream.getTracks().forEach(track=>track.stop());stream.release();},peer(callbacks){
   const pc=new rtc.RTCPeerConnection({iceServers:[]});stream.getAudioTracks().forEach(track=>pc.addTrack(track,stream));
   pc.onicecandidate=(event:{candidate:InstanceType<typeof rtc.RTCIceCandidate>|null})=>{const c=event.candidate;if(c)callbacks.ice({candidate:c.candidate,sdpMid:c.sdpMid??null,sdpMLineIndex:c.sdpMLineIndex??null});};
   pc.onconnectionstatechange=()=>callbacks.connection(pc.connectionState);
   return{async offer(){await pc.setLocalDescription(await pc.createOffer());return pc.localDescription!.sdp;},async answer(){await pc.setLocalDescription(await pc.createAnswer());return pc.localDescription!.sdp;},remote:(type,sdp)=>pc.setRemoteDescription(new rtc.RTCSessionDescription({type,sdp})),ice:candidate=>pc.addIceCandidate(new rtc.RTCIceCandidate(candidate)),close:()=>pc.close()};
  }};return media;
 }};
}
