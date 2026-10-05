import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import ts from 'typescript';
const artwork=JSON.parse(readFileSync(new URL('../../assets/blackjack-classic-deck-v1.json',import.meta.url),'utf8'));
test('chosen classic deck covers every legal rank and suit locally, including all tens and court cards',()=>{
 assert.equal(Object.keys(artwork).length,52);const names={11:'J',12:'Q',13:'K',14:'A'};
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('./ClassicPlayingCard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>({react:React,'react-native-svg':{SvgXml:'SvgXml'},'../poker/PlayingCard':{PlayingCard:'PlayingCard'},'../../assets/blackjack-classic-deck-v1.json':artwork})[id],module,module.exports);
 for(const suit of ['c','d','h','s'])for(let rank=2;rank<=14;rank++){const key=`${names[rank]??rank}${suit.toUpperCase()}`;assert.match(artwork[key],/<svg\b/);assert.ok(!/<script\b|https?:\/\//i.test(artwork[key].replace(/xmlns(?::xlink)?="[^"]*"/g,'')));const rendered=module.exports.ClassicPlayingCard({card:{rank,suit},width:68});assert.equal(rendered.props.faceArtwork.props.xml,artwork[key]);}
 const back=module.exports.ClassicPlayingCard({back:true});assert.equal(back.props.faceArtwork,undefined);assert.equal(back.props.back,true);
});
