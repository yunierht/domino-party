import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{create,act}=require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;

test('the table owner preserves offline state and the waiting online session across back and acceptance',async()=>{
 const source=fs.readFileSync(new URL('./ComputerGameScreen.tsx',import.meta.url),'utf8');
 const parsed=ts.createSourceFile('ComputerGameScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const wrapper=parsed.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ComputerGameScreen');
 assert.ok(wrapper);
 const mounts={local:0,online:0},unmounts={local:0,online:0};
 function Local(props){const [marker]=React.useState(()=>++mounts.local);React.useEffect(()=>()=>{unmounts.local++;},[]);return React.createElement('Local',{...props,marker});}
 function Online(props){const [marker]=React.useState(()=>++mounts.online);React.useEffect(()=>()=>{unmounts.online++;},[]);return React.createElement('Online',{...props,marker});}
 const game={playerName:'Juni',target:100,scoringMode:'points',hands:{human:['private AI hand'],computer:['never send']}};
 const output={};new Function('React','useState','useComputerGame','View','LocalComputerGameScreen','OnlineFriendScreen','exports',
  ts.transpileModule(wrapper.getText(parsed),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText)(React,React.useState,()=>({game,opponentId:'diego',playerAvatarId:'yuni'}),'View',Local,Online,output);
 let tree;await act(()=>{tree=create(React.createElement(output.ComputerGameScreen));});
 try{
  assert.equal(tree.root.findAllByType('Online').length,0);
  await act(()=>tree.root.findByType('Local').props.onInvite('invite'));
  const online=tree.root.findByType('Online');assert.equal(online.props.initialName,'Juni');assert.equal(online.props.visible,true);assert.equal('game'in online.props,false);
  assert.equal(online.props.initialAvatar,'yuni');assert.equal(online.props.entry,'invite');assert.equal(online.props.requestId,1);
  await act(()=>online.props.onBack());assert.equal(tree.root.findByType('Online').props.visible,false);assert.equal(tree.root.findByType('Local').props.showInvite,false);
  assert.deepEqual(mounts,{local:1,online:1});assert.deepEqual(unmounts,{local:0,online:0});
  await act(()=>tree.root.findByType('Online').props.onStarted());assert.equal(tree.root.findByType('Online').props.visible,true);assert.equal(tree.root.findByType('Local').props.showInvite,true);
  assert.deepEqual(mounts,{local:1,online:1});
  await act(()=>tree.root.findByType('Online').props.onBack());await act(()=>tree.root.findByType('Local').props.onInvite('accept'));
  assert.equal(tree.root.findByType('Online').props.entry,'accept');assert.equal(tree.root.findByType('Online').props.requestId,2);assert.deepEqual(mounts,{local:1,online:1});
 }finally{await act(()=>tree.unmount());}
 assert.deepEqual(unmounts,{local:1,online:1});
});

test('Domino three-dot menu uses the Poker settings panel and preserves invitation, rules and restart routes',()=>{const source=fs.readFileSync(new URL('./ComputerGameScreen.tsx',import.meta.url),'utf8'),parsed=ts.createSourceFile('table.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let element;function visit(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(parsed)==='TableSettings')element=n;ts.forEachChild(n,visit);}visit(parsed);assert.ok(element);let showMenu=true,showSettings=false,rules=false,restart=false,invite;const make=()=>new Function('React','TableSettings','showMenu','showSettings','es','setShowMenu','setShowSettings','setShowRules','setShowRestart','onInvite',ts.transpileModule('return ('+element.getText(parsed)+');',{compilerOptions:{jsx:ts.JsxEmit.React}}).outputText)(React,'Settings',showMenu,showSettings,false,v=>showMenu=v,v=>showSettings=v,v=>rules=v,v=>restart=v,v=>invite=v).props;assert.equal(make().visible,true);make().onClose();assert.equal(make().visible,false);showMenu=true;make().onRules();assert.equal(rules,true);assert.equal(showMenu,false);showMenu=true;make().onInvite();assert.equal(invite,'invite');assert.equal(showMenu,false);showMenu=true;make().onAcceptInvitation();assert.equal(invite,'accept');showMenu=true;make().onRestart();assert.equal(restart,true);assert.equal(showMenu,false);showSettings=true;assert.equal(make().visible,true);make().onClose();assert.equal(showSettings,false);});
