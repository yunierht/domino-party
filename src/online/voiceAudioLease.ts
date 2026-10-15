export interface CallAudioManager {start(options:{media:'video';auto:true}):void;stop():void}
/** Share the native audio session so a cancelled late capture cannot stop a newer call. */
export function createVoiceAudioLease(manager:CallAudioManager){
 let owners=0;
 return{acquire(){
  if(owners===0){
   try{ // Video routing prefers the speaker while retaining automatic headset selection; capture remains audio-only.
    manager.start({media:'video',auto:true});
   }catch(error){try{manager.stop();}catch{}throw error;}
  }
  owners++;let released=false;
  return()=>{if(released)return;released=true;if(--owners===0)manager.stop();};
 }};
}