import type {Session, Vault} from './contract';

type SecureStorage = {read(): Promise<string|null>; write(value:string): Promise<void>; clear(): Promise<void>};
type PhotoStorage = {read(ref:string): Promise<string|null>; write(ref:string,value:string): Promise<void>; remove(ref:string): Promise<void>; clear(): Promise<void>};
type Envelope = {version:2; session:Session; photoRef?:string};
type Photos = {create?:string; acceptance?:string};
const photoRef = (value:unknown): value is string => typeof value==='string' && /^[a-f0-9]{64}$/.test(value);

// Keep credentials in SecureStore; large retry payloads live separately with an opaque reference.
export function createSessionVault(secure:SecureStorage,photos:PhotoStorage,reference:()=>Promise<string>):Vault {
  let queue:Promise<unknown>=Promise.resolve();
  function serial<T>(action:()=>Promise<T>):Promise<T>{const result=queue.then(action);queue=result.catch(()=>{});return result;}
  function envelope(raw:string):Envelope|null {
    const value=JSON.parse(raw);
    if(value?.version!==2)return null;
    if(!value.session || typeof value.session!=='object' || (value.photoRef!==undefined&&!photoRef(value.photoRef)))throw new Error('storage_error');
    return value as Envelope;
  }
  return {
    read:()=>serial(async()=>{
      const raw=await secure.read();if(!raw)return null;
      const saved=envelope(raw);if(!saved)return JSON.parse(raw) as Session;
      if(!saved.photoRef)return saved.session;
      const payload=await photos.read(saved.photoRef);if(!payload)throw new Error('storage_error');
      const values=JSON.parse(payload) as Photos;
      if(!values || typeof values!=='object' || !Object.keys(values).length || Object.keys(values).some(key=>key!=='create'&&key!=='acceptance'))throw new Error('storage_error');
      for(const value of Object.values(values))if(typeof value!=='string'||value.length>96*1024)throw new Error('storage_error');
      const session=saved.session;
      if(values.create!==undefined){if(!session.pendingCreate?.invitation)throw new Error('storage_error');session.pendingCreate.invitation.avatarPhoto=values.create;}
      if(values.acceptance!==undefined){if(!session.acceptance)throw new Error('storage_error');session.acceptance.avatarPhoto=values.acceptance;}
      return session;
    }),
    write:value=>serial(async()=>{
      const previous=await secure.read();const oldRef=previous?envelope(previous)?.photoRef:undefined;
      const session:Session={...value};const payload:Photos={};
      if(value.pendingCreate?.invitation){
        session.pendingCreate={...value.pendingCreate,invitation:{...value.pendingCreate.invitation}};
        if(session.pendingCreate.invitation!.avatarPhoto!==undefined){payload.create=session.pendingCreate.invitation!.avatarPhoto;delete session.pendingCreate.invitation!.avatarPhoto;}
      }
      if(value.acceptance){session.acceptance={...value.acceptance};if(session.acceptance.avatarPhoto!==undefined){payload.acceptance=session.acceptance.avatarPhoto;delete session.acceptance.avatarPhoto;}}
      let ref:string|undefined;
      try {
        if(Object.keys(payload).length){ref=await reference();if(!photoRef(ref))throw new Error('storage_error');await photos.write(ref,JSON.stringify(payload));}
        await secure.write(JSON.stringify({version:2,session,...(ref?{photoRef:ref}:{})} satisfies Envelope));
      } catch(error){if(ref)await photos.remove(ref).catch(()=>{});throw error;}
      // A cleanup failure must not turn a committed credential write into a failed write.
      if(oldRef&&oldRef!==ref)await photos.remove(oldRef).catch(()=>{});
    }),
    clear:()=>serial(async()=>{await secure.clear();await photos.clear();}),
  };
}
