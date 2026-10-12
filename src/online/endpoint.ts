import {endpointForMode} from './networkPolicy.cjs';
export function onlineEndpoint(value?:string,mode=process.env.EXPO_PUBLIC_ONLINE_MODE??'lan',origin=process.env.EXPO_PUBLIC_ONLINE_ORIGIN):string{return endpointForMode(value,mode,origin);}
export function invitation(code:string,spanish:boolean):string{
  if(!/^[A-F0-9]{10}$/.test(code))throw Error('invalid_code');
  return spanish?`Juguemos dominó. Abre Domino Online y entra con el código ${code}.`:`Let's play dominoes. Open Domino Online and join with code ${code}.`;
}
