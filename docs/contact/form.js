(() => {
  const copy={en:{direct:'Open your email app to write to our team',home:'Home',score:'Score',sharing:'Live sharing',screens:'Screens',privacy:'Privacy',contact:'Contact',follow:'Follow a game',title:'Contact our team',intro:'Send a question or comment. Include your email so our team can reply.',name:'Name',email:'Email',message:'Message',note:'Submitting shares your name, email and message with our team.',submit:'Send message',sending:'Sending…',successTitle:'Message sent',close:'Got it',success:'Thank you for contacting us. Our team will review your message and get in touch as soon as possible.',unavailable:'The contact form is temporarily unavailable. You can use the email link above.',invalid:'Please check your name, email and message (10–5,000 characters).',rate:'Too many attempts. Please wait a minute before trying again.',error:'We could not confirm that your message was accepted. Your text is still here. Please try again later; an earlier attempt may have been accepted.'},es:{direct:'Abrir tu aplicación de correo para escribir a nuestro equipo',home:'Inicio',score:'Puntuación',sharing:'Compartir en vivo',screens:'Pantallas',privacy:'Privacidad',contact:'Contacto',follow:'Seguir una partida',title:'Contacta con nuestro equipo',intro:'Envíanos una pregunta o comentario. Incluye tu correo para que nuestro equipo pueda responderte.',name:'Nombre',email:'Correo electrónico',message:'Mensaje',note:'Al enviarlo compartirás tu nombre, correo y mensaje con nuestro equipo.',submit:'Enviar mensaje',sending:'Enviando…',successTitle:'Mensaje enviado',close:'Entendido',success:'Gracias por escribirnos. Nuestro equipo revisará tu mensaje y se pondrá en contacto contigo lo antes posible.',unavailable:'El formulario de contacto no está disponible temporalmente. Puedes usar el enlace de correo de arriba.',invalid:'Revisa tu nombre, correo y mensaje (10–5.000 caracteres).',rate:'Demasiados intentos. Espera un minuto antes de volver a intentarlo.',error:'No pudimos confirmar que tu mensaje fuera aceptado. Tu texto sigue aquí. Inténtalo más tarde; un intento anterior podría haberse aceptado.'}};
  const dialog=document.getElementById('contact-success'),close=document.getElementById('contact-success-close'),fallback=document.getElementById('contact-fallback');
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>button.focus());
  const form=document.getElementById('contact-form'),status=document.getElementById('contact-status'),button=document.getElementById('contact-submit');
  let lang='en',state='unavailable',pending=false,ready=false;
  try{lang=localStorage.getItem('domino-watch-lang')==='es'?'es':'en';}catch{}
  function render(){document.documentElement.lang=lang;document.title=copy[lang].contact+' | Domino Social Club';document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=copy[lang][el.dataset.copy]);document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));status.textContent=state&&state!=='success'?copy[lang][state]:'';fallback.hidden=ready&&state!=='unavailable';button.disabled=pending||!ready;if(pending)button.textContent=copy[lang].sending;}
  document.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>{lang=el.dataset.lang;try{localStorage.setItem('domino-watch-lang',lang);}catch{}render();}));
  document.addEventListener('site-language',event=>{lang=event.detail==='es'?'es':'en';render();});
  render();
  fetch('/api/contact',{headers:{Accept:'application/json'}}).then(async response=>{const data=await response.json();ready=response.ok&&data.available===true;state=ready?'':'unavailable';render();}).catch(()=>{state='unavailable';render();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!ready)return;if(!form.reportValidity()){state='invalid';render();return;}
    const values=new FormData(form);pending=true;state='';form.setAttribute('aria-busy','true');render();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(values)),signal:controller.signal});
      const data=await response.json();
      if(response.status===202&&data.ok===true&&data.code==='accepted'){state='success';form.reset();}
      else state=response.status===429?'rate':response.status===400?'invalid':response.status===503?'unavailable':'error';
    }catch{state='error';}finally{clearTimeout(timer);pending=false;form.setAttribute('aria-busy','false');render();if(state==='success'){dialog.showModal();close.focus();}else status.focus();}
  });
})();
