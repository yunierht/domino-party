export type RackBounds={x:number;y:number;width:number;height:number};
export const DEALER_RACK_TILT=18,DEALER_RACK_PERSPECTIVE=500;
export const dealerRackWidth=(width:number,height:number)=>width<360||height<720?Math.min(168,Math.max(96,width-212)):168;
export function dealerRackChannelPoint(denomination:number,frame:RackBounds){
 const index=[10,20,50,100].indexOf(denomination);if(index<0)throw Error('Unsupported dealer rack denomination');
 const dy=(frame.width/3)*.15,angle=DEALER_RACK_TILT*Math.PI/180,projection=1-dy*Math.sin(angle)/DEALER_RACK_PERSPECTIVE;
 return {x:frame.x+frame.width/2+(frame.width*((index+1)/5-.5))/projection,y:frame.y+frame.height/2+dy*Math.cos(angle)/projection};
}
