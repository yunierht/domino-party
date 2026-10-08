import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);return m.exports;}
const {THEMES}=load('../theme/themes.ts'),{STRINGS}=load('../i18n/strings.ts'),types=load('../types.ts');
const colors={yellow:'#D7A63D',green:'#65C59A',red:'#AA463B',blue:'#68B9F5'};
async function setup(canEdit=true){
 const {createTrackingAppearanceStore,nextTrackingStyle,nextTrackingColor}=load('../state/trackingAppearanceStore.ts');
 const store=createTrackingAppearanceStore({read:async()=>null,write:async()=>{}});await store.hydrate();
 const match={id:'match',teams:[{id:'a',name:'Sol',players:['Ana','Luis']},{id:'b',name:'Rivals',players:['Bea','Rigo']}],targetScore:100,rounds:[{id:'r1',winnerTeamId:'a',points:25},{id:'r2',winnerTeamId:'a',points:15},{id:'r3',winnerTeamId:'a',points:10},{id:'r4',winnerTeamId:'b',points:35}],createdAt:1,finishedAt:null,winnerTeamId:null};
 const actions=[];
 const useTrackingAppearance=()=>{const p=React.useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);return {...p,setAppearance:store.update,resetNewMatchAppearance:()=>store.update({style:'robotic',teamAColor:'yellow',teamBColor:'red'}),cycleTeamColor:side=>{const key=side==='A'?'teamAColor':'teamBColor';store.update({[key]:nextTrackingColor(store.getSnapshot()[key])});},cycleStyle:()=>store.update({style:nextTrackingStyle(store.getSnapshot().style)}),teamAColorValue:colors[p.teamAColor],teamBColorValue:colors[p.teamBColor]};};
 const theme={'../theme/ThemeContext':{useTheme:()=>({theme:THEMES.carbon,s:n=>n})}};
 const i18n={'../i18n/I18nContext':{useI18n:()=>({lang:'en',t:STRINGS.en})}};
 const appearance={'../state/useTrackingAppearance':{useTrackingAppearance,TRACKING_COLORS:colors}};
 const rn={Text:'Text',View:'View',Pressable:'Pressable',ScrollView:'ScrollView',Modal:'Modal',ActivityIndicator:'Loader',Alert:{alert(){}},Share:{share:async()=>{}},useWindowDimensions:()=>({width:320,height:640}),Easing:{quad:x=>x,out:x=>x,in:x=>x}};
 const animation=()=>({start(){},stop(){}});
 rn.Animated={View:'AnimatedView',Value:class{constructor(v){this.v=v;}setValue(v){this.v=v;}},createAnimatedComponent:v=>v,timing:animation,spring:animation,sequence:animation};
 const {TrackingAppearanceControls}=load('../components/TrackingAppearanceControls.tsx',{react:React,'react-native':rn,...theme,...i18n,...appearance});
 const {GameScreen}=load('./GameScreen.tsx',{
  react:React,'react-native':rn,'expo-linear-gradient':{LinearGradient:'Gradient'},'@expo/vector-icons':{Feather:'Icon',MaterialCommunityIcons:'Icon'},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'expo-haptics':{selectionAsync:async()=>{},impactAsync:async()=>{},notificationAsync:async()=>{},ImpactFeedbackStyle:{Medium:1},NotificationFeedbackType:{Success:1}},
  ...theme,...i18n,...appearance,
  '../state/GameContext':{useGame:()=>({currentMatch:match,canEdit,amController:false,liveMeta:null,addRound:(...v)=>actions.push(['add',...v]),editRound:(...v)=>actions.push(['edit',...v]),deleteRound:(...v)=>actions.push(['delete',...v]),createMatch:(...v)=>actions.push(['reset',...v])})},
  '../state/PrefsContext':{usePrefs:()=>({announceWinner:false,sound:false,voice:'announcer'})},
  '../nav/NavContext':{useNav:()=>({go(s){actions.push(['go',s]);},back(){actions.push(['back']);},openWatch(){},openSetup(){actions.push(['setup']);},goHome(){actions.push(['home']);}})},
  '../components/ui':{Button:'Button'},'../components/Header':{Header:({leftAction,...p})=>React.createElement('Header',p,leftAction)},'../components/RoundEditor':{RoundEditor:'RoundEditor'},'../components/TargetEditor':{TargetEditor:'TargetEditor'},'../components/Toast':{Toast:'Toast'},'../components/AppDialog':{AppDialog:'Dialog'},
  '../components/TrackingColorButton':{TrackingColorButton:'ColorButton'},'../components/TrackingFinishDialog':{TrackingFinishDialog:'FinishDialog'},'../components/MatchPresentation':{MatchTeamBadge:'Badge',MatchPanelBevel:'Bevel'},
  '../components/trackingLayout':load('../components/trackingLayout.ts'),'../components/TrackingCounter':{TrackingCounter:'Counter',trackingButtonGradient:()=>['#fff','#eee','#ddd']},
  '../components/TrackingAppearanceControls':{TrackingAppearanceControls},
  '../announce/voice':{speakWinner(){}},'../sound/sounds':{initSounds(){},playTap(){},playWin(){}},
  'react-native-qrcode-svg':'QR','../firebase/config':{isFirebaseConfigured:false},'../config/links':{joinUrl:()=>''},'../types':types,
 });
 let r;await act(()=>{r=create(React.createElement(GameScreen));});
 const choose=async label=>{const control=r.root.findAllByType('Pressable').find(p=>p.props.accessibilityLabel===label);assert.ok(control,label);await act(()=>control.props.onPress());};
 return {r,match,actions,store,choose,close:()=>act(()=>r.unmount())};
}
test('all styles and independent colors preserve scores, individual datas and scoring callbacks',async()=>{
 const h=await setup();const before=structuredClone(h.match);
 try{
  for(const label of ['Counter: Speedometer','Counter: Orbital','Counter: Robotic']){
   await act(()=>h.store.update({style:label.replace('Counter: ','').toLowerCase()}));assert.deepEqual(h.match,before);assert.deepEqual(h.actions,[]);
   const counters=h.r.root.findAllByType('Counter');assert.deepEqual(counters.map(c=>c.props.score),[50,35]);assert.deepEqual(counters.map(c=>c.props.remaining),[50,65]);
  }
  await act(()=>h.store.update({teamAColor:'blue',teamBColor:'green'}));await act(()=>h.store.update({style:'speedometer'}));assert.equal(h.r.root.findAllByType('Pressable').filter(p=>p.props.accessibilityRole==='radio').length,0);
  assert.deepEqual(h.r.root.findAllByType('Counter').map(c=>[c.props.style,c.props.color]),[['speedometer',colors.blue],['speedometer',colors.green]]);
  const panels=h.r.root.findAll(e=>typeof e.type==='function'&&e.type.name==='TeamPanel');
  assert.deepEqual(panels[0].findAllByProps({testID:'tracking-data-points'}).map(t=>t.props.children),[25,15,10]);
  await act(()=>panels[0].findByProps({testID:'tracking-dial-add'}).props.onPress());
  const editor=h.r.root.findByType('RoundEditor');assert.equal(editor.props.presetWinnerTeamId,'a');assert.deepEqual(editor.props.teamColors,[colors.blue,colors.green]);
  await act(()=>editor.props.onSave('a',25));assert.deepEqual(h.actions,[['add','match','a',25]]);
 }finally{await h.close();}
});
test('read-only scoring stays locked while local appearance can still change',async()=>{
 const h=await setup(false);
 try{
  await act(()=>h.store.update({style:'orbital'}));await act(()=>h.store.update({teamBColor:'blue'}));
  const panels=h.r.root.findAll(e=>typeof e.type==='function'&&e.type.name==='TeamPanel');
  for(const panel of panels){assert.equal(panel.findByProps({testID:'tracking-dial-add'}).props.onPress,undefined);assert.equal(panel.findAllByType('Text').some(t=>t.props.children===STRINGS.en.addPoints),false);}
  assert.deepEqual(h.actions,[]);assert.deepEqual(h.r.root.findAllByType('Counter').map(c=>c.props.score),[50,35]);
 }finally{await h.close();}
});
test('both panel style controls stay synchronized without changing match data',async()=>{
 const h=await setup();const before=structuredClone(h.match);
 try{
  const control=()=>h.r.root.findAllByType('Pressable').filter(p=>p.props.testID==='tracking-style-cycle');
  assert.equal(control().length,2);
  for(const style of ['speedometer','orbital','robotic']){await act(()=>control()[0].props.onPress());assert.deepEqual(h.r.root.findAllByType('Counter').map(c=>c.props.style),[style,style]);assert.deepEqual(h.match,before);assert.deepEqual(h.actions,[]);}
  const panels=h.r.root.findAll(e=>typeof e.type==='function'&&e.type.name==='TeamPanel');for(const p of panels)assert.equal(p.findAllByProps({testID:'tracking-style-cycle'}).length,1);
 }finally{await h.close();}
});

test('each panel has a color control and fixed history space before and after datas are added',async()=>{
 const h=await setup();try{
  const controls=h.r.root.findAllByType('ColorButton');assert.equal(controls.length,2);const before=structuredClone(h.match);
  await act(()=>controls[0].props.onPress());assert.deepEqual(h.match,before);assert.deepEqual(h.actions,[]);assert.equal(h.r.root.findByType('RoundEditor').props.visible,false);
  const size=h.r.root.findAllByType('Counter')[0].props.size;h.match.rounds=[];await act(()=>h.store.update({style:'orbital'}));assert.equal(h.r.root.findAllByType('Counter')[0].props.size,size);assert.equal(h.r.root.findAllByProps({testID:'tracking-data-row'}).length,2);
 }finally{await h.close();}
});

test('Rounds 0 is only an empty-match placeholder and individual datas remain editable',async()=>{
 const h=await setup();try{
  const emptyLabels=()=>h.r.root.findAllByType('Text').filter(t=>Array.isArray(t.props.children)&&t.props.children[0]===STRINGS.en.rounds.toUpperCase()&&t.props.children[1]===' · ');
  const refresh=()=>act(()=>h.store.update({style:h.store.getSnapshot().style==='orbital'?'robotic':'orbital'}));
  const originalRounds=structuredClone(h.match.rounds);
  h.match.rounds=[];await refresh();assert.equal(emptyLabels().length,2);
  h.match.rounds=[originalRounds[0]];await refresh();assert.equal(emptyLabels().length,0,'both placeholders hide after the first team scores');
  const data=h.r.root.findByProps({testID:'tracking-data-points'});assert.equal(data.props.children,25);
  await act(()=>data.parent.props.onPress());assert.equal(h.r.root.findByType('RoundEditor').props.round.id,'r1');
  h.match.rounds=[];await refresh();assert.equal(emptyLabels().length,2,'undoing the last data restores the empty state');
  h.match.rounds=originalRounds;await refresh();assert.equal(emptyLabels().length,0);assert.equal(h.r.root.findAllByProps({testID:'tracking-data-points'}).length,4);
  h.match.id='new-match';h.match.rounds=[];await refresh();assert.equal(emptyLabels().length,2,'a new empty match shows the initial placeholder');
 }finally{await h.close();}
});

test('finishing overlays actions without changing panel or counter budgets',async()=>{
 const h=await setup();try{
  const size=h.r.root.findAllByType('Counter')[0].props.size;const panel=h.r.root.findAll(e=>typeof e.type==='function'&&e.type.name==='TeamPanel')[0];const panelHeight=panel.props.panelHeight;
  assert.equal(h.r.root.findByType('FinishDialog').props.visible,false);h.match.winnerTeamId='a';h.match.finishedAt=2;await act(()=>h.store.update({style:'orbital'}));
  assert.equal(h.r.root.findByType('FinishDialog').props.visible,true);assert.equal(h.r.root.findAllByType('Counter')[0].props.size,size);assert.equal(h.r.root.findAll(e=>typeof e.type==='function'&&e.type.name==='TeamPanel')[0].props.panelHeight,panelHeight);assert.deepEqual(h.actions,[]);
 }finally{await h.close();}
});

test('back preserves appearance while explicit new teams restores defaults without changing saved match',async()=>{
 const h=await setup();try{
  const before=structuredClone(h.match);await act(()=>h.store.update({style:'orbital',teamAColor:'green',teamBColor:'blue'}));
  await act(()=>h.r.root.findByType('Header').props.onBackPress());
  assert.deepEqual(h.actions,[['setup']]);assert.equal(h.store.getSnapshot().style,'orbital');assert.equal(h.store.getSnapshot().teamAColor,'green');
  await act(()=>h.r.root.findByType('FinishDialog').props.onNewMatch());
  assert.deepEqual(h.store.getSnapshot(),{style:'robotic',teamAColor:'yellow',teamBColor:'red',ready:true});assert.deepEqual(h.match,before);assert.deepEqual(h.actions,[['setup'],['setup']]);
 }finally{await h.close();}
});

test('appearance controls have full-height sibling hit areas and cannot route into scoring; only Add and dial taps open their team',async()=>{
 const h=await setup();try{
  const before=structuredClone(h.match);
  assert.equal(h.r.root.findAllByProps({testID:'tracking-card-add'}).length,0);
  for(const side of ['A','B']){const card=h.r.root.findByProps({testID:`tracking-marker-panel-${side}`});assert.equal(card.props.onPress,undefined);}
  const controls=h.r.root.findAllByProps({testID:'tracking-panel-controls'});assert.equal(controls.length,2);
  for(const control of controls){
   assert.ok(control.props.style.height>=44);assert.equal(control.props.pointerEvents,'box-none');
   const styleButton=control.findByProps({testID:'tracking-style-cycle'}).props.style;
   assert.ok(styleButton.height>=44);assert.ok(styleButton.top+styleButton.height<=control.props.style.height,'entire style hit area must fit its parent');
   let ancestor=control.parent;while(ancestor){assert.notEqual(ancestor.type,'Pressable');ancestor=ancestor.parent;}
  }
  for(const index of [0,1]){
   await act(()=>h.r.root.findAllByProps({testID:'tracking-style-cycle'})[index].props.onPress());
   assert.equal(h.r.root.findByType('RoundEditor').props.visible,false);assert.equal(h.r.root.findAllByType('Counter')[0].props.style,h.r.root.findAllByType('Counter')[1].props.style);
   for(let i=0;i<4;i++){await act(()=>h.r.root.findAllByType('ColorButton')[index].props.onPress());assert.equal(h.r.root.findByType('RoundEditor').props.visible,false);}
   for(const testID of ['tracking-dial-add','tracking-add-points']){
    await act(()=>h.r.root.findAllByProps({testID})[index].props.onPress());const editor=h.r.root.findByType('RoundEditor');assert.equal(editor.props.visible,true);assert.equal(editor.props.presetWinnerTeamId,index===0?'a':'b');
    await act(()=>editor.props.onClose());assert.equal(h.r.root.findByType('RoundEditor').props.visible,false);
   }
  }
  const chip=h.r.root.findAllByProps({testID:'tracking-data-points'})[0].parent;
  await act(()=>chip.props.onPress());assert.equal(h.r.root.findByType('RoundEditor').props.round.id,'r1');assert.equal(h.r.root.findByType('RoundEditor').props.visible,true);
  await act(()=>h.r.root.findByType('RoundEditor').props.onClose());
  assert.deepEqual(h.match,before);assert.deepEqual(h.actions,[]);
 }finally{await h.close();}
});
