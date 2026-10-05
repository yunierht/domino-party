import {value,type Round} from './engine.ts';
export const RESULT_READ_MS=2000;
export function describeResult(g:Round,es:boolean,dealerName='DEALER'){
 const p=value(g.player),d=value(g.dealer);
 const tone=g.result==='push'?'push':g.result==='blackjack'||g.result==='player'?'win':p.bust?'bust':'loss';
 const title=g.result==='push'?(es?'EMPATE':'PUSH'):p.bust?(es?'TE PASASTE':'YOU BUST'):d.bust?(es?`${dealerName} SE PASÓ`:`${dealerName} BUSTS`):d.natural?(es?`BLACKJACK DE ${dealerName}`:`${dealerName} BLACKJACK`):p.natural?'BLACKJACK!':g.result==='player'?(es?'GANASTE':'YOU WIN'):(es?`${dealerName} GANA`:`${dealerName} WINS`);
 const detail=p.bust||d.bust?'':p.natural&&d.natural?(es?'Ambos tienen blackjack natural':'Both have natural blackjack'):p.natural||d.natural?'':`${es?'Tú':'You'} ${p.total} · Dealer ${d.total}`;
 return {title,detail,tone,natural:p.natural||d.natural};
}
