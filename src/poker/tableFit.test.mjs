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
import {pokerBoardZoneHeight} from './tableFit.ts';
test('short fixed tables reserve64px message strip and keep hand above action lane without scrolling',()=>{
 for(const height of [640,740,844]){const board=pokerBoardZoneHeight(height,120,87,24,255);const communityWidth=Math.min(54,Math.max(24,(board-4)/1.43));assert.ok(communityWidth*1.43<=board);const handBottom=48+120+86+board+24+117;const tableBottom=height-87-64;assert.ok(handBottom<=tableBottom-55);assert.ok(handBottom<=height-87-56-46-12);}
});

test('enlarged community row keeps a three pixel felt margin on compact and normal widths',()=>{for(const width of [320,360,390])for(const top of [240,280,320]){const old=communityCardWidth(width,700,120,top),large=communityCardWidth(width,700,120,top,3,2);assert.ok(large>old);assert.ok(Math.abs(large-old-4)<.001);const y=(top-153)/617*600,t=(Math.max(14,Math.min(547,y))-14)/533;const left=-30+(56-41*t)/400*(width+53),right=-30+(344+41*t)/400*(width+53),span=5*large+8;assert.ok(width/2-span/2>=left+2.99);assert.ok(width/2+span/2<=right-2.99);}});
