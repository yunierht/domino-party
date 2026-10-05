/** A vertical gesture changes the total bet, always within legal stack limits. */
export function scrollRaise(start:number,dy:number,min:number,max:number,step=10) {
 return Math.max(Math.min(min,max),Math.min(max,start+Math.round(-dy/12)*step));
}
