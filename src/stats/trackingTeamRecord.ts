/** Completed-match totals use the same normalized team-name identity as the leaderboard. */
export type TrackingResultMatch={id:string;teams:readonly {id:string;name:string}[];winnerTeamId:string|null;finishedAt:number|null};
export type TrackingRecord={wins:number;losses:number};
export function trackingTeamRecord(matches:readonly TrackingResultMatch[],teamName:string):TrackingRecord {
 const key=teamName.trim().toLowerCase(),record={wins:0,losses:0};
 const unique=new Map(matches.map(match=>[match.id,match]));
 for(const match of unique.values()){
  if(match.finishedAt==null||!match.winnerTeamId||!match.teams.some(team=>team.id===match.winnerTeamId))continue;
  const team=match.teams.find(team=>team.name.trim().toLowerCase()===key);
  if(!team)continue;
  if(team.id===match.winnerTeamId)record.wins++;else record.losses++;
 }
 return record;
}
