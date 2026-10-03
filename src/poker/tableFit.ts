/** Mirrors the felt geometry in DominoTableBackground, including its wrapper offsets. */
export function communityCardWidth(screenWidth:number,screenHeight:number,heroHeight:number,rowTop:number){
 const svgWidth=screenWidth+53;
 const svgTop=48+heroHeight-15;
 const svgHeight=Math.max(1,screenHeight-svgTop+70);
 const y=Math.max(14,Math.min(547,(rowTop-svgTop)/svgHeight*600));
 const t=(y-14)/(547-14);
 // Use the inside of the dark felt seam, then leave 9 logical pixels of air.
 const left=-30+(56-41*t)/400*svgWidth+9;
 const right=-30+(344+41*t)/400*svgWidth-9;
 const half=Math.min(screenWidth/2-left,right-screenWidth/2);
 return Math.max(24,(half*2-16)/5);
}
