(function(){
 const doc=document,android=doc.getElementById('install-android'),ios=doc.getElementById('install-ios');
 const ua=navigator.userAgent||'';
 const platform=/android/i.test(ua)?'android':/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':null;
 android.hidden=platform==='ios';ios.hidden=platform==='android';
 const store=platform==='android'?android.href:platform==='ios'?ios.href:null;
 if(!store)return;
 doc.getElementById('status').textContent=platform==='android'?'Abriendo Google Play… Si no se abre, toca el botón.':'Abriendo App Store… Si no se abre, toca el botón.';
 let timer=null;
 const cancel=()=>{if(timer!==null)window.clearTimeout(timer);timer=null;};
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
 window.addEventListener('pagehide',cancel);
 android.addEventListener('click',cancel);ios.addEventListener('click',cancel);
 if(!doc.hidden)timer=window.setTimeout(()=>{timer=null;if(!doc.hidden)window.location.replace(store);},1600);
})();
