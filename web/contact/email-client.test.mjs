import assert from 'node:assert/strict';
import {emailClientDraft} from './email-client.mjs';
const draft=emailClientDraft({name:'Synthetic visitor',email:'visitor@example.com',message:'Question with & ? # and two lines\nSecond line'},'es');
const url=new URL(draft.href);
assert.equal(url.pathname,'yunierht@yahoo.com');assert.equal(url.searchParams.get('subject'),'Domino Social Club — website contact');
assert.match(url.searchParams.get('body'),/visitor@example.com/);assert.match(url.searchParams.get('body'),/\nSecond line/);
assert.match(draft.status,/pulsa Enviar allí/);assert.match(draft.status,/no puede confirmar/);
assert.throws(()=>emailClientDraft({name:'Injected\nBcc: victim@example.com',email:'visitor@example.com',message:'Never send this input.'}));
console.log('PASS: optional local email draft preserves fields/encoding and makes no send claim; not wired into live form.');
