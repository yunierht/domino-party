import test from 'node:test';import assert from 'node:assert/strict';import {pokerInvitation,parsePokerInvitation} from './pokerInvitation.ts';
test('Poker links preserve ten-hex identity and never route a Domino or Watch link',()=>{
 const code='ABCDEF0123',url=pokerInvitation(code);assert.equal(parsePokerInvitation(url),code);assert.equal(parsePokerInvitation('domino-online-test://online?onlineRoom='+code),null);
 assert.equal(parsePokerInvitation(pokerInvitation(code,'http://localhost:8085/'),'http://localhost:8085/'),code);
 for(const url of ['https://foreign.test/?pokerRoom='+code,'domino-online-test://online?pokerRoom=123456','domino-online-test://online?pokerRoom='+code+'&code=X','domino-online-test://online?pokerRoom='+code+'&pokerRoom='+code])assert.equal(parsePokerInvitation(url),null);
});
