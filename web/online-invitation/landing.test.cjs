const test=require('node:test'),assert=require('node:assert/strict');
const {invitation,platform,mount}=require('./landing.js');
test('canonical room round-trips exactly and rejects private credentials, duplicates, extra routes and malformed codes',()=>{
 assert.deepEqual(invitation('https://staging.example.test/online/invite?onlineRoom=ABCDEF0123'),{code:'ABCDEF0123',url:'https://staging.example.test/online/invite?onlineRoom=ABCDEF0123'});
 assert.equal(invitation('https://staging.example.test/online/invite?onlineRoom=abcdef0123').code,'ABCDEF0123');
 for(const url of ['http://staging.example.test/online/invite?onlineRoom=ABCDEF0123','https://staging.example.test/online/invite?onlineRoom=ABCDEF0123&token=secret','https://u:p@staging.example.test/online/invite?onlineRoom=ABCDEF0123','https://staging.example.test/online/invite?onlineRoom=ABCDEF0123&onlineRoom=FFFFFFFFFF','https://staging.example.test/watch?onlineRoom=ABCDEF0123','https://staging.example.test/online/invite?onlineRoom=123456','https://staging.example.test/online/invite?onlineRoom=ABCDEF0123#token'])assert.throws(()=>invitation(url));
});
test('platform detection covers Android/iPhone/iPadOS but remains a synthetic JS test, not OS verification',()=>{
 assert.equal(platform({userAgent:'Android'}),'android');assert.equal(platform({userAgent:'iPhone'}),'ios');assert.equal(platform({userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5}),'ios');assert.equal(platform({userAgent:'Windows'}),null);
});
function windowFixture(config){
 const nodes={},events={},timers=new Map(),redirects=[],copied=[];let next=0;
 for(const id of ['status','room','copy-code','copy-link','open','open-pilot','install','return','scope'])nodes[id]={hidden:['open','open-pilot','install','return'].includes(id),disabled:true,events:{},addEventListener(type,fn){this.events[type]=fn;}};
 const document={hidden:false,getElementById:id=>nodes[id],addEventListener:(type,fn)=>{events[type]=fn;}};
 const w={ONLINE_INVITATION_CONFIG:config,document,location:{href:'https://staging.example.test/online/invite?onlineRoom=ABCDEF0123',origin:'https://staging.example.test',replace:url=>redirects.push(url)},navigator:{userAgent:'Android',clipboard:{writeText:async text=>copied.push(text)}},addEventListener:(type,fn)=>{events[type]=fn;},setTimeout:fn=>{const id=++next;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)};
 return{w,nodes,events,timers,redirects,copied};
}
test('unpublished staging keeps installation explicit and retains the exact return link without store placeholders',async()=>{
 const f=windowFixture({purpose:'staging',origin:'https://staging.example.test',scheme:'domino-online-test',stores:{}});mount(f.w);
 assert.equal(f.nodes.install.hidden,true);assert.equal(f.timers.size,0);assert.equal(f.nodes.open.href,'domino-online-test://online?onlineRoom=ABCDEF0123');
 await f.nodes['copy-link'].events.click();assert.deepEqual(f.copied,['https://staging.example.test/online/invite?onlineRoom=ABCDEF0123']);
});
test('configured store fallback uses the platform URL, but opening app, copying or leaving the page cancels it',async()=>{
 const config={purpose:'release',origin:'https://staging.example.test',scheme:'domino-online-test',automaticStoreFallback:true,stores:{android:'https://play.google.com/store/apps/details?id=com.nextcodestudios.dominoonline.test'}};
 const direct=windowFixture(config);mount(direct.w);for(const fn of direct.timers.values())fn();assert.deepEqual(direct.redirects,[config.stores.android]);
 for(const action of ['open','copy-link','visibilitychange','pagehide']){const f=windowFixture(config);mount(f.w);if(action==='visibilitychange'){f.w.document.hidden=true;f.events[action]();}else if(action==='pagehide')f.events[action]();else await f.nodes[action].events.click();assert.equal(f.timers.size,0);assert.equal(f.redirects.length,0);}
});

test('Poker shares the public path but opens only Poker, never Domino',()=>{const v=invitation('https://staging.example.test/online/invite?pokerRoom=ABCDEF0123');assert.equal(v.game,'poker');assert.equal(v.code,'ABCDEF0123');assert.throws(()=>invitation('https://staging.example.test/online/invite?pokerRoom=ABCDEF0123&onlineRoom=ABCDEF0123'));});

test('published candidate keeps explicit pilot opening and carries only the public room in Play referrer',()=>{const f=windowFixture({purpose:'release',origin:'https://staging.example.test',scheme:'dominoparty',secondaryScheme:'domino-online-test',automaticStoreFallback:false,stores:{android:'https://play.google.com/store/apps/details?id=com.yht.dominoparty'}});f.w.location.href='https://staging.example.test/online/invite?pokerRoom=ABCDEF0123';mount(f.w);assert.equal(f.nodes.open.href,'dominoparty://online?pokerRoom=ABCDEF0123');assert.equal(f.nodes['open-pilot'].href,'domino-online-test://online?pokerRoom=ABCDEF0123');assert.equal(f.nodes['open-pilot'].hidden,false);assert.equal(f.timers.size,0);const store=new URL(f.nodes.install.href),ref=new URLSearchParams(store.searchParams.get('referrer'));assert.equal(store.searchParams.get('id'),'com.yht.dominoparty');assert.equal(ref.get('dp_v'),'1');assert.equal(ref.get('dp_link'),f.w.location.href);});
