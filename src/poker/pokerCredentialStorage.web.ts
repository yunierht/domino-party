import {sessionStorageKeys} from '../online/sessionStorageKeys';
import type {Vault,Session} from '../online/contract';
const storageKeys=sessionStorageKeys('poker',process.env.EXPO_PUBLIC_POKER_ONLINE_URL||process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL||'');
const key=storageKeys.session;
// Explicit web fallback: per-tab session storage, not native encrypted storage.
export const vault:Vault={
  async read(){const raw=sessionStorage.getItem(key);return raw?JSON.parse(raw) as Session:null;},
  async write(value){sessionStorage.setItem(key,JSON.stringify(value));},
  async clear(){sessionStorage.removeItem(key);}
};
export async function credential():Promise<string>{return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
