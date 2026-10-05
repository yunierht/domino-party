import React from 'react';
import Svg,{Defs,LinearGradient,Stop,Rect,Path,G,Text as SvgText} from 'react-native-svg';
export function WoodSurface(){return <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none"><Defs><LinearGradient id="bjWood" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#4D2C1C"/><Stop offset="0.4" stopColor="#865335"/><Stop offset="1" stopColor="#603922"/></LinearGradient><LinearGradient id="bjLipShadow" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#080F0B" stopOpacity="0.8"/><Stop offset="1" stopColor="#080F0B" stopOpacity="0"/></LinearGradient></Defs><Rect width="400" height="100" fill="url(#bjWood)"/>{[33,48,66,82,94].map((y,i)=><Path key={y} d={`M0 ${y} Q100 ${y-4} 210 ${y+1} T400 ${y-2}`} fill="none" stroke={i%2?'#B88352':'#321B11'} strokeOpacity="0.19" strokeWidth="1"/>)}<Path d="M0 0 H400 V7 Q200 22 0 7 Z" fill="#0C271C"/><Path d="M0 7 Q200 22 400 7 L400 28 Q200 40 0 28 Z" fill="url(#bjLipShadow)"/><Path d="M0 7 Q200 22 400 7" fill="none" stroke="#AF9362" strokeOpacity="0.38" strokeWidth="1.2"/></Svg>;}
export function TableStamp({title,light=false,engraved=false,engravedText=false}:{title:string;light?:boolean;engraved?:boolean;engravedText?:boolean}){if(engraved)return <EngravedStamp title={title}/>;return <Svg width="100%" height={85} viewBox="0 0 300 85"><Path d="M135 20L131 8L141 14L150 4L159 14L169 8L165 20Z M136 24H164" fill="#8B9A71" opacity={.28} stroke="#8B9A71" strokeWidth={1}/><Path d="M135 19L131 7L141 13L150 3L159 13L169 7L165 19Z M136 23H164" fill={light?'#94A49B':'#031C12'} stroke={light?'#415D50':'#02170E'} strokeWidth={1.3}/><SvgText x={150} y={51.2} textAnchor="middle" fill={engravedText?'#62A17B':'#8B9A71'} opacity={engravedText?.55:.28} fontSize={23} fontWeight="700" letterSpacing={2}>{title}</SvgText><SvgText x={150} y={50} textAnchor="middle" fill={engravedText?'#123F2E':light?'#94A49B':'#031C12'} stroke={engravedText?'#0A3022':light?'#415D50':'#02170E'} strokeWidth={.65} opacity={engravedText?1:.88} fontSize={23} fontWeight="700" letterSpacing={2}>{title}</SvgText><SvgText x={150} y={70.2} textAnchor="middle" fill={engravedText?'#62A17B':'#8B9A71'} opacity={engravedText?.48:.25} fontSize={11} fontWeight="600" letterSpacing={3}>SOCIAL CLUB</SvgText><SvgText x={150} y={69} textAnchor="middle" fill={engravedText?'#123F2E':light?'#94A49B':'#031C12'} stroke={engravedText?'#0A3022':light?'#415D50':'#02170E'} strokeWidth={.35} opacity={engravedText?1:.85} fontSize={11} fontWeight="600" letterSpacing={3}>SOCIAL CLUB</SvgText></Svg>;}

/** Small original crown silhouette recessed into the felt; card games opt in. */
function EngravedStamp({title}:{title:string}){
 const crown='M136 26L132 16Q137 17 142 21L150 12L158 21Q163 17 168 16L164 26Q150 28 136 26Z';
 const band='M137 30Q150 32 163 30';
 return <Svg width="100%" height={85} viewBox="0 0 300 85" testID="engraved-table-stamp">
  <G transform="translate(0 1)" fill="#62A17B" stroke="#62A17B" opacity={.30}>
   <Path d={crown} strokeWidth={.9}/><Path d={band} fill="none" strokeWidth={.8}/>
  </G>
  <G testID="discreet-stamp-crown" fill="#123F2E" stroke="#123F2E" opacity={.82} strokeLinejoin="round" strokeLinecap="round">
   <Path d={crown} strokeWidth={.9}/><Path d={band} fill="none" strokeWidth={.8}/>
  </G>
  <SvgText x={150} y={53.3} textAnchor="middle" fill="#62A17B" opacity={.55} fontSize={23} fontWeight="700" letterSpacing={2}>{title}</SvgText>
  <SvgText x={150} y={52} textAnchor="middle" fill="#123F2E" stroke="#0A3022" strokeWidth={.65} fontSize={23} fontWeight="700" letterSpacing={2}>{title}</SvgText>
  <SvgText x={150} y={71.1} textAnchor="middle" fill="#62A17B" opacity={.48} fontSize={11} fontWeight="600" letterSpacing={3}>SOCIAL CLUB</SvgText>
  <SvgText x={150} y={70} textAnchor="middle" fill="#123F2E" stroke="#0A3022" strokeWidth={.35} fontSize={11} fontWeight="600" letterSpacing={3}>SOCIAL CLUB</SvgText>
 </Svg>;
}
