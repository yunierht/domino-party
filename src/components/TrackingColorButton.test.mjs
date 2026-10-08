import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),{act,create}=require('react-test-renderer');globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function setup(reduced=false){const calls=[],animations=[],stops=[];let r;
 const colors={yellow:'#D7A63D',blue:'#68B9F5',red:'#AA463B',green:'#65C59A'},order=['yellow','blue','red','green'];
 const rn={View:'View',Pressable:'Pressable',AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced,addEventListener:()=>({remove(){}})},Easing:{quad:x=>x,out:x=>x},Animated:{View:'AnimatedView',Value:class{constructor(v){this.value=v;}setValue(v){this.value=v;}stopAnimation(){}interpolate(options){return {value:this,...options};}},timing:(value,options)=>{const animation={value,options,callback:null,start(callback){animation.callback=callback;animations.push(animation);},stop(){}};return animation;}}};
 const deps={react:React,'react-native':rn,'@expo/vector-icons':{MaterialCommunityIcons:'Icon'},'../theme/ThemeContext':{useTheme:()=>({theme:{colors:{text:'#eee',surfaceAlt:'#222',border:'#333'}}})},'../i18n/I18nContext':{useI18n:()=>({lang:'en'})},'../state/useTrackingAppearance':{TRACKING_COLORS:colors}};
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(new URL('./TrackingColorButton.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>deps[id],m,m.exports);
 function Probe(){const [value,setValue]=React.useState('yellow');return React.createElement(m.exports.TrackingColorButton,{teamLabel:'Team A',value,onPress:()=>{calls.push('cycle');setValue(previous=>order[(order.indexOf(previous)+1)%4]);}});}
 await act(async()=>{r=create(React.createElement(Probe));await Promise.resolve();});return {r,calls,animations,colors,stops,press:()=>act(()=>r.root.findByType('Pressable').props.onPress({stopPropagation:()=>stops.push('stop')})),close:()=>act(()=>r.unmount())};
}
test('new color starts one bottom-to-top fill transaction with a static neutral palette',async()=>{const h=await setup();try{
 await h.press();assert.deepEqual(h.calls,['cycle']);assert.deepEqual(h.stops,['stop']);assert.equal(h.animations.length,1);assert.deepEqual(h.animations[0].options,{toValue:1,duration:320,easing:h.animations[0].options.easing,useNativeDriver:false});
 const fill=h.r.root.findByProps({testID:'tracking-color-fill'}),base=h.r.root.findByProps({testID:'tracking-color-strip'});
 assert.equal(fill.props.style.bottom,0);assert.deepEqual(fill.props.style.height.outputRange,[0,24]);assert.equal(fill.props.style.backgroundColor,h.colors.blue);assert.equal(base.props.style.backgroundColor,h.colors.yellow);assert.equal(h.r.root.findByType('Icon').props.color,'#eee');assert.equal(fill.props.style.transform,undefined);
 await act(()=>h.animations[0].callback({finished:true}));assert.equal(h.calls.length,1);assert.equal(h.r.root.findByProps({testID:'tracking-color-strip'}).props.style.backgroundColor,h.colors.blue);
}finally{await h.close();}});
test('rapid taps cannot let an older animation overwrite the latest selected color',async()=>{const h=await setup();try{
 await h.press();await h.press();assert.equal(h.calls.length,2);assert.equal(h.animations.length,2);
 await act(()=>h.animations[0].callback({finished:true}));assert.equal(h.r.root.findByProps({testID:'tracking-color-fill'}).props.style.backgroundColor,h.colors.red);assert.equal(h.r.root.findByProps({testID:'tracking-color-strip'}).props.style.backgroundColor,h.colors.blue);
 await act(()=>h.animations[1].callback({finished:true}));assert.equal(h.r.root.findByProps({testID:'tracking-color-strip'}).props.style.backgroundColor,h.colors.red);assert.equal(h.calls.length,2);
}finally{await h.close();}});
test('reduced motion changes the complete bar immediately without an animation or rotation',async()=>{const h=await setup(true);try{
 await h.press();assert.deepEqual(h.calls,['cycle']);assert.deepEqual(h.animations,[]);const fill=h.r.root.findByProps({testID:'tracking-color-fill'});assert.equal(fill.props.style.height.value.value,1);assert.equal(h.r.root.findByProps({testID:'tracking-color-strip'}).props.style.backgroundColor,h.colors.blue);assert.equal(fill.props.style.transform,undefined);
}finally{await h.close();}});
