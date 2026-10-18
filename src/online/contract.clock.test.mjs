import test from 'node:test';
import assert from 'node:assert/strict';
import {parseView} from './contract.ts';
const baseline={protocol:1,code:'ABCDEF0123',epoch:'clock-test',revision:1,phase:'waiting',seat:'human',names:{human:'Juni',computer:null},approved:false,closeReason:null,winner:null,reconnectDeadline:[null,null],round:0,turn:null,board:[],hand:[],opponentCount:0,stock:[],scores:null,wins:null,mode:'points',target:100,result:null,roundReady:[],lobbyReady:[],legalMoves:[],canDraw:false,canPass:false,last:null};
const clock={durationMs:30000,remainingMs:29000,deadline:130000,serverNow:101000,paused:false};
const view=turnClock=>({...baseline,presentation:{avatars:{human:'yuni',computer:null},openingId:null,turnClock}});
test('clock projection accepts absent, paused, active and already-expired server snapshots',()=>{
 assert.equal(parseView(baseline).presentation,undefined);
 assert.equal(parseView(view(null)).presentation.turnClock,null);
 assert.deepEqual(parseView(view(clock)).presentation.turnClock,clock);
 const paused={...clock,remainingMs:1000,deadline:null,paused:true};assert.deepEqual(parseView(view(paused)).presentation.turnClock,paused);
 assert.equal(parseView(view({...clock,remainingMs:0,deadline:100000})).presentation.turnClock.remainingMs,0);
});
test('clock projection rejects unsafe values, inconsistent pause state and extra private fields',()=>{
 for(const patch of [{durationMs:0},{durationMs:30001},{remainingMs:30001},{remainingMs:-1},{remainingMs:1.5},{serverNow:Infinity},{serverNow:-1},{deadline:Number.MAX_SAFE_INTEGER+1},{deadline:null},{paused:'yes'},{paused:true},{paused:true,deadline:123},{hiddenHand:[]}]){
  assert.throws(()=>parseView(view({...clock,...patch})),/invalid_snapshot/,JSON.stringify(patch));
 }
 const privateView=view(clock);privateView.presentation.avatars.secret='credential';assert.throws(()=>parseView(privateView),/invalid_snapshot/);
 const extra=view(clock);extra.presentation.stockTiles=[];assert.throws(()=>parseView(extra),/invalid_snapshot/);
});
test('result clock accepts connection pauses and unique holds while rejecting private or invalid fields',()=>{
 const resultClock={durationMs:3000,remainingMs:2500,deadline:3500,serverNow:1000,heldBy:[]};
 const snapshot=clock=>({...view(null),presentation:{...view(null).presentation,resultClock:clock}});
 assert.deepEqual(parseView(snapshot(resultClock)).presentation.resultClock,resultClock);
 assert.equal(parseView(snapshot({...resultClock,deadline:null})).presentation.resultClock.deadline,null);
 assert.deepEqual(parseView(snapshot({...resultClock,deadline:null,heldBy:['computer','human']})).presentation.resultClock.heldBy,['computer','human']);
 for(const patch of [{durationMs:3001},{remainingMs:3001},{heldBy:['human','human']},{heldBy:['human']},{heldBy:['spy']},{secret:[]}])assert.throws(()=>parseView(snapshot({...resultClock,...patch})),/invalid_snapshot/);
});
test('quick attention projection accepts only public bounded event fields',()=>{
 const event={id:'notice-1',from:'computer',kind:'knock',sentAt:1000,expiresAt:4000};
 const snapshot=attention=>({...view(null),presentation:{...view(null).presentation,attention}});
 assert.deepEqual(parseView(snapshot(event)).presentation.attention,event);assert.equal(parseView(snapshot(null)).presentation.attention,null);
 for(const patch of [{id:''},{from:'observer'},{kind:'secret'},{sentAt:-1},{expiresAt:1000},{expiresAt:4001},{hands:[]}])assert.throws(()=>parseView(snapshot({...event,...patch})),/invalid_snapshot/);
});

test('terminal rival hand is optional for deployed server compatibility and rejects duplicate, private or inconsistent tiles',()=>{
 const result={winner:'human',points:5,blocked:false},terminal={...baseline,phase:'playing',hand:[{id:'1-1',a:1,b:1}],opponentCount:1,result};
 assert.equal(parseView(terminal).result.opponentHand,undefined);
 const opponentHand=[{id:'2-3',a:2,b:3}];assert.deepEqual(parseView({...terminal,result:{...result,opponentHand}}).result.opponentHand,opponentHand);
 for(const tiles of [[],terminal.hand,[{id:'2-3',a:2,b:3,secret:'private'}],[{id:'2-8',a:2,b:8}]])assert.throws(()=>parseView({...terminal,result:{...result,opponentHand:tiles}}),/invalid_snapshot/);
 assert.throws(()=>parseView({...baseline,opponentHand}),/invalid_snapshot/);
});
