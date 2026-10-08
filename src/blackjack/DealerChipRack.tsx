import React from 'react';
import {Image,View,useWindowDimensions} from 'react-native';
import Svg,{Polygon} from 'react-native-svg';
import {dealerRackWidth,DEALER_RACK_TILT,DEALER_RACK_PERSPECTIVE} from './dealerRackPresentation';
/** Photographic dealer rack seated in a dark recessed opening in the felt. */
export function DealerChipRack({amount,name,testID,rackRef}:{amount:number;name:string;testID?:string;rackRef?:React.RefObject<View|null>}){
 const {width,height}=useWindowDimensions();const rackWidth=dealerRackWidth(width,height);const scale=rackWidth/168;const imageHeight=rackWidth/3;
 return <View ref={rackRef} testID={testID} accessible accessibilityRole="image" accessibilityLabel={`${name}, dealer chip rack`} accessibilityValue={{text:String(Math.max(0,Math.round(amount)))}} style={{width:rackWidth,height:48}}>
 <View pointerEvents="none" style={{width:rackWidth,height:48,transform:[{perspective:DEALER_RACK_PERSPECTIVE},{rotateX:`${DEALER_RACK_TILT}deg`}]}}>
 <Svg pointerEvents="none" width={rackWidth} height={48} style={{position:'absolute'}}><Polygon points={`${11*scale},${24-20*scale} ${157*scale},${24-20*scale} ${159*scale},${24+21*scale} ${9*scale},${24+21*scale}`} fill="#031A10" stroke="#08291A" strokeWidth={1.5}/></Svg>
 <Image accessible={false} source={require('../../assets/blackjack/dealer-chip-rack-realistic-v4.png')} resizeMode="contain" style={{position:'absolute',left:0,top:(48-imageHeight)/2,width:rackWidth,height:imageHeight}}/>
 </View>
 </View>;
}
