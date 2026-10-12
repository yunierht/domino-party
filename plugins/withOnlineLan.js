const {endpointForMode}=require('../src/online/networkPolicy.cjs');
const {withAndroidManifest,withDangerousMod,AndroidConfig}=require('expo/config-plugins');
const {mkdir,writeFile}=require('node:fs/promises');
const path=require('node:path');

function networkConfig(endpoint,mode='lan',origin){
 if(mode==='internet'){endpointForMode(endpoint,mode,origin);return '<?xml version="1.0" encoding="utf-8"?><network-security-config><base-config cleartextTrafficPermitted="false" /></network-security-config>'; }
 if(mode!=='lan')throw Error('Unknown network mode');
 const url=new URL(endpoint);
 const parts=url.hostname.split('.').map(Number);
 const privateIp=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&
  (parts[0]===10||(parts[0]===192&&parts[1]===168)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31));
 if(!privateIp||url.protocol!=='http:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('A private IPv4 HTTP endpoint is required for this LAN test build');
 return `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <base-config cleartextTrafficPermitted="false" />\n  <domain-config cleartextTrafficPermitted="true">\n    <domain includeSubdomains="false">${url.hostname}</domain>\n  </domain-config>\n</network-security-config>\n`;
}
module.exports=function withOnlineLan(config){
 const mode=process.env.EXPO_PUBLIC_ONLINE_MODE??'lan';
 const xml=networkConfig(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL,mode,process.env.EXPO_PUBLIC_ONLINE_ORIGIN);
 if(mode==='internet')config.ios={...config.ios,infoPlist:{...config.ios?.infoPlist,NSAppTransportSecurity:{NSAllowsArbitraryLoads:false,NSAllowsLocalNetworking:false}}};
 config=withAndroidManifest(config,mod=>{
  const app=AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
  app.$['android:networkSecurityConfig']='@xml/online_network_security';
  return mod;
 });
 return withDangerousMod(config,['android',async mod=>{
  const dir=path.join(mod.modRequest.platformProjectRoot,'app/src/main/res/xml');
  await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'online_network_security.xml'),xml);
  return mod;
 }]);
};
module.exports.networkConfig=networkConfig;
