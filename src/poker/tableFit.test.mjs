import test from 'node:test';
import assert from 'node:assert/strict';
import {communityCardWidth} from './tableFit.ts';
test('community row fits inside felt with nine pixel clearance on narrow and wide screens',()=>{
 for(const width of [320,360,390,430,580]){
  for(const rowTop of [240,280,320]){
   const card=communityCardWidth(width,700,120,rowTop);
   const span=5*card+16;
   const y=(rowTop-153)/617*600;
   const t=(Math.max(14,Math.min(547,y))-14)/533;
   const left=-30+(56-41*t)/400*(width+53);
   const right=-30+(344+41*t)/400*(width+53);
   assert.ok(width/2-span/2>=left+8.99);
   assert.ok(width/2+span/2<=right-8.99);
  }
 }
});
