/** Emit fixed platform categories only. Unknown error text can contain private player data. */
export function serviceFailure(error:unknown){
 if(!(error instanceof Error))return {name:'UnknownError',detail:'unknown_failure',hints:[]};
 const name=['Error','TypeError','RangeError','SyntaxError','ReferenceError','URIError','EvalError'].includes(error.name)?error.name:'Error';
 const message=error.message;
 const detail=message==='code_capacity'?'profile_code_capacity'
  :/subrequests/i.test(message)&&/limit|too many|exceed/i.test(message)?'subrequest_limit'
  :/requests/i.test(message)&&/limit|too many|exceed/i.test(message)?'request_limit'
  :/SQLITE_FULL|database or disk is full/i.test(message)?'storage_full'
  :/(?:rows|storage).*(?:limit|quota)|(?:daily|monthly).*(?:exceed|limit)/i.test(message)?'storage_quota'
  :/no such (?:table|column)|SQLITE_SCHEMA/i.test(message)?'storage_schema'
  :/SQLITE_BUSY|SQLITE_LOCKED/i.test(message)?'storage_busy'
  :/getByName.*(?:not a function|not implemented|not available)/i.test(message)?'rpc_namespace_method_missing'
  :/claim.*(?:not a function|not implemented|not available)/i.test(message)?'rpc_profile_claim_missing'
  :/(?:method|property).*(?:does not exist|not found|not implemented)|not a function/i.test(message)?'rpc_method_missing'
  :/SQLITE_[A-Z_]+/i.test(message)?'storage_error'
  :/overloaded|too many requests/i.test(message)?'service_overloaded'
  :/network|fetch failed|connection/i.test(message)?'network_failure'
  :'unknown_failure';
 // These fixed tags are useful even when an RPC wrapper changes the exception wording.
 const patterns:[string,RegExp][]=[
  ['constructor',/constructor/i],['database',/database|sqlite/i],['quota',/quota|exceed|limit/i],
  ['namespace',/namespace|binding|getByName/i],['rpc',/RPC|remote|method|claim|profile|capabilit/i],
  ['collision',/collision|capacity/i],['platform',/Durable Object|cloudflare|workerd/i],
  ['internal',/internal error|service_error/i],['parameter',/argument|parameter|bind|value/i],
  ['serialization',/serializ|clone|JSON/i],['authorization',/authoriz|permission|forbidden/i],
  ['closed',/closed|reset|cancell/i],['initialization',/initializ|migration|schema/i],
  ['http',/request|fetch|response/i],['missing',/no such|does not exist|not found/i],
  ['time',/timeout|time limit|CPU/i],['usage_plan',/free|paid|plan|billing/i],
  ['remote_reference',/reference|stub/i],['property_access',/access|property|undefined/i],
  ['subrequests',/subrequests/i],['daily',/daily|per day|\/day|24.?hour/i],
  ['duration',/duration|GB.s|GB-seconds/i],['memory',/memory/i],
  ['limit_50',/\b50\b/],['limit_100000',/\b100[,.]?000\b/],
 ];
 return {name,detail,hints:patterns.filter(([,pattern])=>pattern.test(message)).map(([hint])=>hint)};
}
