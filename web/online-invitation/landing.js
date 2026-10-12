(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.OnlineInvitationLanding=api;api.mount(root);}})(typeof window==='object'?window:globalThis,function(){
 function invitation(value){
  const url=new URL(value),keys=[...url.searchParams.keys()];
  const localPreview=url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.protocol!=='https:'&&!localPreview)throw Error('invalid_invitation');
  if(url.username||url.password||url.hash||keys.length!==1||!['onlineRoom','pokerRoom'].includes(keys[0])||!/^\/online\/invite\/?$/.test(url.pathname))throw Error('invalid_invitation');
  const code=(url.searchParams.get(keys[0])||'').toUpperCase();if(!/^[A-F0-9]{10}$/.test(code))throw Error('invalid_invitation');
  return{code,url:url.origin+'/online/invite?'+keys[0]+'='+code,...(keys[0]==='pokerRoom'?{game:'poker'}:{})};
 }
 function platform(navigator){return /android/i.test(navigator.userAgent||'')?'android':/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':null;}
 function mount(window){
  const doc=window.document,c=window.ONLINE_INVITATION_CONFIG||{purpose:'preview',scheme:'domino-online-test',stores:{}},byId=id=>doc.getElementById(id);
  let invite;try{invite=invitation(window.location.href);if(c.origin&&new URL(c.origin).origin!==window.location.origin)throw Error('wrong_host');}catch{byId('status').textContent='La invitación no es válida. Pide un enlace nuevo a quien te invitó.';return;}
  byId('room').textContent=invite.code;
  const game=invite.game==='poker'?'Poker':'Domino';const title=doc.getElementById('invitation-game-title');if(title)title.textContent=game+' Online';
  byId('status').textContent='Abre la app para aceptar esta invitación.';
  byId('scope').textContent=c.purpose==='release'?'':c.purpose==='preview'?'Vista previa local: identificador de ejemplo, no sala real.':'Piloto de prueba. No es una publicación en tiendas.';
  byId('return').hidden=false;
  const scheme=/^[a-z][a-z0-9+.-]*$/.test(c.scheme)&&!['http','https','javascript','data','file','intent'].includes(c.scheme)?c.scheme:null;
  if(scheme&&c.purpose!=='preview'){byId('open').href=scheme+'://online?'+(invite.game==='poker'?'pokerRoom':'onlineRoom')+'='+invite.code;byId('open').hidden=false;}
  const device=platform(window.navigator),store=device&&c.stores?.[device];
  let fallbackTimer=null;const cancelStoreRedirect=()=>{if(fallbackTimer!==null)window.clearTimeout(fallbackTimer);fallbackTimer=null;};
  if(store){const s=new URL(store);if(s.protocol==='https:'&&!s.username&&!s.password&&['play.google.com','apps.apple.com'].includes(s.hostname)){byId('install').href=s.href;byId('install').hidden=false;}}
  if(byId('install').hidden)byId('status').textContent='Instalación de prueba: usa la APK o la build iOS registrada. Conserva este enlace para volver después.';
  for(const [id,text] of [['copy-code',invite.code],['copy-link',invite.url]]){
   byId(id).disabled=!window.navigator.clipboard;byId(id).addEventListener('click',async()=>{cancelStoreRedirect();try{await window.navigator.clipboard.writeText(text);byId('status').textContent='Copiado.';}catch{byId('status').textContent='Selecciona y copia el identificador o la dirección manualmente.';}});
  }
  // OS verified app/universal links decide whether the installed app opens.
  // Only verified configured store URLs enable automatic fallback; staging defaults to manual installation.
  byId('open').addEventListener('click',cancelStoreRedirect);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancelStoreRedirect();});
  window.addEventListener('pagehide',cancelStoreRedirect);
  if(c.automaticStoreFallback===true&&!byId('install').hidden)fallbackTimer=window.setTimeout(()=>{if(!doc.hidden)window.location.replace(store);},1600);
 }
 return{invitation,platform,mount};
});
