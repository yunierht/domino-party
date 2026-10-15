import {evaluate,bestFive,type Card} from './engine.ts';
export type PublicPokerCards={hero:readonly Card[];board:readonly Card[]};
type Counts={win:number;tie:number;loss:number;total:number};
export type PokerExample={rival:Card[];runout:Card[];heroBest:Card[];rivalBest:Card[];heroCategory:number;outcome:'win'|'tie'|'loss'};
export type PokerCategory=Counts&{category:number;example:PokerExample};
export type PokerAnalysis=Counts&{exact:boolean;pending:number;categories:PokerCategory[];heroCategories:{category:number;total:number}[]};
const completedAnalyses=new Map<string,PokerAnalysis>();
const key=(c:Card)=>`${c.rank}${c.suit}`;
export function validPokerCards(input:PublicPokerCards){return input.hero.length===2&&[0,3,4,5].includes(input.board.length)&&[...input.hero,...input.board].every(c=>Number.isInteger(c.rank)&&c.rank>=2&&c.rank<=14&&['s','h','d','c'].includes(c.suit))&&new Set([...input.hero,...input.board].map(key)).size===input.hero.length+input.board.length;}
export function oddsPercentages(counts:Counts){
 const names=['win','tie','loss'] as const,values=names.map(name=>counts[name]*1000/counts.total),units=values.map(Math.floor);
 for(let remaining=1000-units.reduce((a,b)=>a+b,0);remaining>0;remaining--){let best=0;for(let i=1;i<3;i++)if(values[i]-units[i]>values[best]-units[best])best=i;units[best]++;}
 return {win:units[0]/10,tie:units[1]/10,loss:units[2]/10};
}
function compare(a:number[],b:number[]){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??0)-(b[i]??0);if(d)return d;}return 0;}
/** Uniform legal unknown hands and future board, independent of CPU policy or hidden cards. */
export async function analyzePoker(input:PublicPokerCards,options:{samples?:number;cancelled?:()=>boolean;yieldNow?:()=>Promise<void>}={}):Promise<PokerAnalysis>{
 if(!validPokerCards(input))throw Error('invalid_visible_cards');
 if(options.cancelled?.())throw Error('analysis_cancelled');
 const cacheKey=JSON.stringify([input.hero,input.board,options.samples??1200]),cached=completedAnalyses.get(cacheKey);if(cached)return cached;
 const hero=input.hero.map(c=>({...c})),board=input.board.map(c=>({...c})),known=new Set([...hero,...board].map(key));
 const deck:Card[]=[];for(const suit of ['s','h','d','c'] as const)for(let rank=2;rank<=14;rank++)if(!known.has(key({rank,suit})))deck.push({rank,suit});
 const exact=board.length===5,pending=5-board.length,total=exact?deck.length*(deck.length-1)/2:options.samples??1200;
 if(!Number.isInteger(total)||total<1||total>10000)throw Error('invalid_sample_count');
 let seed=2166136261;for(const ch of [...hero,...board].map(key).sort().join('|'))seed=Math.imul(seed^ch.charCodeAt(0),16777619);if(!seed)seed=1;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const result:PokerAnalysis={exact,pending,total,win:0,tie:0,loss:0,categories:[],heroCategories:[]};
 const ownCategories=new Map<number,number>();
 const categories=new Map<number,PokerCategory>();let pairA=0,pairB=1;
 const fixedHeroRank=exact?evaluate([...hero,...board]):null;
 const yieldNow=options.yieldNow??(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
 for(let sample=0;sample<total;sample++){
  if(options.cancelled?.())throw Error('analysis_cancelled');
  let rival:Card[],runout:Card[];
  if(exact){rival=[deck[pairA],deck[pairB]];runout=[];if(++pairB===deck.length){pairA++;pairB=pairA+1;}}
  else{const remaining=[...deck],drawn:Card[]=[];for(let i=0;i<2+pending;i++){const index=i+Math.floor(random()*(remaining.length-i));[remaining[i],remaining[index]]=[remaining[index],remaining[i]];drawn.push(remaining[i]);}rival=drawn.slice(0,2);runout=drawn.slice(2);}
  const publicFinal=[...board,...runout],own=[...hero,...publicFinal],other=[...rival,...publicFinal];
  const heroRank=fixedHeroRank??evaluate(own),rivalRank=evaluate(other),score=compare(heroRank,rivalRank),outcome=score>0?'win':score<0?'loss':'tie';
  result[outcome]++;ownCategories.set(heroRank[0],(ownCategories.get(heroRank[0])??0)+1);
  let group=categories.get(rivalRank[0]);
  if(!group){group={category:rivalRank[0],total:0,win:0,tie:0,loss:0,example:{rival,runout,heroBest:bestFive(own),rivalBest:bestFive(other),heroCategory:heroRank[0],outcome}};categories.set(group.category,group);}
  group.total++;group[outcome]++;
  if((sample+1)%24===0)await yieldNow();
 }
 if(options.cancelled?.())throw Error('analysis_cancelled');
 result.heroCategories=[...ownCategories].map(([category,total])=>({category,total})).sort((a,b)=>b.total-a.total||a.category-b.category);
 result.categories=[...categories.values()].sort((a,b)=>b.total-a.total||a.category-b.category);
 if(completedAnalyses.size>=12)completedAnalyses.delete(completedAnalyses.keys().next().value!);completedAnalyses.set(cacheKey,result);
 return result;
}