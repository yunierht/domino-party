/** Isolated single-deck Blackjack: dealer stands on all 17 (S17). */
export type Card = {rank:number;suit:'s'|'h'|'d'|'c'};
export type Round = {player:Card[];dealer:Card[];deck:Card[];phase:'player'|'dealer'|'complete';result:'player'|'dealer'|'push'|'blackjack'|null};
export function value(cards:readonly Card[]){
 let total=0,aces=0;
 for(const c of cards){total+=c.rank===14?11:Math.min(c.rank,10);if(c.rank===14)aces++;}
 while(total>21&&aces>0){total-=10;aces--;}
 return {total,soft:aces>0,natural:cards.length===2&&total===21,bust:total>21};
}
export function shuffledDeck(rng= Math.random):Card[]{
 const deck:Card[]=[];
 for(const suit of ['s','h','d','c'] as const)for(let rank=2;rank<=14;rank++)deck.push({rank,suit});
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 return deck;
}
function finish(g:Round,result:NonNullable<Round['result']>):Round{return {...g,phase:'complete',result};}
export function newRound(deck:Card[]=shuffledDeck()):Round{
 if(deck.length<4)throw new Error('Four cards required');
 const g:Round={player:[deck[0],deck[2]],dealer:[deck[1],deck[3]],deck:deck.slice(4),phase:'player',result:null};
 const p=value(g.player),d=value(g.dealer);
 return p.natural||d.natural?finish(g,p.natural&&d.natural?'push':p.natural?'blackjack':'dealer'):g;
}
function requirePhase(g:Round,phase:Round['phase']){if(g.phase!==phase||g.result)throw new Error('Action out of turn');}
function draw(g:Round,who:'player'|'dealer'):Round{
 if(!g.deck.length)throw new Error('Deck depleted');
 return {...g,[who]:[...g[who],g.deck[0]],deck:g.deck.slice(1)};
}
export function hit(g:Round):Round{
 requirePhase(g,'player');const next=draw(g,'player');const p=value(next.player);
 return p.bust?finish(next,'dealer'):p.total===21?{...next,phase:'dealer'}:next;
}
export function stand(g:Round):Round{requirePhase(g,'player');return {...g,phase:'dealer'};}
/** The dealer policy depends only on its own cards, never player cards or deck. */
export function dealerAction(cards:readonly Card[]):'hit'|'stand'{return value(cards).total<17?'hit':'stand';}
function settle(g:Round):Round{
 const p=value(g.player),d=value(g.dealer);
 return finish(g,d.bust||p.total>d.total?'player':p.total===d.total?'push':'dealer');
}
export function dealerStep(g:Round):Round{
 requirePhase(g,'dealer');
 if(dealerAction(g.dealer)==='stand')return settle(g);
 const next=draw(g,'dealer');return value(next.dealer).total>=17?settle(next):next;
}
