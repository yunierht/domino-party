const {readConfig}=require('../scripts/lib/onlineLinksConfig.cjs');
module.exports=function withOnlineInvitationLinks(config){
 const file=process.env.DOMINO_ONLINE_LINKS_CONFIG;
 if(!file)return config; // No unverified staging/release domain enters a build.
 const c=readConfig(file,{androidOnly:process.env.ONLINE_BUILD_PLATFORM==='android'});
 if(c.android.package!==config.android?.package||c.ios.bundleIdentifier!==config.ios?.bundleIdentifier||c.scheme!==config.scheme)throw Error('Links configuration does not match this native build');
 const base=c.origin+'/online/invite';
 if(process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE!==base)throw Error('Invite base must match the associated domain and exact path');
 const domain='applinks:'+new URL(c.origin).hostname;
 config.ios={...config.ios,associatedDomains:[...new Set([...(config.ios.associatedDomains||[]),domain])]};
 config.android={...config.android,intentFilters:[...(config.android.intentFilters||[]),{
  action:'VIEW',autoVerify:true,category:['BROWSABLE','DEFAULT'],data:[{scheme:'https',host:new URL(c.origin).hostname,path:'/online/invite'}]
 }]};
 return config;
};
