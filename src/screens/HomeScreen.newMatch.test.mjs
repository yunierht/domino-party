import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('Home New opens fresh Setup after resetting appearance; Resume leaves existing preferences intact',async()=>{
 const source=fs.readFileSync(new URL('./HomeScreen.tsx',import.meta.url),'utf8'),tree=ts.createSourceFile('HomeScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const screen=tree.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='HomeScreen');
 for(const currentMatch of [null,{id:'existing',winnerTeamId:null}]){
  const events=[],appearance={style:'orbital',teamAColor:'green',teamBColor:'blue'},m={exports:{}};
  const deps={React,useTheme:()=>({theme:{colors:{}},s:n=>n}),useI18n:()=>({t:{},lang:'en'}),useNav:()=>({go:route=>events.push(['go',route])}),useGame:()=>({currentMatch}),useTableGame:()=>({enterMode(){}}),useWindowDimensions:()=>({height:640}),useState:React.useState,resetNewTrackingMatchAppearance:()=>{Object.assign(appearance,{style:'robotic',teamAColor:'yellow',teamBColor:'red'});events.push(['reset']);}};
  for(const name of ['FriendsHomeAccess','SavedOnlineRoomReturn','View','ScrollView','Pressable','Feather','Menu','Logo','ResumeMatchCard','HomeMatchActions','DemoMatch','Card','HomeGameButton','AppearanceSpinner'])deps[name]=name;
  new Function(...Object.keys(deps),'module',ts.transpileModule(screen.getText(tree).replace('export function','function')+'\nmodule.exports=HomeScreen;',{compilerOptions:{jsx:ts.JsxEmit.React}}).outputText)(...Object.values(deps),m);
  let r;await act(()=>{r=create(React.createElement(m.exports));});try{
   assert.equal(r.root.findAllByType('FriendsHomeAccess').length,0,'Home must not render the My Friends access');
   const card=r.root.findByType(currentMatch?'ResumeMatchCard':'DemoMatch');
   if(currentMatch){await act(()=>card.props.onResume());assert.deepEqual(appearance,{style:'orbital',teamAColor:'green',teamBColor:'blue'});assert.deepEqual(events,[['go','game']]);events.length=0;}
   await act(()=>card.props.onNewMatch());assert.deepEqual(events,[['reset'],['go','newMatch']]);assert.deepEqual(appearance,{style:'robotic',teamAColor:'yellow',teamBColor:'red'});
  }finally{await act(()=>r.unmount());}
 }
});
test('saved Home match centers each title and circle as one column without changing score semantics',async()=>{const source=fs.readFileSync(new URL('./HomeScreen.tsx',import.meta.url),'utf8'),tree=ts.createSourceFile('HomeScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),side=tree.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='HomeScoreSide'),m={exports:{}};new Function('React','useTheme','View','Text','ScoreRing','module',ts.transpileModule(side.getText(tree)+'\nmodule.exports=HomeScoreSide;',{compilerOptions:{jsx:ts.JsxEmit.React}}).outputText)(React,()=>({theme:{colors:{}},s:n=>n}),'View','Text','ScoreRing',m);let r;await act(()=>{r=create(React.createElement(m.exports,{team:{name:'Team A'},score:97,target:100,color:'gold'}))});try{assert.equal(r.root.findByType('View').props.style.alignItems,'center');assert.equal(r.root.findByType('Text').props.style.textAlign,'center');const ring=r.root.findByType('ScoreRing');assert.equal(ring.props.score,97);assert.equal(ring.props.caption,'3');assert.equal(ring.props.animateOnMount,undefined);assert.equal(ring.props.pulse,undefined);}finally{await act(()=>r.unmount())}});
