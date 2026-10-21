const friends=require('../config/friends.json');
module.exports=function withPlayInvitationLinks(config){
 if(process.env.DOMINO_ONLINE_LINKS_CONFIG!=='config/social-club-update.json')return config;
 const url=new URL(friends.origin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||config.android?.package!=='com.yht.dominoparty'||config.ios?.bundleIdentifier!=='com.yht.dominoparty')throw Error('Invalid published play invitation identity');
 const domain='applinks:'+url.hostname;config.ios={...config.ios,associatedDomains:[...new Set([...(config.ios.associatedDomains||[]),domain])]};
 config.android={...config.android,intentFilters:[...(config.android.intentFilters||[]),{action:'VIEW',autoVerify:true,category:['BROWSABLE','DEFAULT'],data:[{scheme:'https',host:url.hostname,path:'/play'}]}]};return config;
};
