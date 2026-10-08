/** Shared Setup/marker anchor, measured inside the same safe-area viewport. */
export function trackingSetupComfort(availableHeight:number) {
  return Math.max(0,Math.min(1,(availableHeight-560)/(844-560)));
}
export function trackingSetupHeaderGap(availableHeight:number) {
  return Math.round(14+21*trackingSetupComfort(availableHeight));
}
export function trackingFirstCardTop(availableHeight:number,s:(n:number)=>number) {
  return 2+s(52)+s(8)-s(16)+trackingSetupHeaderGap(availableHeight);
}
