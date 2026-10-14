import type {Game,Player} from './engine';
export interface LocalClock {round:number;turn:Player;deal:Game['stockSlots'];remainingMs:number;deadline:number|null;manualPaused:boolean;boneyardOpen:boolean;drawn:boolean;handAtOpen:number}
export function syncLocalClock(previous:LocalClock|null,game:Game|null,now:number,paused:boolean,boneyardOpen:boolean):LocalClock|null{
 if(!game||game.result)return null;
 const fresh=!previous||previous.round!==game.round||previous.turn!==game.turn||previous.deal!==game.stockSlots;
 let next:LocalClock=fresh?{round:game.round,turn:game.turn,deal:game.stockSlots,remainingMs:30000,deadline:null,manualPaused:false,boneyardOpen:false,drawn:false,handAtOpen:0}:{...previous!,remainingMs:previous!.deadline===null?previous!.remainingMs:Math.max(0,previous!.deadline-now)};
 if(boneyardOpen&&!next.boneyardOpen)next={...next,remainingMs:30000,manualPaused:false,boneyardOpen:true,drawn:false,handAtOpen:game.hands[game.turn].length};
 if(boneyardOpen&&!next.drawn&&game.hands[game.turn].length>next.handAtOpen)next={...next,remainingMs:30000,drawn:true};
 if(!boneyardOpen)next={...next,boneyardOpen:false,drawn:false};
 return{...next,deadline:paused||next.manualPaused||(boneyardOpen&&!next.drawn)?null:now+next.remainingMs};
}
/** Match the Online timeout: yield once without tiles, score or blocked-round passes. */
export function expireLocalTurn(game:Game,clock:LocalClock|null,now:number):Game{
 if(!clock||game.result||clock.round!==game.round||clock.turn!==game.turn||clock.deal!==game.stockSlots||clock.manualPaused||clock.deadline===null||now<clock.deadline)return game;
 return {...game,turn:game.turn==='human'?'computer':'human',passes:0,last:{player:game.turn,kind:'pass'}};
}
