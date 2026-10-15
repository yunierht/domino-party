const fs=require('node:fs');
function readConfig(file,options){return validateConfig(JSON.parse(fs.readFileSync(file,'utf8')),options);}
function validateConfig(c,{androidOnly=false}={}){
 if(!c||!['staging','release'].includes(c.purpose))throw Error('Choose staging or release');
 const updatingPublished=c.application==='domino-social-club-update';
 if(c.application!==undefined&&!updatingPublished)throw Error('Unknown application profile');
 if(updatingPublished){
  if(c.purpose!=='release'||c.android?.package!=='com.yht.dominoparty'||c.ios?.bundleIdentifier!=='com.yht.dominoparty'||c.scheme!=='dominoparty')throw Error('Published update identity mismatch');
  if(c.ios.teamId!=='79C77F44DM')throw Error('Published Apple signing team mismatch');
  if(c.native?.easProjectId!=='4ca6648b-ec5a-4b08-b425-519db3c4ebd7'||!/^1\.0\.\d+$/.test(c.native.version)||!Number.isSafeInteger(c.native.androidVersionCode)||c.native.androidVersionCode<=26||!/^\d+$/.test(c.native.iosBuildNumber)||Number(c.native.iosBuildNumber)<=12)throw Error('Verified published build metadata required');
  if(c.stores?.android!=='https://play.google.com/store/apps/details?id=com.yht.dominoparty'||c.stores?.ios!=='https://apps.apple.com/app/id6793746031')throw Error('Published store destination mismatch');
 }
 const url=new URL(c.origin);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.port||!url.hostname.includes('.')||/^(?:\d+\.){3}\d+$/.test(url.hostname)||url.hostname.endsWith('.local'))throw Error('Verified HTTPS domain required');
 if(!/^[a-z][a-z0-9+.-]*$/.test(c.scheme)||['http','https','javascript','data','file','intent'].includes(c.scheme))throw Error('Invalid native scheme');
 for(const id of [c.android?.package,c.ios?.bundleIdentifier])if(!/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){2,}$/.test(id)||(id==='com.yht.dominoparty'&&!updatingPublished))throw Error('Independent Online identity required');
 if((!androidOnly||c.purpose==='release')&&!/^[A-Z0-9]{10}$/.test(c.ios.teamId))throw Error('Verified Apple signing team required');
 if(!Array.isArray(c.android.sha256)||!c.android.sha256.length||c.android.sha256.some(s=>!/^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(s)))throw Error('Verified Android signing fingerprints required');
 if(c.purpose==='release'&&c.android.sha256.some(s=>s.replaceAll(':','').toLowerCase()==='fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c'))throw Error('Pilot debug certificate cannot be used as a Play release identity');
 const stores=c.stores||{};
 if(stores.android){const p=new URL(stores.android);if(p.origin!=='https://play.google.com'||p.pathname!=='/store/apps/details'||p.searchParams.get('id')!==c.android.package||p.username||p.password||p.hash||[...p.searchParams.keys()].some(k=>k!=='id'))throw Error('Android store identity mismatch');}
 if(stores.ios){const p=new URL(stores.ios);if(p.origin!=='https://apps.apple.com'||!/^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+$/.test(p.pathname)||p.username||p.password||p.search||p.hash||(p.pathname.endsWith('id6793746031')&&!updatingPublished))throw Error('Independent verified App Store URL required');}
 if(c.purpose==='release'&&(!stores.android||!stores.ios))throw Error('Both verified store URLs required for release');
 return {...c,origin:url.origin,stores:{android:stores.android||null,ios:stores.ios||null}};
}
function associations(c){return{
 android:[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:c.android.package,sha256_cert_fingerprints:c.android.sha256.map(s=>s.toUpperCase())}}],
 apple:/^[A-Z0-9]{10}$/.test(c.ios.teamId)?{applinks:{apps:[],details:[{appID:`${c.ios.teamId}.${c.ios.bundleIdentifier}`,paths:['/online/invite']}]}}:null
};}
module.exports={readConfig,validateConfig,associations};
