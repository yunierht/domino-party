import {defaultIceConfiguration} from './iceRuntime';
import type {IceResolver} from './iceConfiguration';
import type {VoicePlatform,VoiceMedia} from './voiceController';
export function createVoicePlatform(resolveIce:IceResolver=defaultIceConfiguration):VoicePlatform{
 const fixture=process.env.EXPO_PUBLIC_DOMINO_VOICE_TEST==='true'&&new URL(window.location.href).searchParams.get('voiceTest')==='1';
 return{fixture,available:()=>typeof RTCPeerConnection!=='undefined'&&(fixture||!!navigator.mediaDevices?.getUserMedia),async acquire(){
  const ice=await resolveIce();
  let context:AudioContext|undefined,oscillator:OscillatorNode|undefined;
  let stream:MediaStream;
  if(fixture){context=new AudioContext();const destination=context.createMediaStreamDestination(),gain=context.createGain();gain.gain.value=0;oscillator=context.createOscillator();oscillator.connect(gain);gain.connect(destination);oscillator.start();await context.resume();stream=destination.stream;}
  else try{stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});}catch(error){if(error instanceof DOMException&&error.name==='NotAllowedError')throw Error('microphone_denied');throw error;}
  const media:VoiceMedia={mute:muted=>stream.getAudioTracks().forEach(track=>{track.enabled=!muted;}),stop(){stream.getTracks().forEach(track=>track.stop());oscillator?.stop();if(context)void context.close();},peer(callbacks){
   const pc=new RTCPeerConnection({iceServers:ice.iceServers}),audio=document.createElement('audio');audio.autoplay=true;audio.setAttribute('playsinline','true');
   stream.getAudioTracks().forEach(track=>pc.addTrack(track,stream));
   pc.onicecandidate=event=>{const c=event.candidate;if(c)callbacks.ice({candidate:c.candidate,sdpMid:c.sdpMid,sdpMLineIndex:c.sdpMLineIndex});};
   pc.onconnectionstatechange=()=>callbacks.connection(pc.connectionState);
   pc.ontrack=event=>{if(event.track.kind!=='audio')return;audio.srcObject=event.streams[0]??new MediaStream([event.track]);void audio.play().catch(()=>callbacks.connection('failed'));};
   return{async offer(){await pc.setLocalDescription(await pc.createOffer());return pc.localDescription!.sdp;},async answer(){await pc.setLocalDescription(await pc.createAnswer());return pc.localDescription!.sdp;},remote:(type,sdp)=>pc.setRemoteDescription({type,sdp}),ice:candidate=>pc.addIceCandidate(candidate),close(){pc.close();audio.pause();audio.srcObject=null;}};
  }};return media;
 }};
}
