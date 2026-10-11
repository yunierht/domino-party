/** Same resting geometry as Poker's existing 70px single pile. */
export const betPileStep=(capacity:number)=>Math.min(2,8/Math.max(1,capacity-1));
export function betPilePoint(layer:number,capacity:number,width=70,height=74){return{x:width/2,y:height-14-layer*betPileStep(capacity)-21*.92};}
