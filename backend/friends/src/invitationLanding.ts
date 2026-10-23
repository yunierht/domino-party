import release from '../../../config/social-club-update.json';
import friends from '../../../config/friends.json';

/** Only the public installation page. Never reads or accepts an invitation. */
export function invitationPlatform(userAgent:string):'android'|'ios'|null {
 if(/android/i.test(userAgent))return 'android';
 return /iPhone|iPad|iPod/i.test(userAgent)?'ios':null;
}

export const invitationLandingScript=String.raw`(() => {
 const doc=document,open=doc.getElementById('open-invitation');
 const android=doc.getElementById('install-android'),ios=doc.getElementById('install-ios');
 const ua=navigator.userAgent||'';
 const platform=/android/i.test(ua)?'android':/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':doc.body.dataset.platform||null;
 android.hidden=platform==='ios';ios.hidden=platform==='android';
 if(platform==='android'&&android.href.includes('referrer=')){const hint=doc.getElementById('after-install');if(hint)hint.textContent='En Android, instala la actualización y pulsa Abrir para recuperar esta invitación. Si no aparece, vuelve a este mismo enlace.';}
 const store=platform==='android'?android.href:platform==='ios'?ios.href:null;
 let timer=null,departed=false;
 function cancel(){if(timer!==null)clearTimeout(timer);timer=null;}
 function schedule(){if(!store||departed||doc.hidden)return;timer=setTimeout(()=>{timer=null;if(!departed&&!doc.hidden)window.location.href=store;},2000);}
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){departed=true;cancel();}});
 window.addEventListener('pagehide',()=>{departed=true;cancel();});
 open.addEventListener('click',()=>{cancel();schedule();});
 android.addEventListener('click',cancel);ios.addEventListener('click',cancel);
 schedule();
})();`;

export function invitationLanding(kind:'play'|'friend',id:string,userAgent=''):Response {
 if(!/^[a-f0-9]{64}$/.test(id))throw Error('invalid_invitation');
 const platform=invitationPlatform(userAgent),nonce=crypto.randomUUID().replaceAll('-','');
 const appLink=release.scheme+'://'+kind+'?invite='+id;
 const androidStore=new URL(release.stores.android);
 if(kind==='play')androidStore.searchParams.set('referrer',new URLSearchParams({dp_v:'1',dp_link:friends.origin+'/play?invite='+id}).toString());
 const androidHref=androidStore.href.replaceAll('&','&amp;');
 const title=kind==='play'?'Invitaci&#243;n a jugar':'Invitaci&#243;n de amistad';
 const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Domino Social Club</title><style>[hidden]{display:none!important}body{font:17px system-ui;max-width:440px;margin:10vh auto;padding:24px;background:#081d1b;color:#f5efdb}a{display:block;padding:16px;margin:16px 0;border-radius:12px;background:#dab766;color:#081d1b;text-align:center;text-decoration:none}p{line-height:1.5}</style></head><body data-platform="${platform??''}"><h1>${title}</h1><p>Si ya tienes Domino Social Club, abre la invitaci&#243;n en la app.</p><a id="open-invitation" href="${appLink}">Abrir invitaci&#243;n</a><p>Si necesitas instalarla, usa la tienda de tu dispositivo. Volveremos a ella autom&#225;ticamente cuando podamos identificarlo.</p><a id="install-android"${platform==='ios'?' hidden':''} href="${androidHref}">Instalar desde Google Play</a><a id="install-ios"${platform==='android'?' hidden':''} href="${release.stores.ios}">Instalar desde App Store</a><p id="after-install">Despu&#233;s de instalar, vuelve al correo o mensaje y abre ESTE MISMO enlace para ver la invitaci&#243;n. Abrir la app desde la tienda no recupera el enlace autom&#225;ticamente.</p><noscript>Elige tu tienda para instalar y vuelve a este enlace despu&#233;s.</noscript><script nonce="${nonce}">${invitationLandingScript}</script></body></html>`;
 return new Response(html,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','vary':'User-Agent','content-security-policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`}});
}
