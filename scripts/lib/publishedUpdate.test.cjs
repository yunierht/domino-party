const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validateConfig,associations}=require('./onlineLinksConfig.cjs');
const root=path.resolve(__dirname,'../..'),published=()=>JSON.parse(fs.readFileSync(path.join(root,'config/social-club-update.json'),'utf8'));
test('published update is explicit and uses verified store identities without allowing inherited staging identity',()=>{
 const c=validateConfig(published()),a=associations(c);
 assert.equal(a.android[0].target.package_name,'com.yht.dominoparty');
 assert.equal(a.apple.applinks.details[0].appID,'79C77F44DM.com.yht.dominoparty');
 for(const change of [c=>delete c.application,c=>c.purpose='staging',c=>c.scheme='domino-online-test',c=>c.native.easProjectId='9d4cdf14-2853-4b0f-86f4-03108c445056',c=>c.native.androidVersionCode=26,c=>c.ios.teamId='TESTTEAM01',c=>c.stores.android='https://play.google.com/store/apps/details?id=com.example.wrong',c=>c.android.sha256=['FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C']]){const candidate=published();change(candidate);assert.throws(()=>validateConfig(candidate));}
});
test('published factory changes packaging only and preserves default test identity and application settings',()=>{
 const factory=require('../../app.config.js'),base=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo;
 const keys=['EXPO_PUBLIC_ONLINE_MODE','DOMINO_ONLINE_LINKS_CONFIG','EXPO_PUBLIC_ONLINE_ORIGIN','EXPO_PUBLIC_DOMINO_ONLINE_URL','EXPO_PUBLIC_POKER_ONLINE_URL','EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE','EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE','ONLINE_BUILD_PLATFORM'];
 const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 function environment(file){const c=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));Object.assign(process.env,{EXPO_PUBLIC_ONLINE_MODE:'internet',DOMINO_ONLINE_LINKS_CONFIG:path.join(root,file),EXPO_PUBLIC_ONLINE_ORIGIN:c.origin,EXPO_PUBLIC_DOMINO_ONLINE_URL:c.origin,EXPO_PUBLIC_POKER_ONLINE_URL:c.origin,EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE:c.origin+'/online/invite',EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE:c.origin+'/online/invite',ONLINE_BUILD_PLATFORM:'android'});}
 try{
  process.env.EXPO_PUBLIC_ONLINE_MODE='lan';assert.equal(factory({config:base}),base);
  environment('config/social-club-update.json');const result=factory({config:base});
  assert.equal(result.android.package,'com.yht.dominoparty');assert.equal(result.android.versionCode,50);assert.equal(result.version,'1.0.14');assert.equal(result.scheme,'dominoparty');
  assert.equal(result.extra.eas.projectId,'4ca6648b-ec5a-4b08-b425-519db3c4ebd7');
  assert.deepEqual(result.android.permissions,base.android.permissions);assert.deepEqual(result.plugins,base.plugins);assert.equal(result.orientation,base.orientation);assert.equal(result.icon,base.icon);
  assert.equal(result.ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains,undefined);
  assert.equal(result.ios.infoPlist.NSLocalNetworkUsageDescription,undefined);
  process.env.ONLINE_BUILD_PLATFORM='ios';const ios=factory({config:base});const linked=require('../../plugins/withOnlineInvitationLinks.js')(ios);assert.equal(linked.ios.bundleIdentifier,'com.yht.dominoparty');assert.equal(linked.ios.buildNumber,'20');assert.equal(linked.ios.appleTeamId,'79C77F44DM');assert.deepEqual(linked.ios.associatedDomains,['applinks:domino-online-internet-test.domino-party.workers.dev']);
  assert.equal(base.android.package,'com.nextcodestudios.dominoonline.test');
  environment('config/online-internet.json');const pilot=factory({config:base});assert.equal(pilot.android.package,base.android.package);assert.equal(pilot.android.versionCode,5);assert.equal(pilot.extra.eas.projectId,base.extra.eas.projectId);
 }finally{for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}}
});
