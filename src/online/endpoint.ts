export function onlineEndpoint(value?:string):string{
  const url=new URL(value?.trim()||'http://127.0.0.1:8791');
  const octets=url.hostname.split('.').map(Number);
  const privateIP=octets.length===4&&octets.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(octets[0]===10||(octets[0]===192&&octets[1]===168)||(octets[0]===172&&octets[1]>=16&&octets[1]<=31));
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname)||privateIP;
  if(!local||!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('invalid_endpoint');
  return url.origin;
}
export function invitation(code:string,spanish:boolean):string{
  if(!/^[A-F0-9]{10}$/.test(code))throw Error('invalid_code');
  return spanish?`Juguemos dominó. Abre Domino Online y entra con el código ${code}.`:`Let's play dominoes. Open Domino Online and join with code ${code}.`;
}
