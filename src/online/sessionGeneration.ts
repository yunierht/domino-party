/** Fences asynchronous results and serializes session storage across leave/new-session boundaries. */
const storageQueues=new WeakMap<object,Promise<void>>();
export class SessionGeneration {
 private generation=0;
 private storageOwner:object;
 constructor(storageOwner:object){this.storageOwner=storageOwner;}
 capture(){return this.generation;}
 advance(){return ++this.generation;}
 current(generation:number){return generation===this.generation;}
 assert(generation:number){if(!this.current(generation))throw Error('session_changed');}
 async storage<T>(task:()=>Promise<T>,generation?:number):Promise<T>{
  const execute=()=>{if(generation!==undefined)this.assert(generation);return task();};
  const result=(storageQueues.get(this.storageOwner)??Promise.resolve()).then(execute,execute);
  storageQueues.set(this.storageOwner,result.then(()=>{},()=>{}));
  const value=await result;if(generation!==undefined)this.assert(generation);return value;
 }
}
