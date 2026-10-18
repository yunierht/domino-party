import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
const key='domino-friends.identity.v1';
const options={keychainService:'domino-friends',keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
export const identityStorage={read:()=>SecureStore.getItemAsync(key,options),write:(value:string)=>SecureStore.setItemAsync(key,value,options)};
export async function randomToken(){return Array.from(await Crypto.getRandomBytesAsync(32),b=>b.toString(16).padStart(2,'0')).join('');}
