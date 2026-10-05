import {newRound,hit,stand,value} from './engine.ts';
import type {Round,Card} from './engine';
export type Session={game:Round|null;chips:number;bet:number;lastBet?:number;wins:number;losses:number;pushes:number;dealerChips:number};
export const initialSession=():Session=>({game:null,chips:1000,bet:0,wins:0,losses:0,pushes:0,dealerChips:0});
function settle(s:Session):Session{
 const result=s.game?.result;if(!result)return s;
 const win=result==='player'||result==='blackjack';
 return {...s,dealerChips:(s.dealerChips??0)+(result==='dealer'?s.bet:0),chips:s.chips+(result==='blackjack'?s.bet*2.5:result==='player'?s.bet*2:result==='push'?s.bet:0),wins:s.wins+(win?1:0),losses:s.losses+(result==='dealer'?1:0),pushes:s.pushes+(result==='push'?1:0)};
}
export function beginRound(s:Session,bet:number,deck?:Card[]):Session{
 if(s.game&&!s.game.result)throw Error('Finish current round');
 if(!Number.isInteger(bet)||bet<10||bet%10!==0||bet>s.chips)throw Error('Invalid bet');
 return settle({...s,game:newRound(deck),chips:s.chips-bet,bet,lastBet:bet});
}
export function updateRound(s:Session,next:Round|null):Session{
 if(!next||next===s.game||s.game?.result)return s;
 const updated={...s,game:next};return next.result?settle(updated):updated;
}
export function canDoubleDown(s:Session){return !!s.game&&s.game.phase==='player'&&!s.game.result&&s.game.player.length===2&&!value(s.game.player).natural&&s.bet>=10&&s.chips>=s.bet&&s.game.deck.length>0;}
export function doubleDownSession(s:Session):Session{
 if(!canDoubleDown(s)||!s.game)return s;
 const drawn=hit(s.game);const next=drawn.phase==='player'?stand(drawn):drawn;
 return settle({...s,game:next,chips:s.chips-s.bet,bet:s.bet*2});
}
export function repeatBetAmount(s:Session){const amount=s.lastBet??0;return (!s.game||!!s.game.result)&&Number.isInteger(amount)&&amount>=10&&amount%10===0&&amount<=s.chips?amount:0;}
export function advanceCompletedRound(s:Session,completed:Round,deck?:Card[]):Session{
 const amount=repeatBetAmount(s);return s.game===completed&&!!completed.result&&amount>0?beginRound(s,amount,deck):s;
}
