import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript');
function nativeGradient(){
 const m={exports:{}};const deps={react:React,'react-native':{processColor:()=>0xffffffff},'./extractOpacity':()=>1,'./extractTransform':()=>null,'../units':{objectBoundingBox:0}};
 const path=require.resolve('react-native-svg/package.json').replace(/package\.json$/,'src/lib/extract/extractGradient.ts');
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);return m.exports.default;
}
function stopOffsets(file){const source=ts.createSourceFile(file,fs.readFileSync(new URL(file,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),values=[];
 const visit=node=>{if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(source)==='Stop'){
  const a=node.attributes.properties.find(p=>p.name?.getText(source)==='offset');const v=a.initializer;
  values.push(ts.isStringLiteral(v)?v.text:Number(v.expression.getText(source)));
 }ts.forEachChild(node,visit);};visit(source);return values;
}
test('tracking dial stop offsets are accepted by the installed native SVG gradient parser',()=>{
 const offsets=stopOffsets('./TrackingCounter.tsx');const warnings=[],prior=console.warn;let parsed;
 try{console.warn=message=>warnings.push(message);parsed=nativeGradient()({id:'dial',children:offsets.map(offset=>React.createElement('Stop',{offset,stopColor:'#ffffff'}))},null);}finally{console.warn=prior;}
 assert.deepEqual(warnings,[]);assert.deepEqual(parsed.gradient.filter((_,i)=>i%2===0),[0,.65,1]);
});

// Use the installed SVG matrix code and G.setNativeProps; only the host view is a capture stub.
function nativeTransforms(){
 const base=path.dirname(require.resolve('react-native-svg/package.json')),cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',compiled)(id=>{
   if(id==='react')return React;
   if(id==='./Shape')return class Shape{constructor(props){this.props=props;}};
   if(id.includes('extractProps'))return {__esModule:true,default:()=>({}),propsAndStyles:p=>p};
   if(id.includes('extractText'))return {extractFont:()=>({})};
   if(id.includes('GroupNativeComponent'))return 'NativeGroup';
   if(id.startsWith('.')){
    const target=path.resolve(path.dirname(file),id);
    for(const extension of ['','.ts','.tsx','.js'])if(fs.existsSync(target+extension)&&fs.statSync(target+extension).isFile())return load(target+extension);
   }
   return require(id);
  },m,m.exports);return m.exports;
 }
 return {extract:load(path.join(base,'src/lib/extract/extractTransform.ts')).default,NativeG:load(path.join(base,'src/elements/G.tsx')).default};
}
const identity=[1,0,0,1,0,0];
function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
function transform(m,[x,y]){return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}

test('speedometer needle keeps its pivot and geometry through rotation-only frames and successive scores',async()=>{
 const {act,create}=require('react-test-renderer'),{extract,NativeG}=nativeTransforms();
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const values=[],animations=[];
 class Value{
  constructor(value){this.value=value;this.listeners=new Map();values.push(this);}
  setValue(value){this.value=value;for(const listener of this.listeners.values())listener({value});}
  stopAnimation(){}
  addListener(listener){const key=String(this.listeners.size);this.listeners.set(key,listener);return key;}
  removeListener(key){this.listeners.delete(key);}
  interpolate({inputRange,outputRange}){return {getValue:()=>outputRange[0]+(outputRange[1]-outputRange[0])*(this.value-inputRange[0])/(inputRange[1]-inputRange[0])};}
 }
 const noAnimation=()=>({start(){},stop(){}});
 const rn={View:'View',Text:'Text',AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:()=>({remove(){}})},Easing:{cubic:x=>x,quad:x=>x,out:x=>x,in:x=>x},Animated:{Value,View:'AnimatedView',Text:'AnimatedText',createAnimatedComponent:type=>'Animated'+type,timing:(value,options)=>{animations.push({value,options});return noAnimation();},spring:noAnimation,sequence:noAnimation,loop:noAnimation,delay:noAnimation}};
 const svg={__esModule:true,default:'Svg'};for(const type of ['Circle','Defs','Ellipse','G','Line','Path','RadialGradient','Rect','Stop','Text'])svg[type]=type;
 const m={exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./TrackingCounter.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>({react:React,'react-native':rn,'react-native-svg':svg}[id]),m,m.exports);
 const props={style:'speedometer',score:0,target:100,remaining:100,color:'#D7A63D',size:200,pulse:false,intensity:0,label:'Team'};
 let renderer;await act(()=>{renderer=create(React.createElement(m.exports.TrackingCounter,props));});
 try{
  const progress=values[1],count=values[0];
  for(const [from,to] of [[0,25],[25,50],[50,75],[75,100],[100,0],[0,15],[15,35]]){
   await act(()=>renderer.update(React.createElement(m.exports.TrackingCounter,{...props,score:to,remaining:100-to})));
   assert.equal(values[1],progress,'score updates retain the progress value');
   assert.equal(animations.filter(a=>a.value===progress).at(-1).options.toValue,to/100);
   for(let frame=0;frame<=20;frame++){
    const score=from+(to-from)*frame/20;progress.setValue(score/100);
    await act(()=>count.setValue(score)); // Number renders interleave with imperative SVG frames.
    const needle=renderer.root.findAllByType('AnimatedG')[0];
    const rotation=needle.props.rotation.getValue();
    const native=new NativeG(needle.props);let update;native.root={setNativeProps:p=>{update=p;}};native.setNativeProps({rotation});
    const pathNode=needle.findAllByType('Path')[0],groups=[];
    for(let node=pathNode.parent;node&&node.type!=='Svg';node=node.parent)if(node.type==='G'||node.type==='AnimatedG')groups.unshift(node);
    for(const imperative of [false,true]){
     const matrix=groups.reduce((acc,node)=>multiply(acc,node===needle?(imperative?update.matrix:extract({...node.props,rotation})):extract(node.props)||identity),identity);
     for(const p of [[100,100],[100,30],[97,101],[103,101]]){
      const angle=rotation*Math.PI/180,dx=p[0]-100,dy=p[1]-100;
      const expected=[100+dx*Math.cos(angle)-dy*Math.sin(angle),100+dx*Math.sin(angle)+dy*Math.cos(angle)];
      transform(matrix,p).forEach((coordinate,i)=>assert.ok(Math.abs(coordinate-expected[i])<1e-8,`${imperative?'native frame':'render'} at score ${score}: needle geometry must rotate around 100,100`));
     }
    }
   }
  }
 }finally{await act(()=>renderer.unmount());}
});
