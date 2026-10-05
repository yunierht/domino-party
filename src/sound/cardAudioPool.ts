interface Player {
 isLoaded:boolean;duration:number;volume:number;muted:boolean;
 play():void;pause():void;remove():void;seekTo(time:number):Promise<void>;
 addListener(event:'playbackStatusUpdate',callback:(status:{isLoaded?:boolean;didJustFinish?:boolean})=>void):{remove():void};
}
/** Poker/Blackjack only. Preload outside the flight and never replay an expired cue. */
export function createCardAudioPool({create,configure,setTimer=setTimeout,clearTimer=clearTimeout}:{create:()=>Player;configure:()=>Promise<void>;setTimer?:typeof setTimeout;clearTimer?:typeof clearTimeout}){
 type Slot={player:Player;loaded:boolean;configured:boolean;busy:boolean;dead:boolean;start?:()=>void;stop?:()=>void;listener?:{remove():void};loadTimer?:ReturnType<typeof setTimeout>};
 const slots:Slot[]=[];
 const discard=(s:Slot)=>{if(s.dead)return;s.dead=true;s.stop?.();clearTimer(s.loadTimer);s.listener?.remove();try{s.player.pause();s.player.remove();}catch{}};
 const add=()=>{
  let s:Slot;try{const player=create();s={player,loaded:player.isLoaded||player.duration>0,configured:false,busy:false,dead:false};slots.push(s);
   s.loadTimer=setTimer(()=>{if(!s.loaded)discard(s);},3000);
   s.listener=player.addListener('playbackStatusUpdate',status=>{if(s.dead)return;if(status.isLoaded){s.loaded=true;clearTimer(s.loadTimer);s.start?.();}if(status.didJustFinish)s.stop?.();});
   void configure().then(()=>{if(s.dead)return;s.configured=true;s.loaded ||= player.isLoaded||player.duration>0;if(s.loaded)clearTimer(s.loadTimer);s.start?.();}).catch(()=>discard(s));
  }catch{if(s!)discard(s);}
 };
 const prepare=()=>{for(let i=slots.length-1;i>=0;i--)if(slots[i].dead)slots.splice(i,1);for(let n=slots.filter(s=>!s.dead).length;n<4;n++)add();};
 return {prepare,play(){
  prepare();const s=slots.find(s=>!s.dead&&!s.busy&&s.loaded)??slots.find(s=>!s.dead&&!s.busy);if(!s)return()=>{};
  s.busy=true;let closed=false,started=false;let timer:ReturnType<typeof setTimeout>;let seeking:Promise<void>|undefined;
  const stop=()=>{if(closed)return;closed=true;clearTimer(timer);s.start=undefined;s.stop=undefined;
   // Keep the slot reserved until rewind completes, including cancelled seeks.
   try{s.player.pause();void Promise.resolve(seeking).then(()=>{s.player.pause();return s.player.seekTo(0);}).then(()=>{s.busy=false;}).catch(()=>discard(s));}catch{discard(s);}
  };
  s.stop=stop;s.start=()=>{if(closed||started||s.dead||!s.loaded||!s.configured)return;started=true;
   try{seeking=s.player.seekTo(0);void seeking.then(()=>{if(closed||s.dead)return;s.player.muted=false;s.player.volume=1;s.player.play();}).catch(()=>discard(s));}catch{discard(s);}
  };
  timer=setTimer(stop,600);s.start();return stop;
 }};
}
