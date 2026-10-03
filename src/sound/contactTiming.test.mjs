import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {CONTACT_IMPACT_MS} from './contactTiming.ts';
test('contact timing matches dominant PCM frame without editing any approved audio',()=>{
 const names=[1,2,3,4].map(i=>`tile-contact-cycle-${i}`).concat('tile-contact-final-first-v1');
 names.forEach((name,index)=>{const b=readFileSync(new URL(`../../assets/sounds/${name}.wav`,import.meta.url));let fmt,pcm;
 for(let p=12;p+8<=b.length;){const n=b.readUInt32LE(p+4),id=b.toString('ascii',p,p+4);if(id==='fmt ')fmt=b.subarray(p+8,p+8+n);if(id==='data')pcm=b.subarray(p+8,p+8+n);p+=8+n+n%2;}
 const channels=fmt.readUInt16LE(2),rate=fmt.readUInt32LE(4);assert.equal(fmt.readUInt16LE(14),16);let peak=0,frame=0;
 for(let p=0;p<pcm.length;p+=2){const a=Math.abs(pcm.readInt16LE(p));if(a>peak){peak=a;frame=Math.floor(p/(2*channels));}}
 assert.ok(Math.abs(CONTACT_IMPACT_MS[index]-frame/rate*1000)<.001,name);
 });
});
