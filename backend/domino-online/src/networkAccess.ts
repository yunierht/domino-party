import {isLocalHost,publicOrigin} from '../../../src/online/networkPolicy.cjs';
export type AccessEnvironment={NETWORK_MODE?:string;LOCAL_ONLY?:string;PUBLIC_ORIGIN?:string;ALLOWED_WEB_ORIGINS?:string};
export function networkAccess(request:Request,env:AccessEnvironment):{mode:'lan'|'internet';error?:string;status?:number}{
 const url=new URL(request.url),mode=env.NETWORK_MODE??(env.LOCAL_ONLY==='true'?'lan':'invalid');
 if(mode!=='lan'&&mode!=='internet')return{mode:'lan',error:'network_not_configured',status:503};
 if(mode==='lan'){if(env.LOCAL_ONLY!=='true'||!isLocalHost(url.hostname))return{mode,error:'local_only',status:403};const origin=request.headers.get('origin');if(origin){try{if(!isLocalHost(new URL(origin).hostname))return{mode,error:'local_origin_only',status:403};}catch{return{mode,error:'invalid_origin',status:400};}}return{mode};}
 let approved:string,extra:string[];try{approved=publicOrigin(env.PUBLIC_ORIGIN??'');const raw=JSON.parse(env.ALLOWED_WEB_ORIGINS||'[]');if(!Array.isArray(raw)||raw.length>8||raw.some(v=>typeof v!=='string'))throw Error();extra=raw.map(publicOrigin);}catch{return{mode,error:'network_not_configured',status:503};}
 if(url.origin!==approved)return{mode,error:'unapproved_host',status:403};
 if(url.pathname==='/blackjack'||url.pathname.startsWith('/blackjack/'))return{mode,error:'not_found',status:404};
 const origin=request.headers.get('origin');if(origin&&![approved,...extra].includes(origin))return{mode,error:'unapproved_origin',status:403};
 return{mode};
}
