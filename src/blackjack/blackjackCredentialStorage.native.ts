import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createSessionVault} from '../online/sessionVault';
const key='blackjack-online.session.v1';
const options={keychainService:'blackjack-online',keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
const photoPrefix='blackjack-online.session-photo.v1.';
export const vault=createSessionVault({
  read:()=>SecureStore.getItemAsync(key,options),
  write:value=>SecureStore.setItemAsync(key,value,options),
  clear:()=>SecureStore.deleteItemAsync(key,options),
},{
  read:ref=>AsyncStorage.getItem(photoPrefix+ref),
  write:(ref,value)=>AsyncStorage.setItem(photoPrefix+ref,value),
  remove:ref=>AsyncStorage.removeItem(photoPrefix+ref),
  async clear(){const keys=(await AsyncStorage.getAllKeys()).filter(value=>value.startsWith(photoPrefix));if(keys.length)await AsyncStorage.multiRemove(keys);},
},credential);
export async function credential():Promise<string>{const bytes=await Crypto.getRandomBytesAsync(32);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
