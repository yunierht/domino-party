import type { Result } from './engine';
import type { DrinkGift } from './drinks';
export const ANDY_DRINK_DURATIONS = [400,220,250,240,240,500,350,220,220,220,200,600];
export const ANDY_DRINK_MS = ANDY_DRINK_DURATIONS.reduce((a,b)=>a+b,0);
export function canAndyDrink(opponentId: string, gift: DrinkGift, result: Result | null, reduced: boolean) {
  return !reduced && opponentId === 'rafael' && gift?.drinkId === 'heineken' && result?.winner === 'computer';
}
/** All frame callbacks are cancelled on replacement, navigation or reset. */
export function scheduleAndyFrames(show: (index: number) => void) {
  let elapsed=0,active=true;
  show(0);
  const timers=ANDY_DRINK_DURATIONS.slice(0,-1).map((duration,index)=>{
    elapsed+=duration;return setTimeout(()=>{if(active)show(index+1)},elapsed);
  });
  return ()=>{active=false;timers.forEach(clearTimeout);};
}
