import type {PokerGame} from './engine';
export function payoutAwards(g:PokerGame){
 const award={human:0,computer:0};const r=g.result;if(!r)return award;
 if(r.winner==='tie'){award.human=award.computer=Math.floor(r.pot/2);award[g.dealer==='human'?'computer':'human']+=r.pot%2;}else award[r.winner]=r.pot;
 return award;
}
