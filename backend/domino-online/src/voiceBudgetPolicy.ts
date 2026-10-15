export type VoiceGrantDecision='granted'|'cooldown'|'daily_limit'|'monthly_limit';
export function voiceGrantDecision(globalCount:number,user:{day:string;count:number;last:number}|undefined,now:number):VoiceGrantDecision{
 const day=new Date(now).toISOString().slice(0,10);
 if(globalCount>=2000)return 'monthly_limit';
 if(user?.day===day&&user.count>=60)return 'daily_limit';
 if(user&&now-user.last<5000)return 'cooldown';
 return 'granted';
}
