import {value,shuffledDeck,dealerAction} from '../../../src/blackjack/engine.ts';
import type {Card} from '../../../src/blackjack/engine.ts';
export type Seat='human'|'computer';
export type Player={chips:number;bet:number;lastBet:number;hand:Card[];confirmed:boolean;status:'waiting'|'playing'|'stand'|'bust'|'skipped';result:{outcome:'win'|'loss'|'push'|'blackjack'|'skipped';stake:number;paid:number}|null};
export type BlackjackGame={round:number;phase:'betting'|'players'|'complete';bank:number;players:Record<Seat,Player>;dealer:Card[];deck:Card[];turn:Seat|null};
const seats:Seat[]=['human','computer'];
export function createGame(previous?:BlackjackGame):BlackjackGame{
 if(previous&&previous.phase!=='complete')throw Error('round_not_finished');
 const player=(seat:Seat):Player=>({chips:previous?.players[seat].chips??3000,bet:0,lastBet:previous?.players[seat].lastBet??0,hand:[],confirmed:false,status:'waiting',result:null});
 return {round:(previous?.round??0)+1,phase:'betting',bank:previous?.bank??5000,players:{human:player('human'),computer:player('computer')},dealer:[],deck:[],turn:null};
}
const liability=(g:BlackjackGame,s:Seat)=>{const p=g.players[s];return g.phase==='complete'||p.status==='bust'||p.status==='skipped'?0:p.bet*(g.phase==='betting'||value(p.hand).natural?1.5:1);};
export const reserved=(g:BlackjackGame)=>seats.reduce((n,s)=>n+liability(g,s),0);
export function legal(g:BlackjackGame,seat:Seat){
 const p=g.players[seat],enabled=g.phase==='players'&&g.turn===seat&&p.status==='playing';
 return {canBet:g.phase==='betting'&&!p.confirmed,maxBet:g.phase==='betting'&&!p.confirmed?Math.max(0,Math.floor(Math.min(p.chips,(g.bank-reserved(g))/1.5)/10)*10):0,
 canHit:enabled,canStand:enabled,canDouble:enabled&&p.hand.length===2&&p.chips>=p.bet&&g.bank>=reserved(g)-liability(g,seat)+2*p.bet};
}
function draw(g:BlackjackGame){const c=g.deck.shift();if(!c)throw Error('deck_depleted');return c;}
function settle(g:BlackjackGame):BlackjackGame{
 const d=value(g.dealer);for(const seat of seats){const p=g.players[seat],v=value(p.hand),stake=p.bet;
 const outcome=p.status==='skipped'?'skipped':v.bust?'loss':d.natural?v.natural?'push':'loss':v.natural?'blackjack':d.bust||v.total>d.total?'win':v.total===d.total?'push':'loss';
 const paid=outcome==='blackjack'?stake*2.5:outcome==='win'?stake*2:outcome==='push'?stake:0;
 g.bank+=stake-paid;p.chips+=paid;p.bet=0;p.result={outcome,stake,paid};
 }if(g.bank<0)throw Error('bank_invariant');g.phase='complete';g.turn=null;return g;
}
function next(g:BlackjackGame):BlackjackGame{
 g.turn=seats.find(s=>g.players[s].status==='playing')??null;if(g.turn)return g;
 // A bust never requires the dealer to draw; naturals already beat every non-natural.
 if(seats.some(s=>g.players[s].status==='stand'&&!value(g.players[s].hand).natural))while(dealerAction(g.dealer)==='hit')g.dealer.push(draw(g));
 return settle(g);
}
function deal(g:BlackjackGame,random:()=>number,orderedDeck?:Card[]):BlackjackGame{
 const playing=seats.filter(s=>g.players[s].bet>0);
 if(!playing.length){g.phase='complete';for(const s of seats)g.players[s].result={outcome:'skipped',stake:0,paid:0};return g;}
 const deck=orderedDeck??shuffledDeck(random);
 if(deck.length!==52||new Set(deck.map(c=>c.rank+c.suit)).size!==52||deck.some(c=>!Number.isInteger(c.rank)||c.rank<2||c.rank>14||!['s','h','d','c'].includes(c.suit)))throw Error('invalid_deck');
 g.deck=deck.map(c=>({...c}));for(let i=0;i<2;i++){for(const s of playing)g.players[s].hand.push(draw(g));g.dealer.push(draw(g));}
 g.phase='players';for(const s of playing)g.players[s].status=value(g.players[s].hand).natural?'stand':'playing';
 if(value(g.dealer).natural)return settle(g);return next(g);
}
export function confirmBet(game:BlackjackGame,seat:Seat,amount:number,random:()=>number,orderedDeck?:Card[]):BlackjackGame{
 if(game.phase!=='betting'||game.players[seat].confirmed)throw Error('illegal_action');
 if(!Number.isSafeInteger(amount)||amount<0||amount%10!==0||amount>game.players[seat].chips)throw Error('invalid_bet');
 if(amount*1.5+reserved(game)>game.bank)throw Error('bank_reserve');
 const g=structuredClone(game),p=g.players[seat];p.chips-=amount;p.bet=amount;p.confirmed=true;p.status=amount?'waiting':'skipped';if(amount)p.lastBet=amount;
 return seats.every(s=>g.players[s].confirmed)?deal(g,random,orderedDeck):g;
}
export function play(game:BlackjackGame,seat:Seat,action:'hit'|'stand'|'double'):BlackjackGame{
 if(game.phase!=='players'||game.turn!==seat)throw Error('not_your_turn');
 const g=structuredClone(game),p=g.players[seat];if(p.status!=='playing')throw Error('illegal_action');
 if(action==='stand')p.status='stand';
 else if(action==='hit'||action==='double'){
  if(action==='double'){if(p.hand.length!==2||p.chips<p.bet)throw Error('illegal_action');if(g.bank<reserved(g)-liability(g,seat)+2*p.bet)throw Error('bank_reserve');p.chips-=p.bet;p.bet*=2;}
  p.hand.push(draw(g));const v=value(p.hand);p.status=v.bust?'bust':action==='double'||v.total===21?'stand':'playing';
 }else throw Error('illegal_action');return next(g);
}
export function expire(game:BlackjackGame,random:()=>number):BlackjackGame{
 if(game.phase==='players'&&game.turn)return play(game,game.turn,'stand');
 if(game.phase!=='betting')return game;
 let next=game;for(const s of seats)if(!next.players[s].confirmed)next=confirmBet(next,s,0,random);return next;
}
export function project(g:BlackjackGame,seat:Seat){
 const shown=g.phase==='complete';return {round:g.round,stage:g.phase,bank:g.bank,bankAvailable:g.bank-reserved(g),turn:g.turn,
 players:Object.fromEntries(seats.map(s=>[s,{chips:g.players[s].chips,bet:g.players[s].bet,lastBet:g.players[s].lastBet,hand:g.players[s].hand.map(c=>({...c})),confirmed:g.players[s].confirmed,status:g.players[s].status,result:g.players[s].result?{...g.players[s].result}:null}])) as Record<Seat,Player>,
 dealer:(shown?g.dealer:g.dealer.slice(0,1)).map(c=>({...c})),dealerHidden:!shown&&g.dealer.length>1,legal:legal(g,seat)};
}
