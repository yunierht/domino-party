import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function stamp(props){const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL('./TableFinish.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;const svg={__esModule:true,default:'Svg',Defs:'Defs',LinearGradient:'LinearGradient',Stop:'Stop',Rect:'Rect',Path:'Path',G:'G',Circle:'Circle',Text:'SvgText'};new Function('require','module','exports',code)(id=>id==='react'?React:svg,m,m.exports);let element=m.exports.TableStamp(props);if(typeof element.type==='function')element=element.type(element.props);return element;}
function nodes(element){return [element,...React.Children.toArray(element.props.children).filter(React.isValidElement).flatMap(nodes)];}
test('Domino keeps its approved light crown, typography and colors without opting in',()=>{
 const tree=stamp({title:'DOMINO',light:true}),all=nodes(tree),paths=all.filter(n=>n.type==='Path'),texts=all.filter(n=>n.type==='SvgText');
 assert.equal(paths.length,2);assert.equal(paths[1].props.d,'M135 19L131 7L141 13L150 3L159 13L169 7L165 19Z M136 23H164');
 assert.equal(paths[1].props.fill,'#94A49B');assert.equal(texts[1].props.fill,'#94A49B');assert.equal(texts[1].props.children,'DOMINO');assert.equal(tree.props.viewBox,'0 0 300 85');
});
test('All three games opt into the same discreet tonal green engraving within the existing stamp area',()=>{
 for(const title of ['DOMINO','POKER','BLACKJACK']){
  const tree=stamp({title,light:true,engraved:true}),all=nodes(tree);
  assert.equal(tree.props.viewBox,'0 0 300 85');
  assert.ok(all.some(n=>n.props.testID==='discreet-stamp-crown'&&n.props.opacity<1));
  assert.ok(all.some(n=>n.type==='SvgText'&&n.props.children===title&&n.props.fill==='#123F2E'));
  assert.ok(all.some(n=>n.type==='SvgText'&&n.props.children==='SOCIAL CLUB'));
  assert.ok(!all.some(n=>n.props.fill==='#94A49B'));
 }
});
test('Domino opts into green letters while retaining every crown property and text position',()=>{
 const old=nodes(stamp({title:'DOMINO',light:true})),updated=nodes(stamp({title:'DOMINO',light:true,engravedText:true}));
 assert.deepEqual(updated.filter(n=>n.type==='Path').map(n=>n.props),old.filter(n=>n.type==='Path').map(n=>n.props));
 const before=old.filter(n=>n.type==='SvgText'),after=updated.filter(n=>n.type==='SvgText');
 for(let i=0;i<4;i++){for(const key of ['x','y','fontSize','fontWeight','letterSpacing','textAnchor','children'])assert.deepEqual(after[i].props[key],before[i].props[key]);}
 assert.equal(after[1].props.fill,'#123F2E');assert.equal(after[3].props.stroke,'#0A3022');
});
