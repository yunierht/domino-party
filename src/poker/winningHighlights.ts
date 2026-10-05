import {combinationCards} from './engine.ts';
import type {Card,PokerGame} from './engine';

/** Visual category only. Evaluation and kicker tie-breaks stay in the engine. */
export function winningHighlights(game:Pick<PokerGame,'board'|'holes'|'result'>):Card[]{
 if(game.result?.reason!=='showdown')return [];
 const seats=game.result.winner==='tie'?['human','computer'] as const:[game.result.winner];
 const unique=new Map<string,Card>();
 for(const seat of seats)for(const card of combinationCards([...game.board,...game.holes[seat]]))unique.set(`${card.rank}${card.suit}`,card);
 return [...unique.values()];
}
