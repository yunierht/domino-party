import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{create,act}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('selecting an opening tile exposes a fixed actionable target outside the scrolling hand',async()=>{
  const view={code:'ABCDEF0123',epoch:'e',revision:1,phase:'playing',seat:'human',names:{human:'Ana',computer:'Luis'},approved:true,
    reconnectDeadline:[null,null],round:1,turn:'human',hand:[{id:'6-6',a:6,b:6}],board:[],stock:[],scores:{human:0,computer:0},wins:{human:0,computer:0},
    mode:'points',target:100,result:null,winner:null,roundReady:[],lobbyReady:['human','computer'],legalMoves:[{tileId:'6-6',ends:['right']}],canDraw:false,canPass:false};
  const commands=[];class Client{state={view,busy:false,status:'connected',error:null,canResume:true};subscribe(fn){fn(this.state);return()=>{};}async load(){}async resume(){}async refresh(){}async disconnect(){}async command(v){commands.push(v);}async forget(){}}
  const rn={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',TextInput:'TextInput',Platform:{OS:'web'},Share:{},
    AppState:{addEventListener:()=>({remove(){}})},BackHandler:{addEventListener:()=>({remove(){}})}};
  const mocks={'react':React,'react-native':rn,'../i18n/I18nContext':{useI18n:()=>({lang:'es'})},'../nav/NavContext':{useNav:()=>({goHome(){}})},
    '../components/Header':{Header:'Header'},'../computer/DominoTile':{DominoTile:'DominoTile'},'./client':{OnlineClient:Client},'./endpoint':{onlineEndpoint:()=>'http://127.0.0.1:8791',invitation:()=>''},'./transport':{httpTransport:()=>({})},'./credentialStorage':{vault:{},credential:async()=>''}};
  const module={exports:{}};const source=fs.readFileSync(new URL('./OnlineDominoScreen.tsx',import.meta.url),'utf8');
  new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText)(name=>{if(name.endsWith('/GoldPressable'))return{GoldPressable:'Pressable'};if(!(name in mocks))throw Error(name);return mocks[name];},module,module.exports);
  let tree;await act(async()=>{tree=create(React.createElement(module.exports.OnlineDominoScreen));});
  try{const tile=tree.root.findByProps({accessibilityLabel:'Ficha 6-6'});await act(()=>tile.props.onPress());
    const target=tree.root.findByProps({testID:'online-play-right'});assert.equal(target.props.accessibilityLabel,'Colocar en la mesa');
    let parent=target.parent;while(parent){assert.notEqual(parent.type,'ScrollView');parent=parent.parent;}
    await act(()=>target.props.onPress());assert.deepEqual(commands,[{type:'play',tileId:'6-6',end:'right'}]);
  }finally{await act(()=>tree.unmount());}
});
