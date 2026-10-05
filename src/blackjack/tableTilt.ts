type Drag={dx:number;dy:number;numberActiveTouches:number};
export function shouldTilt(g:Drag){return g.numberActiveTouches===1&&Math.abs(g.dy)>10&&Math.abs(g.dy)>Math.abs(g.dx)*1.5;}
export function dragTilt(start:number,dy:number){return Math.max(0,Math.min(20,start-dy/16));}
