// Isolated browser preview of the real Online screen; no GameProvider/Firebase.
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('../..'),output=resolve('.local/preview');await mkdir(output,{recursive:true});
const entry=`import React from 'react';import {createRoot} from 'react-dom/client';import {OnlineDominoScreen} from './src/online/OnlineDominoScreen';
import {OnlineClient} from './src/online/client';import {httpTransport} from './src/online/transport';import {vault,credential} from './src/online/credentialStorage.web';
const render=()=>createRoot(document.getElementById('root')).render(<OnlineDominoScreen/>);
const role=new URLSearchParams(location.search).get('demo');
async function demo(){const c=new OnlineClient(vault,httpTransport('http://127.0.0.1:8791'),credential,'http://127.0.0.1:8791');
 await c.load();if(c.state.canResume)await c.resume();
 if(!c.state.view){if(role==='host')await c.create('Ana Demo',100,'points');else{
  const code=await new Promise(resolve=>{window.addEventListener('message',e=>{if(e.origin==='http://127.0.0.1:8098'&&e.data?.type==='demo-code')resolve(e.data.code);});parent.postMessage({type:'demo-request'},'http://127.0.0.1:8098');});await c.join('Luis Demo',code);
 }}
 if(role==='host'&&c.state.view)parent.postMessage({type:'demo-code',code:c.state.view.code},'http://127.0.0.1:8098');
 for(let i=0;i<30&&c.state.view?.phase==='waiting';i++){
  await c.refresh();const v=c.state.view;
  if(role==='host'&&v?.names.computer&&!v.approved)await c.command({type:'approve'});
  if(c.state.view?.approved&&!c.state.view.lobbyReady.includes(c.state.view.seat))await c.command({type:'ready'});
  if(c.state.view?.phase==='waiting')await new Promise(r=>setTimeout(r,300));
 }
 render();
}
if(role==='host'||role==='guest')demo().catch(render);else render();`;
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'online-preview.tsx',loader:'tsx'},
  outfile:resolve(output,'app.js'),bundle:true,platform:'browser',jsx:'transform',resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js','.json'],
  alias:{'react-native':resolve(root,'node_modules/react-native-web/dist/index.js')},loader:{'.js':'jsx','.ttf':'file','.png':'file'},
  define:{'process.env.NODE_ENV':'"development"','process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL':'"http://127.0.0.1:8791"','__DEV__':'true'},
  plugins:[{name:'isolated-context',setup(b){
    b.onResolve({filter:/(theme\/ThemeContext|i18n\/I18nContext|nav\/NavContext|@expo\/vector-icons)$/},args=>({path:args.path,namespace:'preview-context'}));
    b.onLoad({filter:/.*/,namespace:'preview-context'},args=>({loader:'js',contents:args.path.includes('ThemeContext')?
      `export const useTheme=()=>({s:n=>n,theme:{fontFamily:undefined,colors:{text:'#F5EACC',primary:'#DAB766',textMuted:'#BBC9B6'}}});`:
      args.path.includes('I18nContext')?`export const useI18n=()=>({lang:'es',t:{}});`:
      args.path.includes('vector-icons')?`export const Feather=()=>null;`:
      `export const useNav=()=>({goHome:()=>{},back:()=>{},canGoBack:false});`}));
  }}],logLevel:'warning'});
await writeFile(resolve(output,'index.html'),'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Domino Online · preview local aislado</title><style>html,body,#root{height:100%;margin:0;background:#081F18}#root{max-width:440px;margin:auto}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
await writeFile(resolve(output,'duo.html'),'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Domino Online · dos jugadores · local</title><style>*{box-sizing:border-box}body{margin:0;background:#061811;color:#F5EACC;font-family:system-ui}header{padding:12px 18px;display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #5F6B4A}main{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 52px)}iframe{border:0;width:100%;height:100%;min-width:0}main>div{min-width:0}h2{font-size:14px;text-align:center;margin:0;height:26px;padding:4px}iframe{height:calc(100% - 26px)}@media(max-width:640px){main{grid-template-columns:1fr;height:auto}iframe{height:820px}}</style></head><body><header><strong>Domino Online · dos jugadores</strong><span>Simulación local · Cloudflare</span></header><main><div><h2>Anfitrión · mano privada</h2><iframe title="Jugador A" src="http://127.0.0.1:8098/"></iframe></div><div><h2>Invitado · mano privada</h2><iframe title="Jugador B" src="http://localhost:8098/"></iframe></div></main></body></html>');
createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/'?'index.html':pathname.slice(1);if(!/^[\w.-]+$/.test(file)){res.writeHead(404);res.end();return;}
  let bytes=await readFile(resolve(output,file));if(file==='duo.html')bytes=Buffer.from(bytes.toString().replace('src="http://127.0.0.1:8098/"','src="http://127.0.0.1:8098/?demo=host"').replace('src="http://localhost:8098/"','src="http://localhost:8098/?demo=guest"').replace('</body>','<script>let code;const guest=document.querySelector(\'iframe[title="Jugador B"]\');window.addEventListener("message",e=>{if(e.origin==="http://127.0.0.1:8098"&&e.data?.type==="demo-code"){code=e.data.code;guest.contentWindow.postMessage({type:"demo-code",code},"http://localhost:8098");}if(e.origin==="http://localhost:8098"&&e.data?.type==="demo-request"&&code)guest.contentWindow.postMessage({type:"demo-code",code},"http://localhost:8098");});</script></body>'));
  res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript; charset=utf-8':extname(file)==='.ttf'?'font/ttf':'text/html; charset=utf-8');res.end(bytes);
}catch{res.writeHead(404);res.end();}}).listen(8098,'127.0.0.1',()=>console.log('Isolated Online UI: http://127.0.0.1:8098'));
