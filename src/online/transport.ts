import type {Transport} from './contract.ts';
import {roomSocket} from './socketTransport.ts';
export function httpTransport(endpoint:string,fetcher:typeof fetch=fetch):Transport{
  return{watch:(path,token,onView,onClose)=>roomSocket(endpoint,path,token,onView,onClose),async request(path,token,body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try{const response=await fetcher(endpoint+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
      const data:unknown=await response.json();
      if(!response.ok){const code=data&&typeof data==='object'&&'error'in data&&typeof data.error==='string'?data.error:'connection_error';throw Error(code);}
      return data;
    }catch(error){if(error instanceof Error&&error.name==='AbortError')throw Error('connection_error');throw error;}
    finally{clearTimeout(timer);}
  }};
}
