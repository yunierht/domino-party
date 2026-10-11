const CODE=/^[A-F0-9]{10}$/;
export function blackjackInvitation(code:string,base?:string,scheme='domino-online-test'){
 if(!CODE.test(code))throw Error('invalid_code');const url=new URL(base??`${scheme}://online`);
 if(base&&(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash))throw Error('invalid_invitation_base');
 url.searchParams.set('blackjackRoom',code);return url.toString();
}
export function parseBlackjackInvitation(value:string,base?:string,scheme='domino-online-test'):string|null{
 let url:URL;try{url=new URL(value);}catch{return null;}if(!url.searchParams.has('blackjackRoom'))return null;
 const root=base?new URL(base):null;
 const native=url.protocol===`${scheme}:`&&url.hostname==='online'&&['','/'].includes(url.pathname),web=root&&url.origin===root.origin&&url.pathname===root.pathname;
 if((!native&&!web)||url.username||url.password||url.hash||[...url.searchParams.keys()].some(k=>k!=='blackjackRoom')||url.searchParams.getAll('blackjackRoom').length!==1)return null;
 const code=url.searchParams.get('blackjackRoom')!.toUpperCase();return CODE.test(code)?code:null;
}
