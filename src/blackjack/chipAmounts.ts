/** Exact virtual-chip values; presentation may overlap chips, never discard value. */
export function chipAmounts(amount:number,maxDenomination=100):number[]{
 let remaining=Math.max(0,Math.round(Number.isFinite(amount)?amount:0));const chips:number[]=[];
 for(const value of [100,50,20,10]){
  if(value>maxDenomination)continue;
  const count=Math.floor(remaining/value);for(let i=0;i<count;i++)chips.push(value);remaining-=count*value;
 }
 return chips;
}
/** Provide change across legal denominations without introducing an inventory ledger. */
export function bankrollCounts(amount:number):Record<number,number>{
 let remaining=Math.max(0,Math.round(Number.isFinite(amount)?amount:0));const smallCount=Math.min(10,Math.floor(remaining/300));const counts:Record<number,number>={10:smallCount,20:smallCount,50:smallCount,100:0};remaining-=smallCount*80;
 for(const value of chipAmounts(remaining))counts[value]=(counts[value]??0)+1;
 return counts;
}
