import type {PokerGame,Seat} from './engine';
const en=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
const esLabels=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
/** The heads-up engine returns all unmatched chips before reporting an even,
 * contested pot: each seat contributed pot/2. Refunds are not winnings. */
export function pokerNetProfit(result:NonNullable<PokerGame['result']>,seat:Seat):number|null{
 if(!Number.isSafeInteger(result.pot)||result.pot<0||result.pot%2!==0)return null;
 const matched=result.pot/2;
 return (result.winner==='tie'?matched:result.winner===seat?result.pot:0)-matched;
}
export function describePokerResult(g:Pick<PokerGame,'result'>,es:boolean,opponent:string,player='',self:Seat='human'){
 const r=g.result;if(!r)throw new Error('Finish the hand before presenting its result');
 const tone=r.winner==='tie'?'push':r.winner===self?'win':'loss';
 const winner=r.winner==='tie'?self:r.winner,net=pokerNetProfit(r,winner);
 const name=r.winner===self?player:opponent;
 const base=r.winner==='tie'?(es?'EMPATE':'TIE'):name?name.toUpperCase()+(es?' GANA':' WINS'):(es?'GANASTE':'YOU WIN');
 const amount=net===null?'':(net>0?'+':net<0?'-':'')+'$'+Math.abs(net).toLocaleString(es?'es':'en');
 const title=net===0?(r.winner==='tie'?(es?'EMPATE':'TIE'):(name|| (es?'T\u00fa':'You')).toUpperCase())+' \u00b7 '+amount:base+(amount?' '+amount:'');
 const rank=r.ranks?.[winner]?.[0],category=rank===undefined?'':(es?esLabels:en)[rank];
 const reason=r.reason==='fold'?(r.winner===self?(es?`${opponent} se retira`:`${opponent} folds`):(es?'Te retiras':'You fold')):category;
 return {tone,title,detail:[reason,net===null?(es?'Ganancia no disponible':'Profit unavailable'):''].filter(Boolean).join(' \u00b7 ')};
}
