import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,project} from '../src/room.ts';
// Signature fixture exercises bounded transport validation, not an image decoder.
const photo=bytes=>'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64');
const jpeg=photo([255,216,255,224,0,16,255,217]);
test('selfie photos belong to authenticated seats and survive room restore without leaking into old contracts',()=>{
 const waiting=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'selfie',avatarPhoto:jpeg,customAvatars:true});
 assert.deepEqual(project(waiting,'host').presentation.avatarPhotos,{human:jpeg,computer:null});
 const guestPhoto=photo([255,216,255,224,0,17,255,217]);
 const joined=joinRoom(waiting,'guest','Andy',1,{avatar:'selfie',avatarPhoto:guestPhoto,acceptInvitation:true},()=>.5);
 const restored=JSON.parse(JSON.stringify(joined));
 for(const token of ['host','guest']){
  assert.deepEqual(project(restored,token).presentation.avatarPhotos,{human:jpeg,computer:guestPhoto});
  assert.deepEqual(project(restored,token).presentation.avatars,{human:'selfie',computer:'selfie'});
 }
 assert.equal(joinRoom(restored,'guest','Other name',2,{avatar:'selfie',avatarPhoto:jpeg,acceptInvitation:true}),restored);
 assert.throws(()=>project(restored,'unknown'),/unauthorized/);
 const old=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'});
 assert.equal('avatarPhotos' in project(old,'host').presentation,false);
 assert.throws(()=>joinRoom(old,'guest','Andy',1,{avatar:'selfie',avatarPhoto:jpeg,acceptInvitation:true}),/invalid_avatar/);
});
test('selfie rejects missing, oversized, foreign MIME, remote URL and malformed JPEG data',()=>{
 const values=[undefined,'',null,'https://example.com/selfie.jpg','data:image/svg+xml;base64,PHN2Zz4=',
  'data:image/png;base64,iVBORw0KGgo=',photo([0,1,2,3]),'data:image/jpeg;base64,/9j/%%==',
  photo([255,216,255,224,0,1]),'data:image/jpeg;base64,/9j/'+ 'A'.repeat(96*1024)];
 for(const avatarPhoto of values)assert.throws(()=>createRoom('ABCDEF0123','e','host','Juni',0,100,'points',
  {avatar:'selfie',avatarPhoto,customAvatars:true}),/invalid_avatar_photo/);
 assert.throws(()=>createRoom('ABCDEF0123','e','host','Juni',0,100,'points',{avatar:'yuni',avatarPhoto:jpeg,customAvatars:true}),/invalid_avatar_photo/);
 assert.throws(()=>createRoom('ABCDEF0123','e','host','Juni',0,100,'points',{avatar:'selfie',avatarPhoto:jpeg}),/invalid_avatar/);
});
