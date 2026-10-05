/** Cosmetic controls preserve the existing virtual wagering contract. */
export function addStake(stake:number,chip:number,balance:number){
 return Number.isInteger(chip)&&chip>=10&&chip%10===0&&stake+chip<=balance?stake+chip:stake;
}
export function winReturn(result:string|null,bet:number){return result==='blackjack'?bet*2.5:result==='player'?bet*2:0;}
