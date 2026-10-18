// Prepared alternative only. Not imported by the automatic web form.
// Opening this URI creates a local draft; it never confirms a send or inbox delivery.
export function emailClientDraft({name,email,message},language='en') {
  if(typeof name!=='string'||name.trim().length<2||name.length>100||/[\r\n]/.test(name)||typeof email!=='string'||email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||typeof message!=='string'||message.trim().length<10||message.length>5000)throw new Error('invalid');
  const subject='Domino Social Club — website contact';
  const body='Name: '+name.trim()+'\nEmail: '+email.trim()+'\n\n'+message.trim();
  return {
    href:'mailto:yunierht@yahoo.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body),
    status:language==='es'?'Se abrirá tu aplicación de correo con un borrador. Revísalo y pulsa Enviar allí. Este sitio no puede confirmar el envío.':'Your email app will open with a draft. Review it and press Send there. This website cannot confirm sending.'
  };
}
