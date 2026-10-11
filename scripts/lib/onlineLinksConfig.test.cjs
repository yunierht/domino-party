const test=require('node:test'),assert=require('node:assert/strict');
const {validateConfig,associations}=require('./onlineLinksConfig.cjs');
function fixture(){return{purpose:'staging',origin:'https://staging.example.test',scheme:'domino-online-test',android:{package:'com.nextcodestudios.dominoonline.test',sha256:[Array(32).fill('AB').join(':')]},ios:{bundleIdentifier:'com.nextcodestudios.dominoonline.test',teamId:'TESTTEAM01'},stores:{android:null,ios:null}};}
test('association generation scopes verified identities to Online path and omits private room credentials',()=>{
 const c=validateConfig(fixture()),a=associations(c);
 assert.equal(a.android[0].target.package_name,c.android.package);
 assert.deepEqual(a.apple.applinks.details[0].paths,['/online/invite']);
 assert.equal(a.apple.applinks.details[0].appID,'TESTTEAM01.com.nextcodestudios.dominoonline.test');
 assert.equal(JSON.stringify(a).includes('token'),false);
});
test('missing domain/team/signature, inherited app identity and unverified release stores fail closed',()=>{
 for(const mutate of [c=>c.origin=null,c=>c.origin='http://staging.example.test',c=>c.origin='https://192.168.1.194',c=>c.ios.teamId=null,c=>c.android.sha256=[],c=>c.android.package='com.yht.dominoparty',c=>c.purpose='release',c=>c.stores.android='https://play.google.com/store/apps/details?id=com.yht.dominoparty',c=>c.stores.ios='https://apps.apple.com/app/id6793746031']){const c=fixture();mutate(c);assert.throws(()=>validateConfig(c));}
});
test('production release cannot associate the pilot debug certificate even with structurally valid store URLs',()=>{
 const c=fixture();c.purpose='release';c.android.sha256=['FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C'];c.stores={android:'https://play.google.com/store/apps/details?id='+c.android.package,ios:'https://apps.apple.com/app/id1234567890'};
 assert.throws(()=>validateConfig(c),/debug certificate/);
});
test('native plugin is inert without activation, and refuses a different build identity',()=>{
 const plugin=require('../../plugins/withOnlineInvitationLinks.js'),config={android:{package:'com.nextcodestudios.dominoonline.test'},ios:{bundleIdentifier:'com.nextcodestudios.dominoonline.test'},scheme:'domino-online-test'};
 const saved=process.env.DOMINO_ONLINE_LINKS_CONFIG;delete process.env.DOMINO_ONLINE_LINKS_CONFIG;
 try{assert.equal(plugin(config),config);}finally{if(saved!==undefined)process.env.DOMINO_ONLINE_LINKS_CONFIG=saved;}
});
test('activation adds only the exact Online HTTPS path and requires identical native build identity',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),plugin=require('../../plugins/withOnlineInvitationLinks.js');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'online-links-')),file=path.join(dir,'config.json'),c=fixture();fs.writeFileSync(file,JSON.stringify(c));
 const before=[process.env.DOMINO_ONLINE_LINKS_CONFIG,process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE];
 process.env.DOMINO_ONLINE_LINKS_CONFIG=file;process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE=c.origin+'/online/invite';
 try{const config={android:{package:c.android.package},ios:{bundleIdentifier:c.ios.bundleIdentifier},scheme:c.scheme};const applied=plugin(config);assert.deepEqual(applied.ios.associatedDomains,['applinks:staging.example.test']);assert.deepEqual(applied.android.intentFilters[0].data,[{scheme:'https',host:'staging.example.test',path:'/online/invite'}]);assert.throws(()=>plugin({...config,android:{package:'com.example.different'}}));}
 finally{for(const [i,key] of ['DOMINO_ONLINE_LINKS_CONFIG','EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE'].entries()){if(before[i]===undefined)delete process.env[key];else process.env[key]=before[i];}fs.unlinkSync(file);fs.rmdirSync(dir);}
});
