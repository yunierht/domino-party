const fs=require('node:fs');
const {readConfig}=require('./scripts/lib/onlineLinksConfig.cjs');
const {endpointForMode}=require('./src/online/networkPolicy.cjs');
module.exports=({config})=>{
 const mode=process.env.EXPO_PUBLIC_ONLINE_MODE??'lan';
 if(mode==='lan')return config;
 if(mode!=='internet')throw Error('Unknown Online network mode');
 const file=process.env.DOMINO_ONLINE_LINKS_CONFIG;
 if(!file||!fs.existsSync(file))throw Error('Internet build requires verified invitation/domain/signing configuration');
 const c=readConfig(file,{androidOnly:process.env.ONLINE_BUILD_PLATFORM==='android'});
 const origin=process.env.EXPO_PUBLIC_ONLINE_ORIGIN;
 if(c.origin!==origin)throw Error('Internet origin mismatch');
 for(const key of ['EXPO_PUBLIC_DOMINO_ONLINE_URL','EXPO_PUBLIC_POKER_ONLINE_URL'])endpointForMode(process.env[key],'internet',origin);
 for(const key of ['EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE','EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE'])if(process.env[key]!==origin+'/online/invite')throw Error('Internet invitation origin/path mismatch');
 const published=c.application==='domino-social-club-update';
 const identity=published?{name:'Domino Social Club',slug:'domino-party',owner:'yunierht',scheme:c.scheme,extra:{...config.extra,eas:{...config.extra?.eas,projectId:c.native.easProjectId}}}:{};
 const googleServicesFile=published?process.env.DOMINO_ANDROID_GOOGLE_SERVICES_FILE:undefined;
 if(googleServicesFile){if(!fs.existsSync(googleServicesFile))throw Error('Android push registration file is missing');const services=JSON.parse(fs.readFileSync(googleServicesFile,'utf8'));if(services.private_key||!Array.isArray(services.client)||!services.client.some(client=>client.client_info?.android_client_info?.package_name===c.android.package))throw Error('Android push registration does not match the published app');}
 const infoPlist={...config.ios.infoPlist,NSAppTransportSecurity:{NSAllowsArbitraryLoads:false,NSAllowsLocalNetworking:false}};
 if(published){
  delete infoPlist.NSLocalNetworkUsageDescription;
  infoPlist.NSMicrophoneUsageDescription='Domino Social Club uses your microphone for a voice call you start or accept.';
  infoPlist.NSCameraUsageDescription='Domino Social Club uses your camera for your avatar photo or to scan an invitation.';
 }
 return {...config,...identity,version:published?c.native.version:'0.1.4',
  android:{...config.android,...(googleServicesFile?{googleServicesFile}:{}),...(published?{package:c.android.package}:{}),versionCode:published?c.native.androidVersionCode:5},
  ios:{...config.ios,...(published?{bundleIdentifier:c.ios.bundleIdentifier,appleTeamId:c.ios.teamId}:{}),buildNumber:published?c.native.iosBuildNumber:'2',infoPlist}};
};