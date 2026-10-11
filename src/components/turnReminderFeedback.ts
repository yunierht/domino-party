import {Platform} from 'react-native';import * as Haptics from 'expo-haptics';import {createAudioPlayer,type AudioPlayer} from 'expo-audio';
let player:AudioPlayer|null=null,sequence=0;
/** Cancellable soft tap; no changes to game audio configuration or device mute. */
export function turnReminderFeedback({vibration,sound,current}:{vibration:boolean;sound:boolean;current:()=>boolean}):()=>void{
 const captured=++sequence;
 if(vibration&&Platform.OS!=='web'&&current())try{void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});}catch{}
 let p:AudioPlayer|null=null;
 if(sound&&current())try{p=player??=createAudioPlayer(require('../../assets/sounds/tap.wav'),{keepAudioSessionActive:true});p.volume=.25;const selected=p;void selected.seekTo(0).then(()=>{if(current()&&captured===sequence)selected.play();}).catch(()=>{});}catch{}
 return()=>{if(captured===sequence){sequence++;try{p?.pause();}catch{}}};
}
