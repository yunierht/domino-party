/** Own cards share a modest foreground perspective in Poker and Blackjack. */
export function tablePlayerCardWidth(width:number,usableHeight:number){
 return Math.round(Math.min(usableHeight<720?60:74,(width-52)/4)*1.08);
}
