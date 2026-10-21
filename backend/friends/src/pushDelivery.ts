import type {PushTicket} from './pushTransport';
export type Delivery={token:string;status:'pending'|'receipt'|'done';attempts:number;next:number;receipt?:string;error?:string};
export function retryDelivery(d:Delivery,error:string,now:number):Delivery{const attempts=d.attempts+1;return {...d,attempts,receipt:undefined,error,status:attempts>=5||error==='push_configuration'?'done':'pending',next:now+Math.min(60*60_000,10000*2**attempts)};}
export function ticketDelivery(d:Delivery,t:PushTicket,now:number):Delivery{if(t.receipt)return {...d,status:'receipt',receipt:t.receipt,error:undefined,next:now+15*60_000};if(t.retry)return retryDelivery(d,'MessageRateExceeded',now);return {...d,status:'done',error:t.invalid?'DeviceNotRegistered':t.error??'push_rejected'};}
export function receiptDelivery(d:Delivery,result:{status?:string;details?:{error?:string}}|undefined,now:number,created:number):Delivery{
 if(!result)return now-created>=24*60*60_000?{...d,status:'done',error:'receipt_missing'}:{...d,next:now+15*60_000};
 if(result.status==='ok')return {...d,status:'done',error:undefined};const error=result.details?.error??'receipt_rejected';return error==='MessageRateExceeded'?retryDelivery(d,error,now):{...d,status:'done',error};
}
