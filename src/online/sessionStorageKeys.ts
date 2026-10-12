import {publicOrigin} from './networkPolicy.cjs';
export function sessionStorageKeys(game:'domino'|'poker',endpoint:string,mode=process.env.EXPO_PUBLIC_ONLINE_MODE??'lan'){
 const legacy=game+'-online.session.v1';if(mode==='lan')return{session:legacy,photos:game+'-online.session-photo.v1.'};
 if(mode!=='internet')throw Error('invalid_endpoint');const encoded=Array.from(publicOrigin(endpoint)).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');const session=game+'-online.internet.session.v1.'+encoded;return{session,photos:session+'.photo.'};
}
