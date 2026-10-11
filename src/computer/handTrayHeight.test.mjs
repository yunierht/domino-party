import test from 'node:test';import assert from 'node:assert/strict';import {handLayout,handTrayHeight} from './handLayout.ts';
test('two hand rows adapt to measured long messages while reserving the chain and every control',()=>{
 for(const wood of [94,160,206,230]){const available=handTrayHeight(640,105,wood,0),hand=handLayout(14,336,available),tray=(hand.size*2+26)*hand.rows;assert.ok(tray<=available);assert.ok(640-48-105-25-wood-6-tray>=80);assert.equal(hand.rows,2);}
});
test('normal compact and large trays keep the width-limited tile size and restore it when notices clear',()=>{
 for(const [height,width,opponent] of [[640,336,105],[900,416,165]]){const normal=handLayout(14,width,handTrayHeight(height,opponent,98,44)),crowded=handLayout(14,width,handTrayHeight(height,opponent,300,44));assert.ok(crowded.size<=normal.size);assert.deepEqual(handLayout(14,width,handTrayHeight(height,opponent,98,44)),normal);}
});
