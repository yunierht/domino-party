/** Mirrors the felt geometry in DominoTableBackground, including its wrapper offsets. */
export function communityCardWidth(screenWidth:number,screenHeight:number,heroHeight:number,rowTop:number,clearance=9,gap=4){
 const svgWidth=screenWidth+53;
 const svgTop=48+heroHeight-15;
 const svgHeight=Math.max(1,screenHeight-svgTop+70);
 const y=Math.max(14,Math.min(547,(rowTop-svgTop)/svgHeight*600));
 const t=(y-14)/(547-14);
 // Use the inside of the dark felt seam, then leave 9 logical pixels of air.
 const left=-30+(56-41*t)/400*svgWidth+clearance;
 const right=-30+(344+41*t)/400*svgWidth-clearance;
 const half=Math.min(screenWidth/2-left,right-screenWidth/2);
 return Math.max(24,(half*2-4*gap)/5);
}
/** Reserve the hand and bottom action lane before assigning empty community space. */
export function pokerBoardZoneHeight(panelHeight:number,heroHeight:number,footerHeight:number,hintHeight:number,preferred:number,messageHeight=64){
 return Math.max(36,Math.min(preferred,panelHeight-48-heroHeight-86-hintHeight-117-footerHeight-messageHeight-55));
}

/** A narrow hand shares x with the pot: reserve its label plus four pixels below the cards. */
export function pokerPotBottom(panelHeight:number,footerHeight:number,handBottom:number,narrow:boolean,compact:boolean){
 const ordinary=footerHeight+(compact?44:58);
 return narrow&&handBottom>0?Math.min(ordinary,panelHeight-handBottom-21-74):ordinary;
}
