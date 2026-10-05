import {createAudioPlayer,setAudioModeAsync,type AudioPlayer} from 'expo-audio';
/** Isolated Blackjack effects; does not change Domino or Poker's audio. */
export function playChipMove(kind:'bet'|'win'):()=>void {
 let cancelled=false,configured=false,started=false;
 let player:AudioPlayer|null=null;
 let subscription:{remove():void}|undefined;
 let timeout:ReturnType<typeof setTimeout>|undefined;
 const stop=()=>{if(cancelled)return;cancelled=true;clearTimeout(timeout);subscription?.remove();try{player?.pause();player?.remove();}catch{/* disposed */}};
 try{
  const source=kind==='bet'?require('../../assets/sounds/blackjack-chip-bet-v1.wav'):require('../../assets/sounds/blackjack-chip-win-v1.wav');
  player=createAudioPlayer(source,{downloadFirst:true});
  const start=()=>{if(cancelled||started||!configured||!player||!(player.isLoaded||player.duration>0))return;started=true;try{player.volume=.8;player.play();}catch{stop();}};
  subscription=player.addListener('playbackStatusUpdate',status=>{if(status.didJustFinish)stop();else start();});
  void setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'mixWithOthers'}).then(()=>{configured=true;start();}).catch(stop);
  timeout=setTimeout(stop,2500);
 }catch{stop();}
 return stop;
}
