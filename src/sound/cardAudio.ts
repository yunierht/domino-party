import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {createCardAudioPool} from './cardAudioPool';
// Dedicated card players; Domino's players, preparation and session cache are untouched.
let mode:Promise<void>|null=null;
const pool=createCardAudioPool({create:()=>createAudioPlayer(require('../../assets/sounds/poker-card-deal-v1.wav'),{downloadFirst:true,updateInterval:25,keepAudioSessionActive:true}),configure:()=>mode??=setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'mixWithOthers'}).catch(e=>{mode=null;throw e;})});
export function prepareCardAudio(){pool.prepare();}
export function playPreparedCard(){return pool.play();}
