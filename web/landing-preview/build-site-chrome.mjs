import {readFile,writeFile,cp} from 'node:fs/promises';
import path from 'node:path';
export async function buildSiteChrome(root){
 const source=path.join(root,'web/landing-preview');
 const landing=await readFile(path.join(source,'landing.html'),'utf8');
 const header=landing.match(/<header[\s\S]*?<\/header>/)[0].replaceAll('href="#','href="/#').replace(/<button class="header-follow" type="button" data-follow-open>([\s\S]*?)<\/button>/,'<a class="header-follow" href="/?follow=1">$1</a>');
 const footer=landing.match(/<footer[\s\S]*?<\/footer>/)[0].replace(/<span class="preview-label">[\s\S]*?<\/span>/,'');
 for(const name of ['site-chrome.css','site-chrome.js','gold-finish.css'])await cp(path.join(source,name),path.join(root,'docs/landing',name));
 for(const name of ['privacy','legal','join','contact']){
  const file=path.join(root,'docs',name,'index.html');let html=await readFile(file,'utf8');
  html=html.replace(/<body(?: class="[^"]*")?>/,'<body class="site-document'+(name==='join'?' join-document':'')+'">');
  if(name==='join')html=html.replace('src="../img/icon.png?v=social-club" alt="Domino Social Club"','src="/landing/logo-circle.svg" alt="Domino Social Club"');
  // Privacy's old header lived inside its narrow text wrapper. Move only that header out.
  html=html.replace(/<div class="wrap">\s*(<header[\s\S]*?<\/header>)/,'$1\n  <div class="wrap">');
  const pageHeader=header.replace('<a href="/'+name+'/">','<a href="/'+name+'/" aria-current="page">');
  html=/<header\b/.test(html)?html.replace(/<header[\s\S]*?<\/header>/,pageHeader):html.replace(/<body[^>]*>/,match=>match+'\n'+pageHeader);
  html=html.replace(/<footer id="site-footer">[\s\S]*?<\/footer>\s*/,'');
  const script=html.indexOf('<script');if(script<0)throw new Error('Document scripts missing: '+name);
  html=html.slice(0,script)+footer+'\n'+html.slice(script);
  html=html.replace(/<link[^>]+href="\/landing\/landing.css"[^>]*>/g,'');
  for(const asset of ['brand-lockup.css','site-chrome.css','gold-finish.css']){
   html=html.replace(new RegExp('<link[^>]+href="/landing/'+asset.replace('.','\\.')+'"[^>]*>','g'),'');
   html=html.replace('</head>','<link rel="stylesheet" href="/landing/'+asset+'"></head>');
  }
  html=html.replace(/<script src="\/landing\/site-chrome.js"><\/script>/g,'').replace('</body>','<script src="/landing/site-chrome.js"></script></body>');
  // Keep privacy's text translator; the canonical header replaces its removed back-link.
  html=html.replace(/document.getElementById\('back-link'\)\.textContent=lang==='es'\?'Volver al sitio':'Back to site';/,'');
  await writeFile(file,html.split(/\r?\n/).map(line=>line.trimEnd()).join('\n'));
 }
}
