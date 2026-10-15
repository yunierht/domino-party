import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{readConfig,associations}=require('./lib/onlineLinksConfig.cjs');
const [configFile,outputDir,mode]=process.argv.slice(2);
if(!outputDir)throw Error('Usage: node scripts/prepare-online-links.mjs CONFIG OUTPUT [--preview]');
const preview=mode==='--preview';
const c=preview?{purpose:'preview',origin:null,scheme:'domino-online-test',stores:{android:null,ios:null}}:readConfig(configFile,{androidOnly:mode==='--android-only'});
let pilot=null;
if(mode==='--include-pilot'){
 if(c.application!=='domino-social-club-update')throw Error('Pilot coexistence requires the published update profile');
 pilot=readConfig('config/online-internet.json',{androidOnly:true});
 if(pilot.origin!==c.origin||pilot.purpose!=='staging'||pilot.scheme!=='domino-online-test')throw Error('Pilot origin/identity mismatch');
}
const dir=resolve(outputDir);await mkdir(join(dir,'online/invite'),{recursive:true});
await copyFile('web/online-invitation/index.html',join(dir,'online/invite/index.html'));
await copyFile('web/online-invitation/landing.js',join(dir,'online/invite/landing.js'));
const publicConfig={purpose:c.purpose,origin:c.origin,scheme:c.scheme,stores:c.stores,automaticStoreFallback:c.purpose==='release'&&!pilot,...(pilot?{secondaryScheme:pilot.scheme}:{})};
await writeFile(join(dir,'online/invite/configuration.js'),'window.ONLINE_INVITATION_CONFIG='+JSON.stringify(publicConfig).replaceAll('<','\\u003c')+';\n');
if(!preview){const a=associations(c);if(pilot)a.android.push(...associations(pilot).android);await mkdir(join(dir,'.well-known'),{recursive:true});await writeFile(join(dir,'.well-known/assetlinks.json'),JSON.stringify(a.android,null,2));if(a.apple)await writeFile(join(dir,'.well-known/apple-app-site-association'),JSON.stringify(a.apple,null,2));}
await writeFile(join(dir,'readiness.json'),JSON.stringify({purpose:c.purpose,origin:c.origin,nativeAssociationsGenerated:!preview,storeFallbacksConfigured:!!c.stores.android&&!!c.stores.ios,requiresHostingApproval:true,osVerified:false,deployPerformed:false},null,2));
console.log(JSON.stringify({output:dir,preview,publicDeployment:false}));
