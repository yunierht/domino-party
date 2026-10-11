// Canonical finish of Home's New Match (ui.Button primary); dimensions and
// typography remain with each consumer.
export const PRIMARY_BUTTON_GLOSS=['rgba(255,255,255,0.42)','rgba(255,255,255,0.06)','rgba(0,0,0,0.18)'] as const;
export function primaryButtonFinish(gradient:readonly [string,string],primary:string,pressed:boolean,s:(n:number)=>number){
 return{colors:pressed?[gradient[1],gradient[0]] as const:['#FFE08A',gradient[0],gradient[1]] as const,shadow:{shadowColor:primary,shadowOpacity:pressed?.18:.38,shadowRadius:pressed?s(8):s(16),shadowOffset:{width:0,height:pressed?s(3):s(9)},elevation:pressed?4:10}};
}

/** The original hue remains the middle stop; only illumination changes. */
export function tintedButtonFinish(color:string,pressed:boolean){const hex=/^#([a-f\d]{6})$/i.exec(color),rgb=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(color);const channels=hex?[parseInt(hex[1].slice(0,2),16),parseInt(hex[1].slice(2,4),16),parseInt(hex[1].slice(4,6),16)]:rgb?[Number(rgb[1]),Number(rgb[2]),Number(rgb[3])]:null,alpha=rgb?.[4]??'1';const shade=(towards:number,mix:number)=>channels?`rgba(${channels.map(n=>Math.round(n+(towards-n)*mix)).join(',')},${alpha})`:towards? 'rgba(255,255,255,0.10)':'rgba(0,0,0,0.12)';return{colors:(pressed?[shade(0,.18),color,shade(255,.1)]:[shade(255,.18),color,shade(0,.2)]) as readonly [string,string,string]};}
