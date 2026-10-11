const CODE=/^[A-F0-9]{10}$/;
function baseUrl(value:string){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('invalid_invitation_base');return url;}
export function invitationLink(code:string,base?:string,scheme='dominoparty'){
 if(!CODE.test(code))throw Error('invalid_code');
 const url=base?baseUrl(base):new URL(`${scheme}://online`);url.searchParams.set('onlineRoom',code);return url.toString();
}
export function parseInvitationLink(value:string,base?:string,scheme='dominoparty'):{code:string}|{error:'invalid_invitation'}|null{
 let url:URL;try{url=new URL(value);}catch{return value.includes('onlineRoom')?{error:'invalid_invitation'}:null;}
 if(!url.searchParams.has('onlineRoom'))return null;
 try{
  const native=url.protocol===`${scheme}:`&&url.hostname==='online'&&['','/'].includes(url.pathname);
  const origin=base?baseUrl(base):null,web=origin&&url.origin===origin.origin&&url.pathname===origin.pathname;
  if((!native&&!web)||url.username||url.password||url.hash||[...url.searchParams.keys()].some(key=>key!=='onlineRoom')||url.searchParams.getAll('onlineRoom').length!==1)throw Error();
  const code=url.searchParams.get('onlineRoom')!.toUpperCase();if(!CODE.test(code))throw Error();return{code};
 }catch{return{error:'invalid_invitation'};}
}
export function sharePayload(code:string,es:boolean,base:string|undefined,phase:string,scheme='dominoparty',manualCode?:string){
 if(!['waiting','playing','paused'].includes(phase))throw Error('invitation_unavailable');
 if(manualCode!==undefined&&!/^\d{6}$/.test(manualCode))throw Error('invalid_code');
 const url=invitationLink(code,base,scheme),entry=manualCode??code;return{title:es?'Invitación a dominó':'Domino invitation',url,text:es?`Juguemos dominó. Código ${entry}.`:`Let's play dominoes. Code ${entry}.`};
}
