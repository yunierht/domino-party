/** Offline heads-up no-limit Hold'em. Pure rules; no UI, storage or SDK dependencies. */
export type Seat = 'human' | 'computer';
export type Card = { rank: number; suit: 's' | 'h' | 'd' | 'c' };
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'complete';
export type Action = { type: 'fold' | 'check' | 'call' } | { type: 'raise'; to: number };
export interface PokerGame {
  hand: number; dealer: Seat; turn: Seat; street: Street;
  stacks: Record<Seat, number>; bets: Record<Seat, number>; total: Record<Seat, number>;
  holes: Record<Seat, Card[]>; board: Card[]; deck: Card[]; burned: Card[];
  currentBet: number; minRaise: number; pending: Seat[];
  result: { winner: Seat | 'tie'; reason: 'fold' | 'showdown'; pot: number; ranks?: Record<Seat, number[]> } | null;
  last: { player: Seat; action: Action } | null;
}
export const BIG_BLIND = 20;
const other = (seat: Seat): Seat => seat === 'human' ? 'computer' : 'human';
const seats: Seat[] = ['human', 'computer'];
function compare(a: number[], b: number[]) { for (let i=0;i<Math.max(a.length,b.length);i++) { const d=(a[i]??0)-(b[i]??0); if(d)return d; }return 0; }
function five(cards: Card[]): number[] {
  const ranks=cards.map(c=>c.rank).sort((a,b)=>b-a);
  const groups=[...new Set(ranks)].map(rank=>({rank,n:ranks.filter(r=>r===rank).length})).sort((a,b)=>b.n-a.n||b.rank-a.rank);
  const flush=cards.every(c=>c.suit===cards[0].suit);
  const unique=[...new Set(ranks)]; if(unique[0]===14)unique.push(1);
  let straight=0;for(let i=0;i<=unique.length-5;i++)if(unique[i]-unique[i+4]===4){straight=unique[i];break;}
  if(flush&&straight)return [8,straight];
  if(groups[0].n===4)return [7,groups[0].rank,groups[1].rank];
  if(groups[0].n===3&&groups[1].n===2)return [6,groups[0].rank,groups[1].rank];
  if(flush)return [5,...ranks];if(straight)return [4,straight];
  if(groups[0].n===3)return [3,...groups.map(g=>g.rank)];
  if(groups[0].n===2&&groups[1].n===2)return [2,...groups.map(g=>g.rank)];
  if(groups[0].n===2)return [1,...groups.map(g=>g.rank)];
  return [0,...ranks];
}
export function bestFive(cards: Card[]): Card[] {
  if(cards.length<5||cards.length>7)throw Error('Expected five to seven cards');
  let best:number[]=[];let chosen:Card[]=[];
  for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
    const candidate=[cards[a],cards[b],cards[c],cards[d],cards[e]];
    const rank=five(candidate);if(compare(rank,best)>0){best=rank;chosen=candidate;}
  }return chosen;
}
export function evaluate(cards: Card[]): number[] { return five(bestFive(cards)); }

// Cards forming the named combination, excluding unrelated kickers.
export function combinationCards(cards: Card[]): Card[] {
 if(cards.length===2)return cards[0].rank===cards[1].rank?[...cards]:[];
 const selected=bestFive(cards),rank=five(selected),category=rank[0];
 if(category===0)return selected.filter(c=>c.rank===rank[1]);
 if(category===1||category===3||category===7)return selected.filter(c=>c.rank===rank[1]);
 if(category===2)return selected.filter(c=>c.rank===rank[1]||c.rank===rank[2]);
 return selected;
}
function commit(g: PokerGame, seat: Seat, amount: number) { const n=Math.min(g.stacks[seat],amount);g.stacks[seat]-=n;g.bets[seat]+=n;g.total[seat]+=n; }
function drawStreet(g: PokerGame) {
  g.burned.push(g.deck.shift()!);
  const count=g.street==='preflop'?3:1;
  g.board.push(...g.deck.splice(0,count));
  g.street=g.street==='preflop'?'flop':g.street==='flop'?'turn':'river';
  g.bets={human:0,computer:0};g.currentBet=0;g.minRaise=BIG_BLIND;
}
function payout(g: PokerGame, folded?: Seat) {
  // Heads-up: unmatched chips are returned; no multiway side pot can exist.
  const matched=Math.min(g.total.human,g.total.computer);
  for(const seat of seats){g.stacks[seat]+=g.total[seat]-matched;g.total[seat]=matched;}
  const pot=matched*2;
  const ranks=folded?undefined:{human:evaluate([...g.holes.human,...g.board]),computer:evaluate([...g.holes.computer,...g.board])};
  const score=ranks?compare(ranks.human,ranks.computer):0;
  const winner=folded?other(folded):score>0?'human':score<0?'computer':'tie';
  if(winner==='tie'){g.stacks.human+=Math.floor(pot/2);g.stacks.computer+=Math.floor(pot/2);g.stacks[other(g.dealer)]+=pot%2;}else g.stacks[winner]+=pot;
  g.result={winner,reason:folded?'fold':'showdown',pot,ranks};g.street='complete';g.total={human:0,computer:0};g.bets={human:0,computer:0};g.pending=[];
}
function advance(g: PokerGame) {
  const allIn=seats.some(s=>g.stacks[s]===0);
  if(allIn){
    const owing=seats.find(s=>g.stacks[s]>0&&g.bets[s]<g.bets[other(s)]);
    if(owing){g.pending=[owing];g.turn=owing;return;}
    while(g.board.length<5)drawStreet(g);payout(g);return;
  }
  if(g.pending.length){g.turn=g.pending[0];return;}
  if(g.street==='river'){payout(g);return;}
  drawStreet(g);g.pending=[other(g.dealer),g.dealer];g.turn=g.pending[0];
}
export function newHand(previous?: PokerGame, random= Math.random, initial={human:1000,computer:1000}): PokerGame {
  if(previous&&!previous.result)throw Error('Finish the current hand first');
  const stacks={...(previous?.stacks??initial)};
  if(seats.some(s=>!Number.isInteger(stacks[s])||stacks[s]<=0))throw Error('Both players need chips');
  const deck:Card[]=[];for(const suit of ['s','h','d','c'] as const)for(let rank=2;rank<=14;rank++)deck.push({rank,suit});
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const dealer=previous?other(previous.dealer):'human';
  const holes:Record<Seat,Card[]>={human:[],computer:[]};
  for(let i=0;i<2;i++){holes[other(dealer)].push(deck.shift()!);holes[dealer].push(deck.shift()!);}
  const g:PokerGame={hand:(previous?.hand??0)+1,dealer,turn:dealer,street:'preflop',stacks,bets:{human:0,computer:0},total:{human:0,computer:0},holes,deck,board:[],burned:[],currentBet:BIG_BLIND,minRaise:BIG_BLIND,pending:[dealer,other(dealer)],result:null,last:null};
  commit(g,dealer,BIG_BLIND/2);commit(g,other(dealer),BIG_BLIND);
  advance(g);return g;
}
export function legalActions(g: PokerGame, seat: Seat) {
  const enabled=!g.result&&g.turn===seat&&g.stacks[seat]>0;
  const toCall=Math.max(0,g.currentBet-g.bets[seat]);
  const maxTo=g.bets[seat]+g.stacks[seat];
  return {enabled,toCall:Math.min(toCall,g.stacks[seat]),canCheck:enabled&&toCall===0,canRaise:enabled&&g.stacks[other(seat)]>0&&maxTo>g.currentBet,minTo:g.currentBet===0?BIG_BLIND:g.currentBet+g.minRaise,maxTo};
}
export function act(state: PokerGame, seat: Seat, action: Action): PokerGame {
  const legal=legalActions(state,seat);if(!legal.enabled)throw Error('Not your turn');
  const g:PokerGame={...state,stacks:{...state.stacks},bets:{...state.bets},total:{...state.total},board:[...state.board],deck:[...state.deck],burned:[...state.burned],pending:state.pending.filter(s=>s!==seat),last:{player:seat,action}};
  if(action.type==='fold'){payout(g,seat);return g;}
  if(action.type==='check'){if(!legal.canCheck)throw Error('Must call or fold');}
  else if(action.type==='call'){if(!legal.toCall)throw Error('Nothing to call');commit(g,seat,legal.toCall);}
  else {
    if(action.type!=='raise')throw Error('Unknown action');
    const to=action.to;
    if(!legal.canRaise||!Number.isInteger(to)||to>legal.maxTo||to<=g.currentBet||(to<legal.minTo&&to!==legal.maxTo))throw Error('Invalid raise');
    const increment=to-g.currentBet;commit(g,seat,to-g.bets[seat]);g.currentBet=to;
    if(increment>=g.minRaise)g.minRaise=increment;
    g.pending=[other(seat)];
  }
  advance(g);return g;
}
export function computerView(g: PokerGame) {
 // Unmatched opposing chips are returned by payout; they are not a reward for calling.
 const pot=g.total.computer+Math.min(g.total.human,g.total.computer+g.stacks.computer);
 return { cards:g.holes.computer,board:g.board,legal:legalActions(g,'computer'),pot,stack:g.stacks.computer };
}
/** Sample unknown cards, never the real opposing hand/deck. Large bets suggest a
 * stronger range; this is a heuristic estimate, not knowledge of hidden cards. */
function estimatedEquity(view: ReturnType<typeof computerView>,random:()=>number){
 const known=[...view.cards,...view.board];const unseen:Card[]=[];
 for(const suit of ['s','h','d','c'] as const)for(let rank=2;rank<=14;rank++)if(!known.some(c=>c.rank===rank&&c.suit===suit))unseen.push({rank,suit});
 const pressure=view.legal.toCall/Math.max(1,view.pot-view.legal.toCall);
 let score=0,weightSum=0,ties=0;
 for(let sample=0;sample<120;sample++){
  const pool=[...unseen];const draw=()=>pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0];
  const opposing=[draw(),draw()];const board=[...view.board];while(board.length<5)board.push(draw());
  const high=Math.max(opposing[0].rank,opposing[1].rank),low=Math.min(opposing[0].rank,opposing[1].rank);
  const preflop=opposing[0].rank===opposing[1].rank?.55+high/30:(high+low)/40+(opposing[0].suit===opposing[1].suit?.12:0);
  const category=view.board.length>=3?evaluate([...opposing,...view.board])[0]:0;
  const rangeStrength=view.board.length>=3?Math.min(1,.15+category*.22):Math.min(1,preflop);
  const weight=1+Math.min(4,pressure)*rangeStrength*rangeStrength*5;
  const comparison=compare(evaluate([...view.cards,...board]),evaluate([...opposing,...board]));
  score+=weight*(comparison>0?1:comparison===0?.5:0);weightSum+=weight;if(comparison===0)ties++;
 }
 return {equity:score/weightSum,allTies:ties===120};
}
/** Bounded Monte Carlo policy using own cards, public board and legal bet costs. */
export function chooseComputerAction(view: ReturnType<typeof computerView>, random=Math.random): Action {
 const {legal}=view;const {equity,allTies}=estimatedEquity(view,random);const roll=random();
 const odds=legal.toCall/Math.max(1,view.pot+legal.toCall);
 const exposure=legal.toCall/Math.max(1,view.stack);
 // Future streets can make marginal equity harder to realize. An all-in call
 // closes betting, so stack exposure alone must not demand an extra 10% equity.
 const futureBetting=legal.canRaise&&legal.toCall<view.stack?(5-view.board.length)/5:0;
 const margin=allTies?0:.015+exposure*.03*futureBetting;
 const adjusted=equity+(allTies?0:(roll-.5)*.04);
 if(!legal.canCheck&&adjusted<odds+margin)return {type:'fold'};
 const valueThreshold=view.board.length===0?.56:.60;
 const ranks=[...view.cards,...view.board].flatMap(c=>c.rank===14?[1,14]:[c.rank]);
 const flushDraw=view.board.length>=3&&view.board.length<5&&view.cards.some(c=>[...view.cards,...view.board].filter(x=>x.suit===c.suit).length===4);
 const straightDraw=view.board.length>=3&&view.board.length<5&&Array.from({length:10},(_,i)=>i+1).some(start=>new Set(ranks.filter(r=>r>=start&&r<start+5)).size===4&&view.cards.some(c=>c.rank>=start&&c.rank<start+5||(c.rank===14&&start===1)));
 const valueBet=equity>valueThreshold&&roll<(equity>.68?.80:.70);
 const semiBluff=legal.canCheck&&(flushDraw||straightDraw)&&equity>.38&&roll<.18;
 if(legal.canRaise&&!allTies&&(valueBet||semiBluff)){
  const ownBet=legal.maxTo-view.stack;
  return {type:'raise',to:Math.min(legal.maxTo,Math.max(legal.minTo,ownBet+legal.toCall+Math.floor((view.pot+legal.toCall)*(.5+roll*.3))))};
 }
 return {type:legal.canCheck?'check':'call'};
}
