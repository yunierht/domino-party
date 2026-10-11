import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSelfie,selfieSize,isValidAvatarPhoto,MAX_AVATAR_PHOTO_LENGTH} from './avatarPhoto.ts';
// Structural JPEG fixture for the adapter boundary, not a decoder or camera-runtime test.
function jpeg(width,height,metadata=false,payload=0){
 const bytes=[255,216,...(metadata?[255,225,0,12,69,120,105,102,0,0,71,80,83,0]:[]),255,192,0,11,8,height>>8,height&255,width>>8,width&255,1,1,17,0,255,218,0,8,1,1,0,0,63,0,...new Array(payload).fill(1),255,217];
 return Buffer.from(bytes).toString('base64');
}
const data=(w,h,metadata=false,payload=0)=>'data:image/jpeg;base64,'+jpeg(w,h,metadata,payload);
test('selfie resizes proportionally, reencodes JPEG at .6, and strips EXIF/GPS metadata',async()=>{
 const calls=[];const value=await prepareSelfie({uri:'file:///camera/selfie.jpg',width:1200,height:1600},async(...args)=>{calls.push(args);return{base64:jpeg(240,320,true),width:240,height:320};});
 assert.deepEqual(calls,[['file:///camera/selfie.jpg',{width:240,height:320},.6]]);
 assert.equal(isValidAvatarPhoto(value),true);assert.equal(atob(value.split(',')[1]).includes('Exif'),false);assert.equal(atob(value.split(',')[1]).includes('GPS'),false);
 assert.deepEqual(selfieSize(100,80),{width:100,height:80});assert.deepEqual(selfieSize(1600,1200),{width:320,height:240});
});
test('invalid dimensions, external URI, invalid JPEG, metadata and oversized data fail closed',async()=>{
 for(const value of [null,12,'https://site.test/selfie.jpg','data:image/png;base64,AA==',data(321,320),data(320,320,true),data(320,320,false,MAX_AVATAR_PHOTO_LENGTH)])assert.equal(isValidAvatarPhoto(value),false);
 assert.throws(()=>selfieSize(0,160));assert.throws(()=>selfieSize(Infinity,1));
 await assert.rejects(prepareSelfie({uri:'https://site.test/image',width:100,height:100},()=>assert.fail('external image must not reach encoder')));
 await assert.rejects(prepareSelfie({uri:'file:///photo',width:100,height:100},async()=>({base64:'not-jpeg',width:100,height:100})));
 await assert.rejects(prepareSelfie({uri:'file:///photo',width:100,height:100},async()=>({base64:jpeg(100,100),width:101,height:100})));
 await assert.rejects(prepareSelfie({uri:'file:///photo',width:320,height:320},async()=>({base64:jpeg(320,320,false,80000),width:320,height:320})),/photo_too_large/);
});
