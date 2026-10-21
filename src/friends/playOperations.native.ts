import * as SecureStore from 'expo-secure-store';
export const playOperations={read:(key:string)=>SecureStore.getItemAsync('play-operation.'+key),write:(key:string,value:string)=>SecureStore.setItemAsync('play-operation.'+key,value),clear:(key:string)=>SecureStore.deleteItemAsync('play-operation.'+key)};
