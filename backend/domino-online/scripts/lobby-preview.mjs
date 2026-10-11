// Local browser harness: real Home, setup and table components; no tracking backend.
// The existing preview on 8098 is independent and is never stopped or rewritten.
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const backend=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(backend,'../..'),output=resolve(backend,'.local/lobby-preview');
await mkdir(output,{recursive:true});
const entry=`import React from 'react';
import {createRoot} from 'react-dom/client';
import {View,Text,Pressable} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {ThemeProvider,useTheme} from './src/theme/ThemeContext';
import {I18nProvider} from './src/i18n/I18nContext';
import {PrefsProvider} from './src/state/PrefsContext';
import {NavProvider,useNav} from './src/nav/NavContext';
import {ComputerGameProvider} from './src/computer/ComputerGameContext';
import {TableGameProvider,useTableGame} from './src/poker/TableGameContext';
import {GameSettingsBoundary} from './src/components/GameSettingsBoundary';
import {PokerOnlineScreen} from './src/poker/PokerOnlineScreen';
import {PokerOnlineLinkListener} from './src/poker/PokerOnlineLinkListener';
import {CardGameLobby} from './src/poker/CardGameLobby';
import {PokerScreen} from './src/poker/PokerScreen';
import {BlackjackLobby} from './src/blackjack/BlackjackLobby';
import {BlackjackScreen} from './src/blackjack/BlackjackScreen';
import {BlackjackProvider} from './src/blackjack/BlackjackContext';
import {NewMatchScreen} from './src/screens/NewMatchScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {ComputerGameScreen} from './src/screens/ComputerGameScreen';
import {Background} from './src/components/Background';
import {OnlineLinkListener} from './src/online/OnlineLinkListener';
import {OnlineInvitationEntry} from './src/online/OnlineInvitationEntry';
import {StabilityFixture} from './backend/domino-online/scripts/StabilityFixture';
import {CameraFixture} from './backend/domino-online/scripts/CameraFixture';
function PreviewContent({screen}){const {goHome}=useNav(),{theme}=useTheme(),{mode}=useTableGame();const table=screen==='computerGame';return <View style={{flex:1,backgroundColor:table?'#081D1B':theme.colors.bg}}>
<OnlineLinkListener/><PokerOnlineLinkListener/>{!table&&<Background theme={theme} tiltX={0} tiltY={0}/>}<SafeAreaView style={{flex:1}} edges={['top','bottom']}>
{new URL(location.href).searchParams.get('stabilityFixture')==='1'?<StabilityFixture/>:new URL(location.href).searchParams.get('cameraFixture')==='1'?<CameraFixture/>:screen==='home'?<HomeScreen/>:table?(mode==='poker'?<PokerScreen/>:<ComputerGameScreen/>):screen==='pokerOnline'?<PokerOnlineScreen/>:screen==='pokerLobby'?<CardGameLobby game="poker"/>:screen==='blackjackLobby'?<BlackjackLobby/>:screen==='blackjackTable'?<BlackjackScreen/>:screen==='newMatch'?<NewMatchScreen/>:screen==='onlineInvitation'?<OnlineInvitationEntry/>:screen==='settings'?<SettingsScreen/>:<View style={{padding:24,gap:20}}><Text style={{color:theme.colors.text}}>Esta simulación cubre Home → Jugar dominó → Invitar amigo y Ajustes. Las demás pantallas no están conectadas.</Text><Pressable accessibilityRole="button" onPress={goHome}><Text style={{color:theme.colors.text}}>Volver a Home</Text></Pressable></View>}
</SafeAreaView></View>}
function Preview(){const {screen,settingsReturnScreen,go}=useNav();const {enterMode}=useTableGame();React.useEffect(()=>{const requested=new URL(location.href).searchParams.get('screen');if(requested==='pokerTable'){enterMode('poker');go('computerGame');}else if(['pokerLobby','blackjackLobby','computerGame'].includes(requested))go(requested);},[]);const settings=screen==='settings'&&['computerGame','pokerLobby','blackjackLobby','pokerOnline','blackjackTable','onlineInvitation'].includes(settingsReturnScreen);return <GameSettingsBoundary settings={settings} settingsScreen={<SettingsScreen/>}><PreviewContent screen={settings?settingsReturnScreen:screen}/></GameSettingsBoundary>}
if(new URL(location.href).searchParams.get('visibilityAudit')==='1'){let firstCamera=null,firstTile=null,firstSurface=null;const stats={samples:0,cameraRemoved:0,tileRemoved:0,surfaceRemoved:0,cameraAbsent:0,tileAbsent:0,hidden:0,svgZeroSize:0};const sample=()=>{const camera=document.querySelector('[data-testid="board-camera"]'),surface=document.querySelector('[data-testid="domino-table-surface"]');if(!firstCamera&&camera?.querySelector('[data-testid^="board-tile-"]')){firstCamera=camera;firstTile=camera.querySelector('[data-testid^="board-tile-"]');firstSurface=surface;}if(firstCamera){stats.samples++;if(!firstCamera.isConnected)stats.cameraRemoved++;if(!firstTile.isConnected)stats.tileRemoved++;if(firstSurface&&!firstSurface.isConnected)stats.surfaceRemoved++;if(!camera)stats.cameraAbsent++;if(!camera?.querySelector('[data-testid^="board-tile-"]'))stats.tileAbsent++;for(const node of [camera,surface]){for(let p=node;p;p=p.parentElement){const css=getComputedStyle(p);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0){stats.hidden++;break;}}}for(const svg of surface?.querySelectorAll('svg')??[]){const r=svg.getBoundingClientRect();if(r.width===0||r.height===0)stats.svgZeroSize++;}document.getElementById('root').setAttribute('data-visibility-audit',JSON.stringify(stats));}requestAnimationFrame(sample);};requestAnimationFrame(sample);}

createRoot(document.getElementById('root')).render(<SafeAreaProvider><ThemeProvider><I18nProvider><PrefsProvider><NavProvider><ComputerGameProvider><TableGameProvider><BlackjackProvider><Preview/></BlackjackProvider></TableGameProvider></ComputerGameProvider></NavProvider></PrefsProvider></I18nProvider></ThemeProvider></SafeAreaProvider>);`;

const mocks={
  GameContext:`export const useGame=()=>({currentMatch:null,matches:[],loaded:true,createMatch:()=>{},updateMatch:()=>{}});`,
  useTableMusic:`export const useTableMusic=()=>{};`,
};
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'friend-preview.tsx',loader:'tsx'},
  outfile:resolve(output,'app.js'),bundle:true,platform:'browser',jsx:'transform',sourcemap:true,
  resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js','.json'],
  alias:{'react-native':resolve(root,'node_modules/react-native-web/dist/index.js')},
  loader:{'.js':'jsx','.ttf':'file','.png':'file','.jpg':'file','.webp':'file','.mp3':'file','.wav':'file'},
  // Metro's Expo preset normally supplies EXPO_OS; this isolated esbuild harness does so explicitly.
  banner:{js:'const __PREVIEW_INVITE_BASE__ = window.location.origin + "/app.html";'},define:{'process.env.EXPO_PUBLIC_BLACKJACK_ONLINE_INVITE_BASE':'__PREVIEW_INVITE_BASE__','process.env.EXPO_PUBLIC_BLACKJACK_ONLINE_URL':'"http://127.0.0.1:8795"','process.env.EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE':'__PREVIEW_INVITE_BASE__','process.env':'{}',global:'globalThis','process.env.NODE_ENV':'"development"','process.env.EXPO_OS':'"web"','process.env.EXPO_PUBLIC_POKER_ONLINE_URL':'"http://127.0.0.1:8795"','process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL':'"http://127.0.0.1:8795"','process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE':'__PREVIEW_INVITE_BASE__','process.env.EXPO_PUBLIC_DOMINO_VOICE_TEST':'"true"','__DEV__':'true'},
  plugins:[{name:'isolated-preview-adapters',setup(b){
    b.onResolve({filter:/^@expo\/vector-icons$/},()=>({path:'feather',namespace:'friend-preview-icons'}));
    b.onLoad({filter:/.*/,namespace:'friend-preview-icons'},()=>({loader:'jsx',resolveDir:root,contents:`import React from 'react';import {Text} from 'react-native';import glyphs from './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json';import font from './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf';const css=document.createElement('style');css.textContent='@font-face{font-family:PreviewFeather;src:url('+font+')}';document.head.appendChild(css);export function Feather({name,size=20,color,style,...props}){return <Text {...props} style={[{fontFamily:'PreviewFeather',fontSize:size,color},style]}>{String.fromCodePoint(glyphs[name]??glyphs.circle)}</Text>}Feather.glyphMap=glyphs;import mciGlyphs from './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';import mciFont from './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf';const mciCss=document.createElement('style');mciCss.textContent='@font-face{font-family:PreviewMCI;src:url('+mciFont+')}';document.head.appendChild(mciCss);export function MaterialCommunityIcons({name,size=20,color,style,...props}){return <Text {...props} style={[{fontFamily:'PreviewMCI',fontSize:size,color},style]}>{String.fromCodePoint(mciGlyphs[name]??mciGlyphs['palette-outline'])}</Text>}`}));
    // Use the application's real AsyncStorage web adapter to test reload persistence.
    b.onResolve({filter:/(state\/GameContext|sound\/useTableMusic)$/},args=>({path:args.path.split('/').pop(),namespace:'friend-preview-adapter'}));
    b.onLoad({filter:/.*/,namespace:'friend-preview-adapter'},args=>({loader:'js',contents:mocks[args.path]}));
    b.onResolve({filter:/(^firebase\/|\/firebase\/)/},()=>({errors:[{text:'Firebase is excluded from the isolated friend preview.'}]}));
  }}],metafile:true,logLevel:'warning'}).then(result=>writeFile(resolve(output,'build-meta.json'),JSON.stringify(result.metafile)));
const previewHash=createHash('sha256').update(await readFile(resolve(output,'app.js'))).digest('hex');
const sourceProof=await Promise.all(['src/blackjack/BlackjackOnlineClient.ts','src/blackjack/OnlineBlackjackTable.tsx','src/blackjack/BlackjackOnlineScreen.tsx','src/online/OnlineTurnTimer.tsx','src/components/useExpiredTurnPulse.ts','src/blackjack/betPileGeometry.ts','src/computer/useBoardCamera.ts','src/blackjack/BlackjackScreen.tsx','src/poker/PokerScreen.tsx','src/poker/OnlinePokerTable.tsx','src/poker/PokerOnlineScreen.tsx','src/components/Header.tsx'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(resolve(root,file))).digest('hex')})));
await writeFile(resolve(output,'preview-build.json'),JSON.stringify({builtAt:new Date().toISOString(),bundleSha256:previewHash,sourceProof},null,2));
await writeFile(resolve(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><title>Game preview</title><style>body{margin:0;background:#061811;color:#e6d3a8;font:12px system-ui;text-align:center}header{height:26px;padding:4px}iframe{display:block;margin:auto;border:0}</style></head><body><header>Vista de navegador · no teléfono</header><iframe title="Game preview" id="device"></iframe><script>const p=new URLSearchParams(location.search),f=document.getElementById('device'),w=Number(p.get('width')),h=Number(p.get('height'));f.width=[320,360,390,440].includes(w)?w:Math.min(390,innerWidth);f.height=[640,740,844,900].includes(h)?h:844;p.delete('width');p.delete('height');p.delete('review');f.src='/app.html?'+p.toString();</script></body></html>`);
await writeFile(resolve(output,'device.html'),`<!doctype html><html><head><meta charset="utf-8"><title>Game preview</title><style>body{margin:0;background:#061811;color:#e6d3a8;font:12px system-ui;text-align:center}header{height:26px;padding:4px}iframe{display:block;margin:auto;border:0}</style></head><body><header>Vista de navegador · no teléfono</header><iframe title="Game preview" id="device"></iframe><script>const p=new URLSearchParams(location.search),f=document.getElementById('device'),w=Number(p.get('width')),h=Number(p.get('height'));f.width=[320,360,390,440].includes(w)?w:390;f.height=[640,740,844,900].includes(h)?h:844;f.src='/app.html?screen='+encodeURIComponent(p.get('screen')||'pokerLobby')+(p.get('fixture')==='stable'?'&stabilityFixture=1':'')+(p.get('audit')==='1'?'&visibilityAudit=1':'');</script></body></html>`);
await writeFile(resolve(output,'app.html'),`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="preview-bundle-sha256" content="${previewHash}"><title>Play Domino · invitar amigo · local</title><style>html,body,#root{height:100%;margin:0;background:#081D1B}html,body{width:100%;overflow:hidden}#root{width:100%;max-width:440px;min-width:0;min-height:0;overflow:hidden;margin:auto;display:flex;flex-direction:column}*{box-sizing:border-box}[data-testid="playing-surface"]{overflow:clip!important}</style></head><body><div id="root"></div><script src="/app.js?v=${previewHash}"></script></body></html>`);
await writeFile(resolve(output,'duo.html'),`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="preview-bundle-sha256" content="${previewHash}"><title>Play Domino · simulación de dos jugadores desde Home</title><style>
*{box-sizing:border-box}body{margin:0;background:#061811;color:#F5EACC;font-family:system-ui}header{padding:10px 18px;border-bottom:1px solid #5F6B4A;font-size:13px}header strong{font-size:16px}header p{margin:5px 0 8px;color:#B9C9BE}.zoom-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.zoom-controls button{min-height:34px;border:1px solid #617654;border-radius:8px;padding:5px 12px;color:#F5EACC;background:#17382C;font:inherit;cursor:pointer}.zoom-controls button:focus-visible{outline:2px solid #E9CA83;outline-offset:2px}.zoom-controls output{min-width:48px;text-align:center;font-variant-numeric:tabular-nums}.zoom-controls button:disabled{opacity:.4;cursor:default}
main{--scale:1;--viewport-width:440px;--viewport-height:900px;--device-width:440px;--device-height:926px;display:grid;grid-template-columns:repeat(2,var(--device-width));gap:16px;width:max-content;min-width:0;margin:0 auto;padding:12px 16px}.device-slot{position:relative;width:var(--device-width);height:var(--device-height)}.device{position:absolute;top:0;left:0;width:var(--viewport-width);height:calc(var(--viewport-height) + 26px);transform:scale(var(--scale));transform-origin:top left;overflow:hidden;background:#081D1B;border-radius:14px;outline:1px solid #354C40}h2{font-size:14px;text-align:center;margin:0;height:26px;padding:4px}iframe{display:block;border:0;width:var(--viewport-width);height:var(--viewport-height)}
</style></head><body><header><strong>Play Domino · dos jugadores desde Home</strong><p>Simulación local con sonido de fichas. En ambas vistas: Jugar dominó → iniciar partida → menú. Jugador A: Invitar amigo muestra el código. Jugador B: Aceptar invitación → introducir ese código → Aceptar y jugar.</p><div class="zoom-controls" aria-label="Zoom de la simulación"><button id="fit" type="button">Ajustar a pantalla</button><button id="zoom-out" type="button" aria-label="Reducir zoom">−</button><output id="zoom-value" aria-live="polite">100%</output><button id="zoom-in" type="button" aria-label="Aumentar zoom">+</button></div></header><main><section class="device-slot"><div class="device"><h2>Jugador A · sesión independiente</h2><iframe allow="camera; autoplay" title="Jugador A" src="http://127.0.0.1:8100/"></iframe></div></section><section class="device-slot"><div class="device"><h2>Jugador B · sesión independiente</h2><iframe allow="camera; autoplay" title="Jugador B" src="http://localhost:8100/"></iframe></div></section></main><script>
// Only scale the outside wrappers: iframe viewport and live game state stay intact.
const layout=document.querySelector('main'),header=document.querySelector('header');
const fitButton=document.getElementById('fit'),minus=document.getElementById('zoom-out'),plus=document.getElementById('zoom-in'),value=document.getElementById('zoom-value');
let scale=1,autoFit=true;
const params=new URLSearchParams(location.search),requestedWidth=Number(params.get('width')),requestedHeight=Number(params.get('height'));
if(params.get('cameraFixture')==='1'){for(const frame of document.querySelectorAll('iframe'))frame.src+='?cameraFixture=1';}
if(params.get('voiceTest')==='1'){for(const frame of document.querySelectorAll('iframe'))frame.src+='?voiceTest=1';header.querySelector('p').textContent+=' AUDIO SINTÉTICO DE PRUEBA: sin micrófono personal.';}
const width=[320,360,390,440].includes(requestedWidth)?requestedWidth:440,height=[640,720,844,900].includes(requestedHeight)?requestedHeight:900;
layout.style.setProperty('--viewport-width',width+'px');layout.style.setProperty('--viewport-height',height+'px');
function apply(next){scale=Math.min(1.5,Math.max(.2,next));layout.style.setProperty('--scale',String(scale));layout.style.setProperty('--device-width',(width*scale)+'px');layout.style.setProperty('--device-height',((height+26)*scale)+'px');value.textContent=Math.round(scale*100)+'%';minus.disabled=scale<=.2;plus.disabled=scale>=1.5;fitButton.setAttribute('aria-pressed',String(autoFit));}
function fit(){autoFit=true;apply(Math.min((window.innerWidth-48)/(width*2),(window.innerHeight-header.getBoundingClientRect().height-24)/(height+26),1));}
minus.addEventListener('click',()=>{autoFit=false;apply(scale-.1);});plus.addEventListener('click',()=>{autoFit=false;apply(scale+.1);});fitButton.addEventListener('click',fit);window.addEventListener('resize',()=>{if(autoFit)fit();});fit();
</script></body></html>`);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg'};
createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/'?'index.html':pathname.slice(1);if(!/^[\w.-]+$/.test(file)||file==='build-meta.json'){res.writeHead(404);res.end();return;}
  const resolvedFile=file==='app.html'&&req.headers['sec-fetch-dest']!=='iframe'?'index.html':file;const bytes=await readFile(resolve(output,resolvedFile));res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(bytes);
}catch{res.writeHead(404);res.end();}}).listen(8100,'127.0.0.1',()=>console.log('Friend preview from Home: http://127.0.0.1:8100/duo.html'));
