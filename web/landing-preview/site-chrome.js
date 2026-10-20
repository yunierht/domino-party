(() => {
 const es={'Score':'Puntuación','Live sharing':'Compartir en vivo','Screens':'Pantallas','Privacy':'Privacidad','Legal':'Legal','Contact':'Contacto','Follow a game':'Seguir una partida','Follow this domino match live':'Sigue esta partida de dominó en vivo','Open Domino Social Club and enter the game code.':'Abre Domino Social Club e introduce el código de la partida.','Open in the app':'Abrir en la app','Get it on Google Play':'Obtener en Google Play','Download on the App Store':'Descargar en App Store','Domino Social Club by YHT':'Domino Social Club de YHT'};
 const nodes=[];
 document.querySelectorAll('#site-header,#site-footer,.join-document>main').forEach(root=>{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){const text=node.nodeValue.trim();if(es[text])nodes.push({node,en:text});}
 });
 function apply(lang){
  if(typeof window.setLang==='function')window.setLang(lang);
  document.documentElement.lang=lang;
  nodes.forEach(({node,en})=>node.nodeValue=node.nodeValue.replace(node.nodeValue.trim(),lang==='es'?es[en]:en));
  document.querySelectorAll('[data-site-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.siteLang===lang)));
  document.querySelector('#site-header .brand').setAttribute('aria-label',lang==='es'?'Inicio de Domino Social Club':'Domino Social Club home');
  document.querySelector('#site-header nav').setAttribute('aria-label',lang==='es'?'Navegación principal':'Main navigation');
  document.querySelector('#site-header .site-lang-toggle').setAttribute('aria-label',lang==='es'?'Idioma del sitio web':'Website language');
  try{localStorage.setItem('domino-watch-lang',lang);}catch{}
  document.dispatchEvent(new CustomEvent('site-language',{detail:lang}));
 }
 document.querySelectorAll('[data-site-lang]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.siteLang)));
 let lang='en';try{lang=localStorage.getItem('domino-watch-lang')==='es'?'es':'en';}catch{}
 apply(lang);
})();
