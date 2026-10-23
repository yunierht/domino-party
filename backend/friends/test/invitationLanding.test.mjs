import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from '../../domino-online/node_modules/esbuild/lib/main.js';
const code=buildSync({entryPoints:['src/playRoutes.ts'],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {playLanding}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const id='a'.repeat(64),url=new URL('https://friends.example/play?invite='+id);
for(const [label,ua,expected,other] of [
 ['S24','Mozilla/5.0 (Linux; Android 14; SM-S921B) Chrome/130.0','android','ios'],
 ['Android Gmail WebView','Mozilla/5.0 (Linux; Android 14; wv) Version/4.0 Chrome/130 Mobile Safari/537.36','android','ios'],
 ['iPhone','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)','ios','android'],
 ['iPad','Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)','ios','android']
])test(label+' gets one correct install store without changing the public invitation',async()=>{
 const r=playLanding(url,ua),html=await r.text();assert.match(html,new RegExp('id="install-'+expected+'"(?! hidden)'));assert.match(html,new RegExp('id="install-'+other+'" hidden'));assert.ok(html.includes('dominoparty://play?invite='+id));assert.equal(r.headers.get('location'),null);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('invalid or injected tokens cannot become a store or app redirect',()=>{for(const q of ['invite=bad','invite='+id+'&store=https://evil.example','invite='+id+'&invite='+id])assert.throws(()=>playLanding(new URL('https://friends.example/play?'+q),'Android'),/invalid_invitation/);});
import vm from 'node:vm';
const helperCode=buildSync({entryPoints:['src/invitationLanding.ts'],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {invitationLanding}=await import('data:text/javascript;base64,'+Buffer.from(helperCode).toString('base64'));
async function browser({kind='play',serverUA='',userAgent='',platform='',maxTouchPoints=0}={}){
 const response=invitationLanding(kind,id,serverUA),html=await response.text(),timers=new Map(),listeners={},navigations=[],nodes={};let seq=0;
 for(const key of ['open-invitation','install-android','install-ios']){const raw=html.match(new RegExp('<a id="'+key+'"([^>]*)>'))[1];nodes[key]={href:raw.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'),hidden:/\bhidden\b/.test(raw),events:{},addEventListener(type,fn){this.events[type]=fn;}};}
 const document={hidden:false,body:{dataset:{platform:html.match(/data-platform="([^"]*)"/)[1]}},getElementById:key=>nodes[key],addEventListener:(type,fn)=>{listeners[type]=fn;}};
 const window={location:{set href(value){navigations.push(value);}},addEventListener:(type,fn)=>{listeners[type]=fn;}};
 vm.runInNewContext(html.match(/<script nonce="[^"]+">([\s\S]*)<\/script>/)[1],{document,navigator:{userAgent,platform,maxTouchPoints},window,setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:key=>timers.delete(key)});
 return {response,html,nodes,navigations,timers,hide(){document.hidden=true;listeners.visibilitychange();},pagehide(){listeners.pagehide();},fire(){const callbacks=[...timers.values()];timers.clear();for(const fn of callbacks)fn();}};
}
for(const kind of ['play','friend'])for(const [name,options,wanted] of [
 ['Android WebView',{userAgent:'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit Mobile Safari'},'android'],
 ['mixed UA prioritizes Android',{userAgent:'Android iPhone'},'android'],
 ['iPhone',{userAgent:'iPhone'},'ios'],
 ['iPadOS desktop UA',{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5},'ios'],
 ['desktop',{userAgent:'Windows',platform:'Win32'},null],
 ['Mac desktop',{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:0},null],
 ['unknown',{},null]
])test(kind+' simulated '+name,async()=>{const f=await browser({kind,...options});assert.equal(f.nodes['install-android'].hidden,wanted==='ios');assert.equal(f.nodes['install-ios'].hidden,wanted==='android');assert.equal(f.nodes['open-invitation'].href,'dominoparty://'+kind+'?invite='+id);f.fire();assert.equal(f.navigations.length,wanted?1:0);if(wanted)assert.ok(f.navigations[0].startsWith(wanted==='android'?'https://play.google.com/':'https://apps.apple.com/'));});
for(const cancel of ['hide','pagehide'])test(cancel+' prevents store diversion after opening or leaving the app',async()=>{const f=await browser({userAgent:'Android'});f.nodes['open-invitation'].events.click();f[cancel]();f.fire();assert.equal(f.navigations.length,0);});
test('blocked custom scheme retains a correct store fallback; manual install cancels duplicate navigation',async()=>{const f=await browser({userAgent:'Android'});f.nodes['open-invitation'].events.click();f.fire();assert.match(f.navigations[0],/^https:\/\/play.google.com\//);const g=await browser({userAgent:'iPhone'});g.nodes['install-ios'].events.click();g.fire();assert.equal(g.navigations.length,0);});
test('CSP nonce retained; only Android play installation transports a public locator',async()=>{const f=await browser({userAgent:'Android'}),nonce=f.html.match(/<script nonce="([^"]+)"/)[1];assert.ok(f.response.headers.get('content-security-policy').includes("script-src 'nonce-"+nonce+"'"));assert.equal(f.response.headers.get('vary'),'User-Agent');const ref=new URLSearchParams(new URL(f.nodes['install-android'].href).searchParams.get('referrer'));assert.equal(ref.get('dp_v'),'1');assert.equal(ref.get('dp_link'),'https://domino-friends-internal.domino-party.workers.dev/play?invite='+id);assert.equal(f.nodes['install-ios'].href.includes(id),false);assert.match(f.html,/ESTE MISMO enlace/);const g=await browser({kind:'friend',userAgent:'Android'});assert.equal(new URL(g.nodes['install-android'].href).searchParams.has('referrer'),false);});
