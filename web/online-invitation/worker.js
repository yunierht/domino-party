/** @type {Readonly<Record<string,string|undefined>>} */
const assets=Object.freeze({
 '/online/invite':'/online/invite/index.html',
 '/online/invite/':'/online/invite/index.html',
 '/online/invite/configuration.js':'/online/invite/configuration.js',
 '/online/invite/landing.js':'/online/invite/landing.js',
 '/.well-known/assetlinks.json':'/.well-known/assetlinks.json',
 '/.well-known/apple-app-site-association':'/.well-known/apple-app-site-association'
});
export default {
 /** @param {Request} request @param {Cloudflare.Env} env */
 async fetch(request,env){
  const url=new URL(request.url);
  if(!env.LINKS_HOST||url.hostname!==env.LINKS_HOST||url.protocol!=='https:')return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const path=assets[url.pathname];if(!path)return new Response('Not found',{status:404});
  try{
   const target=new URL(url.origin+path);
   // No credential-bearing headers, cookies, request body or invitation query enters the asset binding.
   const response=await env.ASSETS.fetch(new Request(target,{method:request.method}));
   if(!response.ok)return new Response('Not found',{status:404});
   const association=path.startsWith('/.well-known/'),html=path.endsWith('.html');
   const headers=new Headers(response.headers);
   headers.delete('location');headers.delete('set-cookie');
   headers.set('content-type',association?'application/json; charset=utf-8':html?'text/html; charset=utf-8':'application/javascript; charset=utf-8');
   headers.set('cache-control',html?'no-store':'public, max-age=300');
   headers.set('referrer-policy','no-referrer');headers.set('x-content-type-options','nosniff');
   if(html)headers.set('content-security-policy',"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
   return new Response(request.method==='HEAD'?null:response.body,{status:200,headers});
  }catch{return new Response('Temporarily unavailable',{status:503});}
 }
};
