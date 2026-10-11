import test from 'node:test';
import assert from 'node:assert/strict';
import {parseView} from './contract.ts';
import {createRoom,project} from '../../backend/domino-online/src/room.ts';

test('private snapshot parser accepts every approved old and new avatar identity for both seats',()=>{
 const snapshot=project(createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'}),'host',0);
 for(const avatar of ['yuni','yoi','diego','rafael','lucia','rigo','mateo','kenji','oliver','amara','lina','sofia']){
  const view={...snapshot,presentation:{...snapshot.presentation,avatars:{human:avatar,computer:avatar}}};
  assert.deepEqual(parseView(JSON.parse(JSON.stringify(view))).presentation.avatars,{human:avatar,computer:avatar});
 }
 for(const invalid of ['unknown','Sofía','sofia.png','../mateo','MATEO']){
  assert.throws(()=>parseView({...snapshot,presentation:{...snapshot.presentation,avatars:{human:invalid,computer:null}}}),/invalid_snapshot/);
 }
});
test('selfie snapshot requires bounded JPEG data tied only to selfie seats',()=>{
 const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,255,217]).toString('base64');
 const snapshot=project(createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'}),'host',0);
 const presentation={...snapshot.presentation,avatars:{human:'selfie',computer:'rafael'},avatarPhotos:{human:photo,computer:null}};
 assert.deepEqual(parseView({...snapshot,presentation}).presentation.avatarPhotos,{human:photo,computer:null});
 for(const avatarPhotos of [undefined,{human:null,computer:null},{human:photo,computer:photo},{human:'https://example.com/photo.jpg',computer:null},
  {human:'data:image/jpeg;base64,/9j/'+ 'A'.repeat(96*1024),computer:null},{human:photo,computer:null,other:photo}]){
  assert.throws(()=>parseView({...snapshot,presentation:{...presentation,avatarPhotos}}),/invalid_snapshot/);
 }
});
