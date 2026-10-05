/** Offline two-player double-six draw dominoes. No score-tracker or cloud state. */
export type Player = 'human' | 'computer';
export type ScoringMode = 'points' | 'wins';
export type End = 'left' | 'right';
export interface Tile { id: string; a: number; b: number }
export interface Result { winner: Player | 'tie'; points: number; blocked: boolean }
export interface Game {
  playerName: string;
  target: number;
  round: number;
  scores: Record<Player, number>;
  wins: Record<Player, number>;
  scoringMode: ScoringMode;
  scoringTargets: Record<ScoringMode, number>;
  hands: Record<Player, Tile[]>;
  stock: Tile[];
  /** Original boneyard positions, retained until the next deal. */
  stockSlots: string[];
  board: Tile[];
  openingId: string | null;
  openingRule: 'highest' | 'winner';
  turn: Player;
  passes: number;
  result: Result | null;
  last: { player: Player; kind: 'play' | 'draw' | 'pass'; tile?: Tile } | null;
}
export const other = (p: Player): Player => p === 'human' ? 'computer' : 'human';
export const pipTotal = (tiles: Tile[]) => tiles.reduce((n, t) => n + t.a + t.b, 0);

/** Doubles outrank every non-double; ties in pip sum favor the higher end. */
const openingRank = (t: Tile) => (t.a === t.b ? 100 : 0) + (t.a + t.b) * 7 + Math.max(t.a, t.b);
export function openingMove(hands: Record<Player, Tile[]>) {
  let best: { player: Player; tile: Tile } | null = null;
  for (const player of ['human', 'computer'] as const) for (const tile of hands[player]) {
    if (!best || openingRank(tile) > openingRank(best.tile)) best = { player, tile };
  }
  return best;
}
/** Historical name: identifies the ranked starter, never a mandatory tile to play. */
export function requiredOpening(game: Game) {
  return !game.board.length && game.openingRule !== 'winner' ? openingMove(game.hands) : null;
}
/** Opening eligibility is a rule, independent of endpoint geometry. */
export function legalEnds(game: Game, player: Player, tile: Tile): End[] {
  if (game.result || game.turn !== player) return [];
  // deal() already awards the turn. The priority tile grants that right only.
  if (!game.board.length) return ['right'];
  return endsFor(tile, game.board);
}

export function deal(playerName: string, target: number, random = Math.random, previous?: Game, scoringMode: ScoringMode = previous?.scoringMode ?? 'points'): Game {
  const deck: Tile[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) deck.push({ id: `${a}-${b}`, a, b });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const round = previous ? previous.round + 1 : 1;
  const hands = { human: deck.slice(0, 7), computer: deck.slice(7, 14) };
  const winner = previous?.result?.winner;
  const starter = winner === 'human' || winner === 'computer' ? winner : null;
  return {
    playerName, target: Math.max(1, Math.floor(target) || 100), round,
    scores: previous ? { ...previous.scores } : { human: 0, computer: 0 },
    wins: previous ? { ...previous.wins } : { human: 0, computer: 0 },
    scoringMode,
    scoringTargets: { points: 100, wins: 3, ...previous?.scoringTargets, [scoringMode]: Math.max(1, Math.floor(target) || 100) },
    hands,
    stock: deck.slice(14), stockSlots: deck.slice(14).map(tile => tile.id), board: [], openingId: null, turn: starter ?? openingMove(hands)!.player,
    openingRule: starter ? 'winner' : 'highest',
    passes: 0, result: null, last: null,
  };
}

/** Starts a new match while keeping the player's scoring preferences. */
export function restartMatch(game: Game, random = Math.random): Game {
  return { ...deal(game.playerName, game.target, random, undefined, game.scoringMode),
    scoringTargets: { ...game.scoringTargets } };
}

export function endsFor(tile: Tile, board: Tile[]): End[] {
  if (!board.length) return ['right'];
  const ends: End[] = [];
  const left = board[0].a, right = board[board.length - 1].b;
  if (tile.a === left || tile.b === left) ends.push('left');
  if (tile.a === right || tile.b === right) ends.push('right');
  return ends;
}
export const hasMove = (game: Game) => game.hands[game.turn].some(t => legalEnds(game, game.turn, t).length > 0);
export function matchWinner(game: Game): Player | null {
  const tally = game.scoringMode === 'wins' ? game.wins : game.scores;
  return tally.human >= game.target ? 'human' : tally.computer >= game.target ? 'computer' : null;
}
function finish(game: Game, winner: Player | 'tie', blocked: boolean): Game {
  const points = winner === 'tie' ? 0 : blocked
    ? pipTotal(game.hands[other(winner)]) - pipTotal(game.hands[winner])
    : pipTotal(game.hands[other(winner)]);
  return { ...game, result: { winner, points, blocked }, wins: {
    ...game.wins, ...(winner === 'tie' ? {} : { [winner]: game.wins[winner] + 1 }),
  }, scores: {
    ...game.scores, ...(winner === 'tie' ? {} : { [winner]: game.scores[winner] + points }),
  } };
}
export function play(game: Game, player: Player, id: string, end: End): Game {
  if (game.result || player !== game.turn) return game;
  const tile = game.hands[player].find(t => t.id === id);
  if (!tile || !legalEnds(game, player, tile).includes(end)) return game;
  let placed = tile;
  if (game.board.length) {
    const needsFlip = end === 'left' ? tile.b !== game.board[0].a : tile.a !== game.board[game.board.length - 1].b;
    if (needsFlip) placed = { ...tile, a: tile.b, b: tile.a };
  }
  const next: Game = { ...game,
    hands: { ...game.hands, [player]: game.hands[player].filter(t => t.id !== id) },
    board: end === 'left' ? [placed, ...game.board] : [...game.board, placed],
    openingId: game.board.length ? game.openingId : tile.id,
    turn: other(player), passes: 0, last: { player, kind: 'play', tile },
  };
  return next.hands[player].length ? next : finish(next, player, false);
}
export function drawOrPass(game: Game, player: Player, stockIndex = 0): Game {
  if (game.result || game.turn !== player || hasMove(game)) return game;
  if (game.stock.length && (!Number.isInteger(stockIndex) || stockIndex < 0 || stockIndex >= game.stock.length)) return game;
  if (game.stock.length) return { ...game,
    stock: game.stock.filter((_, index) => index !== stockIndex), hands: { ...game.hands, [player]: [...game.hands[player], game.stock[stockIndex]] },
    passes: 0, last: { player, kind: 'draw', tile: game.stock[stockIndex] },
  };
  const next = { ...game, turn: other(player), passes: game.passes + 1, last: { player, kind: 'pass' as const } };
  if (next.passes < 2) return next;
  const a = pipTotal(next.hands.human), b = pipTotal(next.hands.computer);
  return finish(next, a === b ? 'tie' : a < b ? 'human' : 'computer', true);
}

/** Strategy sees only its own hand and the public chain, never the user's tiles. */
export function chooseMove(hand: Tile[], board: Tile[], random=()=>.5): { id: string; end: End } | null {
  const candidates: {id:string;end:End;value:number}[]=[];
  const known=[...hand,...board];
  // Seven distinct double-six tiles contain each pip. Seen tiles are public;
  // our own tiles are known. Unseen tiles are not assigned to human or stock.
  const unseen=(pip:number)=>7-known.filter(t=>t.a===pip||t.b===pip).length;
  for (const tile of hand) for (const end of endsFor(tile, board)) {
    const rest=hand.filter(t=>t.id!==tile.id);
    const oldLeft=board[0]?.a,oldRight=board[board.length-1]?.b;
    const left=!board.length?tile.a:end==='left'?(tile.a===oldLeft?tile.b:tile.a):oldLeft;
    const right=!board.length?tile.b:end==='right'?(tile.a===oldRight?tile.b:tile.a):oldRight;
    const support=(pip:number)=>rest.filter(t=>t.a===pip||t.b===pip).length;
    const mobility=rest.filter(t=>t.a===left||t.b===left||t.a===right||t.b===right).length;
    const control=[...new Set([left,right])].reduce((sum,pip)=>sum+(support(pip)>0?(7-unseen(pip))*.8:0),0);
    // Do not force a lock merely because a pip is exhausted: preserve exits.
    const value=rest.length===0?10000:(tile.a+tile.b)*.9+(tile.a===tile.b?1:0)+mobility*3.5+control-(mobility===0?12:0);
    candidates.push({id:tile.id,end,value});
  }
  if(!candidates.length)return null;
  const best=Math.max(...candidates.map(c=>c.value));const near=candidates.filter(c=>c.value>=best-.8);
  const selected=near[Math.min(near.length-1,Math.floor(random()*near.length))];
  return {id:selected.id,end:selected.end};
}
export function computerStep(game: Game, random=Math.random): Game {
  if (game.turn !== 'computer' || game.result) return game;
  const move = chooseMove(game.hands.computer, game.board, random);
  return move ? play(game, 'computer', move.id, move.end) : drawOrPass(game, 'computer');
}
