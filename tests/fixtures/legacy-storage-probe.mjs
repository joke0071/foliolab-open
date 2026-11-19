// A v1 database exists alongside the legacy bytes. These tests must only inspect its schema.
import assert from 'node:assert/strict';

export function installLegacyStorageProbe(t) {
 const previous=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
 t.after(()=>{
  if(previous)Object.defineProperty(globalThis,'indexedDB',previous);
  else delete globalThis.indexedDB;
 });
 Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{
  open(name,version){
   assert.equal(name,'foliolab-open-portfolio');
   assert.equal(version,undefined,'legacy operation tried to create or upgrade the database');
   const request={result:{version:1,objectStoreNames:{contains:key=>key==='records'},close(){}}};
   queueMicrotask(()=>request.onsuccess());
   return request;
  }
 }});
}
