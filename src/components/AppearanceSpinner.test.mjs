import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('universal control retains all five existing themes and optional Home logo callback',async()=>{
 let current='carbon',spins=0,r;const choices=[];
 const deps={react:React,'react-native':{View:'View',Pressable:'Pressable',Easing:{cubic:x=>x,out:x=>x},Animated:{View:'AnimatedView',Value:class{setValue(){}interpolate(){return 'rotate';}},timing:()=>({start(){}})}},'@expo/vector-icons':{Feather:'Icon'},'expo-linear-gradient':{LinearGradient:'Gradient'},'../theme/ThemeContext':{useTheme:()=>({theme:{colors:{surface:'#111',surfaceAlt:'#222',primary:'#d7a63d',onPrimary:'#000'}},themeName:current,setThemeName:n=>{current=n;choices.push(n);},s:n=>n})}};
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./AppearanceSpinner.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);
 await act(()=>{r=create(React.createElement(m.exports.AppearanceSpinner,{onSpin:()=>spins++}));});
 try{for(let i=0;i<5;i++){await act(()=>r.root.findByType('Pressable').props.onPress());await act(()=>r.update(React.createElement(m.exports.AppearanceSpinner,{onSpin:()=>spins++})));}
  assert.deepEqual(choices,['dark','casino','cubano','usa','carbon']);assert.equal(spins,5);assert.equal(r.root.findByType('Pressable').props.accessibilityLabel,'Change appearance');
 }finally{await act(()=>r.unmount());}
});
