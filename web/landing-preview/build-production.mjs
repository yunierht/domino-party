import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build-preview.mjs';
import {buildSiteChrome} from './build-site-chrome.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const preview=path.join(root,'.local/web-landing-preview/site');
const output=path.join(root,'.local/web-site-release/site');
let page=await readFile(path.join(preview,'index.html'),'utf8');
function replaceOnce(pattern,replacement,label){
 const matches=[...page.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))];
 if(matches.length!==1)throw new Error(label+': expected exactly one reviewed boundary, got '+matches.length);
 page=page.replace(pattern,replacement);
}
replaceOnce(/      var localHistoryFixtureId = "LOCALHISTORYFIXTURE01";\r?\n/,'','legacy fixture identifier');
replaceOnce(/        if \(\(location.hostname[^\n]+spaceId === localHistoryFixtureId[^\n]+\r?\n/,'','legacy fixture history branch');
replaceOnce(/ && !location.search.includes\("previewScore=1"\)/,'','legacy routing preview exception');
replaceOnce(/var watchHistoryFixture = null;[\s\S]*?(?=\/\/ Injected inside the existing viewer closure)/,'','injected archive samples');
replaceOnce(/if \(watchHistoryFixture\) document.getElementById\('watch-fixture-label'\).hidden=false;\r?\n/,'','fixture banner hook');
replaceOnce(/  if \(watchHistoryFixture\) \{[\s\S]*?\n  \}\r?\n/,'','fixture archive branch');
replaceOnce(/<p class="watch-fixture-label"[^>]+>LOCAL SAMPLE · DATOS DE EJEMPLO<\/p>/,'','fixture banner');
replaceOnce(/<span class="preview-label">DESIGN PREVIEW<\/span>/,'','design review footer');
replaceOnce(/,"DESIGN PREVIEW":"VISTA PREVIA"/,'','design review translation');
// Replace all localhost fixture routing with genuine shared-link entry only.
replaceOnce(/      function showLocalHistoryPreview\(fromWatch\) \{[\s\S]*?(?=    \}\)\(\);)/,`      window.addEventListener("load", function () {
        var params=new URLSearchParams(location.search);
        if(params.get("follow")==="1"){dialog.showModal();codeInput.focus();}
        var linkedHistory=parseHistoryKey(params.get("history") || "");
        var hashCode=location.hash.match(/^#watch-([A-Z0-9]{4,6})$/i);
        var linkedCode=(params.get("watch") || (hashCode ? hashCode[1] : "")).toUpperCase();
        if (/^[A-Z0-9]{4,6}$/.test(linkedCode)) {
          activeHistorySpace=linkedHistory;
          activeCode=linkedCode;
          codeInput.value=linkedCode;
          dialog.showModal();
          loading.classList.add("active");
          window.subscribeToDominoGame(linkedCode,handleGame,handleError);
        } else if (linkedHistory) {
          showHistoryPage(linkedHistory,false);
        }
      });
`,'local demo loader');
// No sample state can be activated, even on localhost or with old review URLs.
if(/preview(?:Score|History|Results|Winner)|watchHistoryFixture|localHistoryFixture|LOCAL SAMPLE|DESIGN PREVIEW|showLocalHistoryPreview|A7K9|preview-[12]|Los Primos|Club Centro/.test(page))throw new Error('Review-only data leaked into production');
for(const script of page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))new Function(script[1]);
// Only this resolved, fixed workspace output may be cleaned.
if(output!==path.resolve(root,'.local/web-site-release/site'))throw new Error('Unexpected release output');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await writeFile(path.join(root,'docs/index.html'),page);
await cp(path.join(preview,'landing'),path.join(root,'docs/landing'),{recursive:true});
for(const name of ['landing.css','watch-history.css']){
 const target=path.join(root,'docs/landing',name);
 const css=(await readFile(target,'utf8')).replace(/\.(?:watch-fixture-label|preview-label)(?:\[hidden\])?\s*\{[^}]*\}/g,'');
 await writeFile(target,css);
}
// Deliberate allowlist: never deploy project continuity, tests, templates or demos.
await buildSiteChrome(root);
for(const name of ['index.html','live.js','img','sounds','join','install','privacy','legal','contact','landing'])await cp(path.join(root,'docs',name),path.join(output,name),{recursive:true});
async function inventory(dir,prefix=''){
 const result=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isDirectory())result.push(...await inventory(path.join(dir,entry.name),name+'/'));
  else result.push(name);
 }
 return result.sort();
}
const files=await inventory(output);
if(files.some(name=>/\.(?:md|mjs|map|toml|jsonc)$|mobile-review|base\.html/.test(name)))throw new Error('Non-public file in release');
await writeFile(path.join(root,'.local/web-site-release/files.json'),JSON.stringify(files,null,2));
console.log('Production website: '+files.length+' public assets at '+output);
