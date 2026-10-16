import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'.local/web-site-release/site');
const html=await readFile(path.join(output,'index.html'),'utf8');
assert.doesNotMatch(html,/preview(?:Score|History|Results|Winner)|watchHistoryFixture|localHistoryFixture|LOCAL SAMPLE|DESIGN PREVIEW|A7K9|preview-[12]/);
for(const script of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))new Function(script[1]);
for(const name of ['live.js','join/index.html','privacy/index.html','legal/index.html'])assert.deepEqual(await readFile(path.join(output,name)),await readFile(path.join(root,'docs',name)),name+' preserved');
const files=JSON.parse(await readFile(path.join(root,'.local/web-site-release/files.json'),'utf8'));
assert.equal(files.length,25);
assert.ok(files.every(name=>/^(?:index\.html|live\.js|(?:img|sounds|join|privacy|legal|landing)\/)/.test(name)));
assert.ok(files.every(name=>!(/\.(?:md|mjs|map)$/.test(name))));
for(const asset of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"#]*)?"/g)){
 let file=asset[1].slice(1);if(!file)continue;if(file.endsWith('/'))file+='index.html';
 assert.ok(files.includes(file),'Missing local resource '+file);
}
const loader=html.match(/window.addEventListener\("load", function \(\) \{([\s\S]*?)\n      \}\);\n    \}\)\(\);/)[1];
function entry(search='',hash=''){
 const calls=[];
 const ctx={URLSearchParams,location:{search,hash},parseHistoryKey:x=>x==='shared-key'?x:'',codeInput:{},dialog:{showModal(){calls.push(['dialog']);}},loading:{classList:{add(){}}},window:{subscribeToDominoGame:(code)=>calls.push(['game',code])},handleGame(){},handleError(){},showHistoryPage:key=>calls.push(['history',key])};
 vm.runInNewContext(loader,ctx);return {calls,ctx};
}
assert.deepEqual(entry().calls,[]);
assert.deepEqual(entry('?previewScore=1&previewHistory=1&previewResults=1&previewWinner=1').calls,[]);
assert.deepEqual(entry('?watch=abcd').calls,[['dialog'],['game','ABCD']]);
assert.deepEqual(entry('','#watch-Ab12').calls,[['dialog'],['game','AB12']]);
assert.deepEqual(entry('?watch=ABC%3Cscript%3E').calls,[]);
assert.deepEqual(entry('?history=shared-key').calls,[['history','shared-key']]);
assert.equal(entry('?watch=ABCD&history=shared-key').ctx.activeHistorySpace,'shared-key');
console.log('PASS: production has no fixtures, allowlisted assets, preserved bridge/legal/join, script syntax, query/hash watch links and shared history routing (VM doubles).');
