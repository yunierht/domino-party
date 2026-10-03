/** One reserved native player per placement; reset only while explicitly paused. */
interface Player {
 isLoaded:boolean;duration:number;muted:boolean;volume:number;
 play():void;pause():void;seekTo(time:number):Promise<void>;
 addListener(event:'playbackStatusUpdate',callback:(status:{isLoaded?:boolean;didJustFinish?:boolean;currentTime?:number})=>void):{remove():void};
}
export function createPlacementAudio({create,configure,android,random=Math.random,impactMs=[0,0,0,0,0],trace=()=>{}}:{create:(index:number)=>Player;configure:()=>Promise<void>;android:boolean;random?:()=>number;impactMs?:number[];trace?:(event:string,detail:Record<string,unknown>)=>void}) {
 type Slot={player:Player;ready:boolean;busy:boolean;warming?:Promise<void>;rewinding?:Promise<void>;token:number};
 const slots:Slot[]=[];
 const get=(i:number)=>slots[i]??=( {player:create(i),ready:false,busy:false,token:0} );
 const rewind=(s:Slot)=>{
  if(s.rewinding)return s.rewinding;
  s.ready=false;s.busy=true;
  s.rewinding=(async()=>{try{
   // ExoPlayer retains playWhenReady at EOF. Seeking without pause can replay
   // the entire clip without another JS play(), then leave reuse at EOF.
   s.player.pause();await s.player.seekTo(0);s.player.muted=false;s.player.volume=1;s.ready=true;
  }catch{trace('contact-reset-failed',{});}finally{s.busy=false;}})().finally(()=>{s.rewinding=undefined;});
  return s.rewinding;
 };
 function warm(s:Slot):Promise<void>{
  if(s.warming)return s.warming;if(s.ready||s.busy)return Promise.resolve();
  s.warming=new Promise<void>(resolve=>{
   let done=false,configured=false,started=false,loaded=s.player.isLoaded||s.player.duration>0;
   let listener:{remove():void}|undefined;
   const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);listener?.remove();try{s.player.pause();}catch{};if(ok)void rewind(s).then(resolve);else resolve();};
   const timer=setTimeout(()=>finish(false),3000);
   const start=()=>{if(done||started||!configured||!loaded)return;started=true;if(!android){finish(true);return;}try{s.player.muted=true;s.player.volume=0;if(!s.player.muted||s.player.volume!==0){finish(false);return;}s.player.play();}catch{finish(false);}};
   try{listener=s.player.addListener('playbackStatusUpdate',status=>{if(status.isLoaded){loaded=true;start();}if(started&&status.didJustFinish)finish(true);});
    void configure().then(()=>{configured=true;loaded||=s.player.isLoaded||s.player.duration>0;start();}).catch(()=>finish(false));
   }catch{finish(false);}
  }).finally(()=>{s.warming=undefined;});return s.warming;
 }
 return {
  async prepare(){await Promise.all(Array.from({length:5},(_,i)=>{try{return warm(get(i));}catch{return Promise.resolve();}}));},
  reserve(winning:boolean,context:Record<string,unknown>={}){
   let closed=false,played=false;let subscription:{remove():void}|undefined;let timer:ReturnType<typeof setTimeout>|undefined;
   const silent={impactMs:0,land(){},schedule(_ms:number,_enabled?:()=>boolean){},cancel(){}};
   let s:Slot;try{
    const available=winning?[get(4)]:Array.from({length:4},(_,i)=>get(i)).filter(slot=>slot.ready);
    if(!available.length)return silent;
    s=available[winning?0:Math.floor(random()*available.length)];
   }catch{return silent;}
   if(!s.ready)return silent;
   const token=++s.token;
   s.ready=false;s.busy=true; // Preparation cannot steal a reserved/playing player.
   const index=slots.indexOf(s),lead=impactMs[index];
   const cue={
    impactMs:lead,
    schedule(touchdownMs:number,enabled:()=>boolean=()=>true){
     if(closed||timer!==undefined)return;
     trace('contact-schedule',{...context,index,token,impactMs:lead,touchdownMs});
     timer=setTimeout(()=>{
      if(enabled())cue.land();else cue.cancel();
     },Math.max(0,touchdownMs-lead));
    },
    land(){
     if(closed)return;closed=true;
     // A slow resource misses this contact, rather than sounding after the tile.
     if(s.token!==token)return;
     try{
      let progressed=false;
      subscription=s.player.addListener('playbackStatusUpdate',status=>{
       if(!progressed&&(status.currentTime??0)>0){progressed=true;trace('contact-native-progress',{...context,index,token,currentTime:status.currentTime});}
       if(status.didJustFinish&&s.token===token){subscription?.remove();void rewind(s);}
      });
      trace('contact-play',{...context,index,token,impactMs:lead});
      s.player.muted=false;s.player.volume=1;s.player.play();played=true;
     }catch{subscription?.remove();void rewind(s);}
    },
    cancel(){closed=true;clearTimeout(timer);subscription?.remove();if(s.token===token){if(played){void rewind(s);}else {s.ready=true;s.busy=false;}}},
   };
   return cue;
  },
 };
}
