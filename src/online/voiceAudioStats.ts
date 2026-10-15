/** Aggregate counters only: never expose SDP, addresses, identifiers or recorded audio. */
export function voiceAudioStats(reports:Iterable<Record<string,unknown>>){
 let capturedEnergy:number|null=null,receivedEnergy:number|null=null,sentBytes=0,receivedBytes=0,receivedPackets=0;
 for(const r of reports){
  if(r.kind!=='audio'&&r.mediaType!=='audio')continue;
  if(r.type==='media-source'&&typeof r.totalAudioEnergy==='number')capturedEnergy=(capturedEnergy??0)+r.totalAudioEnergy;
  if(r.type==='outbound-rtp'&&typeof r.bytesSent==='number')sentBytes+=r.bytesSent;
  if(r.type==='inbound-rtp'){
   if(typeof r.bytesReceived==='number')receivedBytes+=r.bytesReceived;
   if(typeof r.packetsReceived==='number')receivedPackets+=r.packetsReceived;
   if(typeof r.totalAudioEnergy==='number')receivedEnergy=(receivedEnergy??0)+r.totalAudioEnergy;
  }
 }
 return{capturedEnergy,sentBytes,receivedBytes,receivedPackets,receivedEnergy};
}