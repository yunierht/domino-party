import type {Vault,Session} from '../online/contract';
const key='poker-online.session.v1';
// Explicit web fallback: per-tab session storage, not native encrypted storage.
export const vault:Vault={
  async read(){const raw=sessionStorage.getItem(key);return raw?JSON.parse(raw) as Session:null;},
  async write(value){sessionStorage.setItem(key,JSON.stringify(value));},
  async clear(){sessionStorage.removeItem(key);}
};
export async function credential():Promise<string>{return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
