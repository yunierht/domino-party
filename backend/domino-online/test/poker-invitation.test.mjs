import test from 'node:test';import assert from 'node:assert/strict';import {pokerInvitationPage} from '../src/pokerInvitationPage.ts';
test('share page opens the installed app with canonical identity; fallback shows six digits without credentials',async()=>{
 const response=pokerInvitationPage(new URL('http://localhost/poker/invite?pokerRoom=ABCDEF0123&manualCode=123456&scheme=domino-online-test'));
 assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('domino-online-test://online?pokerRoom=ABCDEF0123'));assert.ok(html.includes('<strong>123456</strong>'));assert.ok(!html.includes('Bearer'));assert.ok(!html.includes('<script'));
 for(const query of ['pokerRoom=<script>','pokerRoom=ABCDEF0123&scheme=javascript','pokerRoom=ABCDEF0123&manualCode=oops','pokerRoom=ABCDEF0123&token=secret'])assert.equal(pokerInvitationPage(new URL('http://localhost/poker/invite?'+query)).status,400);
});
