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
  for(const name of ['View','ScrollView','Pressable','Feather','Menu','Logo','ResumeMatchCard','HomeMatchActions','DemoMatch','Card','HomeGameButton','AppearanceSpinner'])deps[name]=name;
  new Function(...Object.keys(deps),'module',ts.transpileModule(screen.getText(tree).replace('export function','function')+'\nmodule.exports=HomeScreen;',{compilerOptions:{jsx:ts.JsxEmit.React}}).outputText)(...Object.values(deps),m);
  let r;await act(()=>{r=create(React.createElement(m.exports));});try{
   const card=r.root.findByType(currentMatch?'ResumeMatchCard':'DemoMatch');
   if(currentMatch){await act(()=>card.props.onResume());assert.deepEqual(appearance,{style:'orbital',teamAColor:'green',teamBColor:'blue'});assert.deepEqual(events,[['go','game']]);events.length=0;}
   await act(()=>card.props.onNewMatch());assert.deepEqual(events,[['reset'],['go','newMatch']]);assert.deepEqual(appearance,{style:'robotic',teamAColor:'yellow',teamBColor:'red'});
  }finally{await act(()=>r.unmount());}
 }
});
