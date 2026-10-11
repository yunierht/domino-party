import React,{useMemo} from 'react';
import {View} from 'react-native';
import {PokerResultBanner} from '../poker/PokerResultBanner';
import {ResultHoldButton} from '../components/ResultHoldButton';

export function OnlineRoundResult({winnerName,tie,matchComplete,enabled,es,roundKey,holding,onHold,onRelease,holdAvailable=true,showHold=true}:{
  winnerName:string|null;
  tie:boolean;
  matchComplete:boolean;
  enabled:boolean;
  es:boolean;
  roundKey:string;
  holding:boolean;
  onHold:()=>void;
  onRelease:()=>void;
  holdAvailable?:boolean;
  showHold?:boolean;
}) {
  const presentationKey=useMemo(()=>({roundKey}),[roundKey]);
  const hasWinner=!tie&&winnerName!==null;
  const title=tie?(es?'Empate':'Tie'):hasWinner
    ?`${winnerName} ${es?(matchComplete?'ganó la partida':'ganó'):(matchComplete?'won the match':'won')}`
    :(es?'Ronda terminada':'Round finished');
  return <View testID="online-round-result" style={{width:'100%',minHeight:48,justifyContent:'center'}}>
    <PokerResultBanner key={roundKey} result={{title,detail:'',tone:hasWinner?'win':'push'}} paused={false}/>
    {showHold&&<ResultHoldButton id="online-result-hold" visible={!matchComplete&&holdAvailable} presentationKey={presentationKey}
      holding={holding} disabled={!enabled||matchComplete||!holdAvailable} es={es}
      onHold={()=>{if(enabled&&!matchComplete&&holdAvailable)onHold();}}
      onRelease={onRelease}/>}
  </View>;
}
