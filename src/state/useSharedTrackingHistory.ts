import {useEffect,useState} from 'react';
import type {Match} from '../types';
import {subscribeHistorySpace} from '../firebase/sync';
/** Only the followed host's archive: never substitute this device's unrelated local history. */
export function useSharedTrackingHistory(spaceId?:string):Match[]|null {
 const [state,setState]=useState<{key?:string;matches:Match[]|null}>({matches:null});
 useEffect(()=>{
  if(!spaceId)return;
  let alive=true;setState({key:spaceId,matches:null});
  let stop=()=>{};
  try{stop=subscribeHistorySpace(spaceId,matches=>{if(alive)setState({key:spaceId,matches});},()=>{if(alive)setState({key:spaceId,matches:null});});}catch{setState({key:spaceId,matches:null});}
  return()=>{alive=false;stop();};
 },[spaceId]);
 return spaceId&&state.key===spaceId?state.matches:null;
}
