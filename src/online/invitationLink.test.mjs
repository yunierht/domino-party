import test from 'node:test';import assert from 'node:assert/strict';
import {invitationLink,parseInvitationLink,sharePayload} from './invitationLink.ts';
test('pilot invitation keeps its own native scheme, six-digit manual text and ten-digit canonical room',()=>{
 const room='ABCDEF0123',scheme='domino-online-test';
 const payload=sharePayload(room,true,undefined,'playing',scheme,'000007');
 assert.equal(payload.url,`${scheme}://online?onlineRoom=${room}`);
 assert.ok(payload.text.includes('000007'));
 assert.deepEqual(parseInvitationLink(payload.url,undefined,scheme),{code:room});
 assert.equal(payload.url.includes('000007'),false);
});
const code='ABCDEF0123',base='http://127.0.0.1:8099/';
test('sharing displays the six-digit manual alias while the canonical invitation URL remains unchanged',()=>{
 const payload=sharePayload(code,true,base,'waiting','dominoparty','000007');assert.equal(payload.url,invitationLink(code,base));assert.match(payload.text,/000007/);assert.deepEqual(parseInvitationLink(payload.url,base),{code});assert.throws(()=>sharePayload(code,true,base,'waiting','dominoparty','12345'),/invalid_code/);
});
test('invitation contains only the public room code, never seat credentials',()=>{
 const link=invitationLink(code,base);assert.equal(link,base+'?onlineRoom='+code);assert.deepEqual(parseInvitationLink(link,base),{code});
 assert.equal(sharePayload(code,true,base,'waiting').url,link);assert.throws(()=>sharePayload(code,true,base,'closed'),/unavailable/);
});
test('cold and warm links use a dedicated Online route and reject malformed/foreign payloads',()=>{
 assert.deepEqual(parseInvitationLink('dominoparty://online?onlineRoom=abcdef0123',base),{code});
 assert.equal(parseInvitationLink('dominoparty://watch?code=ABCD',base),null);
 for(const url of [base+'?onlineRoom=short',base+'?onlineRoom='+code+'&onlineRoom='+code,base+'?onlineRoom='+code+'&token=secret','https://foreign.invalid/?onlineRoom='+code,base+'?onlineRoom='+code+'#secret'])assert.deepEqual(parseInvitationLink(url,base),{error:'invalid_invitation'});
});
