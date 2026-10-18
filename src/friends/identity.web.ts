const key='domino-friends.identity.v1';
export const identityStorage={async read(){return localStorage.getItem(key);},async write(value:string){localStorage.setItem(key,value);}};
export async function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
