import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps={},suffix=''){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText+suffix)(id=>deps[id]??{},m,m.exports);return m.exports;}
const {THEMES}=load('../theme/themes.ts'),{STRINGS}=load('../i18n/strings.ts'),types=load('../types.ts');
const {__reducer:reducer}=load('../state/GameContext.tsx',{react:React,'../types':types},'\nmodule.exports.__reducer=reducer;');
function match(targetScore=120){return {id:'existing',teams:[{id:'a',name:'Campeones del Caribe',players:['Ana Rodriguez','Luis Martinez']},{id:'b',name:'Estrellas del Norte',players:['Beatriz Perez','Rigo Santos']}],targetScore,rounds:[{id:'r1',winnerTeamId:'a',points:55,createdAt:3},{id:'r2',winnerTeamId:'a',points:22,createdAt:4},{id:'r3',winnerTeamId:'b',points:22,createdAt:5}],createdAt:1,winnerTeamId:null,finishedAt:null,historySpaceId:'history-existing',sharedHostId:'host-existing'};}
async function render(current=match(),mode='edit',canEdit=true){
 let state={matches:current?[current,{...match(),id:'other'}]:[],currentMatchId:current?.id??null,loaded:true,displayName:'Player'};const creates=[],updates=[],nav=[];
 const prefs={style:'orbital',teamAColor:'green',teamBColor:'blue',teamAColorValue:'#65C59A',teamBColorValue:'#68B9F5',cycleTeamColor(){}};
 const {NewMatchScreen}=load('./NewMatchScreen.tsx',{react:React,'react-native':{View:'View',Text:'Text',TextInput:'Field',Pressable:'Pressable',ScrollView:'ScrollView',KeyboardAvoidingView:'View',Platform:{OS:'android'},useWindowDimensions:()=>({width:390,height:844})},'expo-linear-gradient':{LinearGradient:'Gradient'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'../theme/ThemeContext':{useTheme:()=>({theme:THEMES.carbon,s:n=>n})},'../i18n/I18nContext':{useI18n:()=>({t:STRINGS.en})},'../nav/NavContext':{useNav:()=>({setupMode:mode,back:()=>nav.push('back'),go:route=>nav.push(route),goHome:()=>nav.push('home')})},'../state/GameContext':{useGame:()=>({currentMatch:state.matches.find(m=>m.id===state.currentMatchId)??null,canEdit,createMatch:(...v)=>creates.push(v),updateMatchConfiguration:(matchId,teamA,teamB,targetScore)=>{updates.push({matchId,teamA,teamB,targetScore});state=reducer(state,{type:'UPDATE_MATCH_CONFIGURATION',matchId,teamA,teamB,targetScore});}})},'../state/useTrackingAppearance':{useTrackingAppearance:()=>prefs},'../components/TrackingColorButton':{TrackingColorButton:'ColorButton'},'../components/MatchPresentation':{MatchPanelBevel:'Bevel'},'../components/trackingLayout':load('../components/trackingLayout.ts'),'../components/ui':{Button:'Button',Card:'Card',Field:'Field'},'../components/Header':{Header:'Header'}});
 let r;await act(()=>{r=create(React.createElement(NewMatchScreen));});return {r,prefs,creates,updates,nav,getState:()=>state,setCurrent:m=>{state={...state,matches:[m,...state.matches.filter(x=>x.id!==m.id)],currentMatchId:m.id};},rerender:()=>act(()=>r.update(React.createElement(NewMatchScreen))),close:()=>act(()=>r.unmount())};
}
test('Back Setup prefills six complete fields and all target variants; Save edits same ID without losing ledger or metadata',async()=>{
 for(const target of [100,150,120]){
  const original=match(target),h=await render(original);try{
   const fields=h.r.root.findAllByType('Field');assert.deepEqual(fields.slice(0,6).map(f=>f.props.value),[original.teams[0].name,...original.teams[0].players,original.teams[1].name,...original.teams[1].players]);
   assert.equal(fields.length,target===120?7:6);if(target===120)assert.equal(fields[6].props.value,'120');
   await act(()=>fields[0].props.onChangeText('  Campeones Internacionales del Caribe  '));await act(()=>fields[1].props.onChangeText('  Ana Maria Rodriguez  '));
   await act(()=>h.r.root.findByType('Button').props.onPress());assert.equal(h.creates.length,0);assert.equal(h.updates.length,1);assert.deepEqual(h.nav,['back','game']);
   const saved=h.getState(),m=saved.matches[0];assert.equal(saved.currentMatchId,original.id);assert.equal(saved.matches.length,2);assert.equal(m.id,original.id);assert.equal(m.teams[0].id,'a');assert.equal(m.teams[1].id,'b');assert.deepEqual(m.rounds,original.rounds);assert.equal(m.rounds,original.rounds);assert.equal(m.createdAt,original.createdAt);assert.equal(m.finishedAt,original.finishedAt);assert.equal(m.historySpaceId,original.historySpaceId);assert.equal(m.sharedHostId,original.sharedHostId);assert.equal(m.targetScore,target);assert.deepEqual(m.teams[0].players,['Ana Maria Rodriguez','Luis Martinez']);assert.equal(m.teams[0].name,'Campeones Internacionales del Caribe');assert.equal(types.teamTotal(m,'a'),77);assert.equal(types.teamTotal(m,'b'),22);assert.equal(h.prefs.style,'orbital');assert.equal(h.prefs.teamAColor,'green');
   const reloaded=await render(JSON.parse(JSON.stringify(m)));try{assert.equal(reloaded.r.root.findAllByType('Field')[0].props.value,m.teams[0].name);assert.equal(reloaded.r.root.findAllByType('Field')[1].props.value,m.teams[0].players[0]);}finally{await reloaded.close();}
  }finally{await h.close();}
 }
});
test('untouched target retains newest current value; explicit target changes retain validation and winner reconciliation',async()=>{
 const h=await render(match());try{
  h.setCurrent({...match(),targetScore:150});await h.rerender();await act(()=>h.r.root.findByType('Button').props.onPress());assert.equal(h.getState().matches[0].targetScore,150);
  const field=h.r.root.findAllByType('Field').at(-1);await act(()=>field.props.onChangeText('0'));await act(()=>h.r.root.findByType('Button').props.onPress());assert.equal(h.updates.length,1);
  await act(()=>field.props.onChangeText('70'));await act(()=>h.r.root.findByType('Button').props.onPress());assert.equal(h.getState().matches[0].targetScore,70);assert.equal(h.getState().matches[0].winnerTeamId,'a');assert.equal(h.getState().matches[0].rounds.length,3);
 }finally{await h.close();}
});
test('fresh Setup ignores current match; edit waiting for current data and read-only sessions cannot create or change a match',async()=>{
 const fresh=await render(match(),'new');try{assert.deepEqual(fresh.r.root.findAllByType('Field').map(f=>f.props.value),['','','','','','']);await act(()=>fresh.r.root.findByType('Button').props.onPress());assert.equal(fresh.creates.length,1);assert.equal(fresh.updates.length,0);}finally{await fresh.close();}
 for(const [m,allowed] of [[null,true],[match(),false]]){const h=await render(m,'edit',allowed);try{assert.equal(h.r.root.findByType('Button').props.disabled,true);await act(()=>h.r.root.findByType('Button').props.onPress());assert.equal(h.creates.length,0);assert.equal(h.updates.length,0);}finally{await h.close();}}
});

test('configuration cannot overwrite team identities or unrelated data supplied through a wider object',()=>{
 const original=match(),state={matches:[original],currentMatchId:original.id,loaded:true,displayName:'Player'};
 const next=reducer(state,{type:'UPDATE_MATCH_CONFIGURATION',matchId:original.id,teamA:{...original.teams[0],id:'unexpected-id',name:'Nuevo nombre'},teamB:{...original.teams[1],id:'unexpected-b'},targetScore:original.targetScore});
 assert.deepEqual(next.matches[0].teams.map(t=>t.id),['a','b']);assert.equal(next.matches[0].rounds,original.rounds);assert.equal(next.currentMatchId,original.id);assert.equal(types.teamTotal(next.matches[0],'a'),77);
});
