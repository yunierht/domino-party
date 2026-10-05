import {newHand} from './engine.ts';
import type {PokerGame,Seat} from './engine';

export const REBUY_OPTIONS=[500,750,1000] as const;
export function bankruptSeat(game:PokerGame):Seat|null{
 if(!game.result)return null;
 return game.stacks.human===0?'human':game.stacks.computer===0?'computer':null;
}
/** Local virtual credit only. The other stack and normal dealer rotation survive. */
export function continuePoker(game:PokerGame,amount?:number,random=Math.random):PokerGame{
 if(!game.result)throw Error('Finish the current hand first');
 const seat=bankruptSeat(game);
 if(!seat){if(amount!==undefined)throw Error('No player needs a rebuy');return newHand(game,random);}
 if(!REBUY_OPTIONS.some(option=>option===amount))throw Error('Select a valid simulated chip amount');
 return newHand({...game,stacks:{...game.stacks,[seat]:amount!}},random);
}
