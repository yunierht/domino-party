import type {FriendsClient} from './client';
import type {PlayGame,PlayInvitation} from './playInvitation';
export type PlayView=Omit<PlayInvitation,'state'>&{state:PlayInvitation['state']|'expired';serverNow?:number;peer?:{code:string;name:string;avatar?:string;photo?:string|null}|null};
export type PlayPreview={id:string;from:string;game:PlayGame;acceptBy:number;state:string;peer?:{name:string}};
function parse(v:unknown):PlayView{if(!v||typeof v!=='object')throw Error('invalid_snapshot');const p=v as PlayView;if(!/^[a-f0-9]{64}$/.test(p.id)||!/^F-[A-F0-9]{8}$/.test(p.from)||p.to!==null&&!/^F-[A-F0-9]{8}$/.test(p.to)||!['domino','poker'].includes(p.game)||!['pending','accepted','preparing','ready','connected','cancelled','declined','expired'].includes(p.state)||!Number.isSafeInteger(p.acceptBy)||typeof p.readiness!=='object'||!p.readiness)throw Error('invalid_snapshot');return p;}
export class PlayClient{
 constructor(privateClient:FriendsClient){this.client=privateClient;}private client:FriendsClient;
 private async request(operation:string,id?:string,body?:unknown){return this.client.playRequest((id?'/'+id:'')+(operation?'/'+operation:''),body);}
 async list(){const raw=await this.request('') as {invitations?:unknown};if(!Array.isArray(raw?.invitations)||raw.invitations.length>100)throw Error('invalid_snapshot');return raw.invitations.map(parse);}
 async create(id:string,to:string|null,game:PlayGame){return parse(await this.request('',undefined,{id,to,game}));}
 async preview(id:string){const raw=await this.request('preview',id) as PlayPreview;if(!raw||raw.id!==id||!['domino','poker'].includes(raw.game)||!raw.peer?.name)throw Error('invalid_snapshot');return raw;}
 async read(id:string){return parse(await this.request('',id));}
 async accept(id:string){return parse(await this.request('accept',id,{}));}
 async decline(id:string){return parse(await this.request('decline',id,{}));}
 async ready(id:string,ready:boolean){return parse(await this.request('ready',id,{ready}));}
 async allocate(id:string){return parse(await this.request('allocate',id,{}));}
 async bind(id:string,allocation:string,roomToken:string){return parse(await this.request('bind',id,{allocation,roomToken}));}
 async attach(id:string,allocation:string,room:string,roomToken:string){return parse(await this.request('attach',id,{allocation,room,roomToken}));}
 async reset(id:string,allocation:string,room:string,roomToken:string){return parse(await this.request('reset',id,{allocation,room,roomToken}));}
 async complete(id:string,room:string,roomToken:string){return parse(await this.request('complete',id,{room,roomToken}));}
 async cancel(id:string,decline=false){return parse(await this.request('cancel',id,{decline}));}
}
