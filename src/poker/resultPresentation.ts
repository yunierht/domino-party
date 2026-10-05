import type {PokerGame} from './engine';
const en=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
const esLabels=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full house','Póker','Escalera de color'];
export function describePokerResult(g:PokerGame,es:boolean,opponent:string){
 const r=g.result;if(!r)throw new Error('Finish the hand before presenting its result');
 const tone=r.winner==='tie'?'push':r.winner==='human'?'win':'loss';
 const title=tone==='push'?(es?'BOTE REPARTIDO':'SPLIT POT'):tone==='win'?(es?'GANASTE':'YOU WIN'):opponent.toUpperCase()+(es?' GANA':' WINS');
 const winner=r.winner==='computer'?'computer':'human';const category=r.ranks?(es?esLabels:en)[r.ranks[winner][0]]:'';
 const reason=r.reason==='fold'?(r.winner==='human'?(es?`${opponent} se retira`:`${opponent} folds`):(es?'Te retiras':'You fold')):category;
 const pot=r.winner==='tie'?(es?`Bote compartido ${r.pot}`:`Shared pot ${r.pot}`):(es?`Bote ${r.pot}`:`Pot ${r.pot}`);
 return {tone,title,detail:[reason,pot].filter(Boolean).join(' · ')};
}
