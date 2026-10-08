import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);return m.exports;}
test('Settings starts selected music only when hydrated/enabled, changes tracks and disposes on disable or leaving',async()=>{
 const players=[],app={currentState:'active',addEventListener:()=>({remove(){}})};
 const {useTableMusic}=load('../sound/useTableMusic.ts',{react:React,'react-native':{AppState:app},'./tableMusicCatalog':{musicSource:id=>id},'expo-audio':{setAudioModeAsync:async()=>{},createAudioPlayer:source=>{const p={source,plays:0,removed:false,play(){this.plays++;},pause(){},remove(){this.removed=true;}};players.push(p);return p;}}});
 const {THEMES}=load('../theme/themes.ts',{}),{STRINGS}=load('../i18n/strings.ts',{});
 let prefs={ready:false,tableMusic:true,tableMusicTrack:'latin-jazz',announceWinner:false,sound:false,setTableMusic:value=>{prefs={...prefs,tableMusic:value};}};
 const {SettingsScreen}=load('./SettingsScreen.tsx',{react:React,'react-native':{View:'View',Text:'Text',Switch:'Switch',Pressable:'Pressable',ScrollView:'ScrollView'},'expo-linear-gradient':{LinearGradient:'Gradient'},'@expo/vector-icons':{Feather:'Icon'},'../theme/ThemeContext':{useTheme:()=>({theme:THEMES.carbon,themeName:'carbon',s:n=>n})},'../i18n/I18nContext':{useI18n:()=>({t:STRINGS.en,lang:'en'})},'../state/PrefsContext':{usePrefs:()=>prefs},'../components/ui':{Card:'Card',DominoTile:'Tile'},'../components/Header':{Header:'Header'},'../components/Background':{Background:'Background'},'../theme/themes':{THEMES},'../announce/voice':{VOICE_STYLES:[],previewVoice(){}},'../sound/sounds':{playTap(){}},'../sound/MusicChoices':{MusicChoices:'Choices'},'../sound/useTableMusic':{useTableMusic}});
 let r;const rerender=()=>act(()=>r.update(React.createElement(SettingsScreen)));await act(()=>{r=create(React.createElement(SettingsScreen));});try{
  assert.equal(players.length,0);prefs={...prefs,ready:true};await rerender();assert.equal(players[0].source,'latin-jazz');assert.equal(players[0].plays,1);assert.ok(players[0].volume>0);assert.equal(players[0].loop,true);
  const toggle=()=>r.root.findByProps({accessibilityLabel:'Music'});assert.equal(toggle().props.value,true);
  await act(()=>toggle().props.onValueChange(false));await rerender();assert.equal(players[0].removed,true);
  prefs={...prefs,tableMusicTrack:'reggaeton'};await act(()=>toggle().props.onValueChange(true));await rerender();assert.equal(players[1].source,'reggaeton');assert.equal(players[1].plays,1);
  prefs={...prefs,tableMusicTrack:'smooth-jazz'};await rerender();assert.equal(players[1].removed,true);assert.equal(players[2].source,'smooth-jazz');
 }finally{await act(()=>r.unmount());}assert.equal(players.at(-1).removed,true);
});
