export function dbMock(){
 const map=new Map();
 const database={
  objectStoreNames:{contains:()=>true},createObjectStore(){},close(){},
  transaction(){
   const tx={oncomplete:null,onabort:null,onerror:null};
   tx.objectStore=()=>({
    get(key){const req={result:map.get(key)};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req},
    put(value,key){map.set(key,value);const req={result:key};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req}
   });
   return tx;
  }
 };
 const indexedDB={open(){
  const req={result:database};
  queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
  return req;
 }};
 return {indexedDB,map};
}
