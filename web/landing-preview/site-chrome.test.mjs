import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=name=>readFile(new URL('../../docs/'+name,import.meta.url),'utf8');
const normalize=value=>value.replaceAll('\r\n','\n');
const home=await read('index.html');
const brand=home.match(/<a class="brand"[\s\S]*?<\/a>/)[0];
const locale=home.match(/<div class="site-lang-toggle"[\s\S]*?<\/div>/)[0];
for(const name of ['privacy','legal','contact','join']){
 const html=await read(name+'/index.html');
 assert.equal((html.match(/id="site-header"/g)||[]).length,1);
 assert.equal((html.match(/id="site-footer"/g)||[]).length,1);
 assert.ok(html.includes(brand),name+' must use the exact homepage brand HTML');
 assert.ok(html.includes(locale),name+' must use the exact homepage EN/ES HTML');
 assert.ok(html.includes('href="/?follow=1"'));
 assert.ok(html.includes('/landing/site-chrome.js'));
 for(const asset of ['brand-lockup.css','site-chrome.css','gold-finish.css'])assert.ok(html.includes('/landing/'+asset));
 for(const script of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g))new Function(script[1]);
 if(name==='legal'||name==='privacy'){
  const prior=execFileSync('git',['show','HEAD:docs/'+name+'/index.html'],{encoding:'utf8'});
  assert.equal(normalize(html.match(/<main\b[\s\S]*?<\/main>/)[0]),normalize(prior.match(/<main\b[\s\S]*?<\/main>/)[0]),name+' policy text must stay unchanged');
 }
 if(name==='join'){
  const prior=execFileSync('git',['show','HEAD:docs/join/index.html'],{encoding:'utf8'});
  assert.equal(normalize(html.match(/<script>([\s\S]*?)<\/script>/)[1]),normalize(prior.match(/<script>([\s\S]*?)<\/script>/)[1]),'native handoff and store fallbacks unchanged');
 }
}
const gold=await read('landing/gold-finish.css');
assert.match(gold,/#FFE08A,#F1C46B 48%,#B8832F/);
assert.match(gold,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(gold,/#contact-submit:disabled[^}]+animation:none/);
assert.doesNotMatch(gold,/(?:padding|margin|height|width|font-size|transform)\s*:/,'finish must not change control geometry');
const nodes=['Privacy','Contact','Follow this domino match live','Open in the app'].map(text=>({nodeValue:text}));
const buttons=['en','es'].map(lang=>({dataset:{siteLang:lang},setAttribute(name,value){this[name]=value;},addEventListener(type,fn){this.click=fn;}}));
const roots=[{nodes}],attributes={};let events=[],calls=[];
const context={NodeFilter:{SHOW_TEXT:4},CustomEvent:class{constructor(type,props){this.type=type;this.detail=props.detail;}},localStorage:{getItem:()=>'es',setItem(){}},window:{setLang:lang=>calls.push(lang)},document:{documentElement:{},querySelectorAll:selector=>selector==='[data-site-lang]'?buttons:roots,createTreeWalker:root=>{let i=0;return {nextNode:()=>root.nodes[i++]};},querySelector:selector=>({setAttribute:(name,value)=>attributes[selector+name]=value}),dispatchEvent:event=>events.push(event)}};
vm.runInNewContext(await read('landing/site-chrome.js'),context);
assert.equal(context.document.documentElement.lang,'es');
assert.equal(nodes[0].nodeValue,'Privacidad');assert.equal(nodes[2].nodeValue,'Sigue esta partida de dominó en vivo');
assert.equal(nodes[3].nodeValue,'Abrir en la app');assert.equal(buttons[1]['aria-pressed'],'true');
assert.equal(events.at(-1).detail,'es');assert.equal(calls.at(-1),'es');
buttons[0].click();assert.equal(nodes[0].nodeValue,'Privacy');assert.equal(nodes[2].nodeValue,'Follow this domino match live');assert.equal(events.at(-1).detail,'en');
console.log('PASS: canonical brand/ENES/header/footer across all pages; legal text and join protocol preserved; shared language bridge/Join ES round-trip (DOM doubles); gold geometry/disabled/reduced-motion contract.');
