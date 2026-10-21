import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,load,persist,STORE_KEY,backup} from '../src/model.js';
const src=()=>{
  const m=blankModel(),p=createProvider({name:'Broker & Bank',type:'broker'});m.providers.push(p);
  const a=createAccount({providerId:p.id,name:'Depot',type:'securities'},m),b=createAccount({providerId:p.id,name:'Guthaben',type:'checking'},m);
  m.accounts.push(a,b);m.positions.push(createPosition({providerId:p.id,accountId:a.id,name:'ETF',kind:'etf',quantity:2,price:100},m));
  return m;
};
test('Ein Anbieter kann mehrere Konten besitzen',()=>{
 const m=src();assert.equal(m.accounts.length,2);assert.equal(m.positions[0].accountId,m.accounts[0].id);
 assert.throws(()=>createPosition({providerId:m.providers[0].id,accountId:'fremd',name:'X'},m),/Konto/);
});
test('v1 wird migriert, ursprüngliche lokale Bytes bleiben gesichert',()=>{
 const m=src(); const v1={...m,version:1,accounts:undefined,positions:m.positions.map(({accountId,...p})=>p)};
 const data=JSON.stringify(v1),items=new Map([[STORE_KEY,data]]),storage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)};
 const result=load(storage);assert.equal(result.version,2);assert.equal(result.accounts.length,1);
 assert.equal(result.positions[0].accountId,result.accounts[0].id);assert.equal(items.get(STORE_KEY+'-premigration-v1'),data);
 assert.equal(items.get(STORE_KEY),data);persist(result,storage);assert.equal(JSON.parse(items.get(STORE_KEY)).version,2);
});
test('Doppelte IDs und falsche Kontobeziehungen werden zurückgewiesen',()=>{
 const m=src(),dupe=structuredClone(m);dupe.accounts.push({...dupe.accounts[0]});assert.throws(()=>safeImport(dupe),/Doppelte/);
 const bad=structuredClone(m);bad.positions[0].accountId=bad.accounts[1].id;bad.positions[0].providerId='nicht-vorhanden';assert.throws(()=>safeImport(bad),/Anbieter/);
});
test('Fehlerhafte Speicherstände überschreiben keine Daten',()=>{
 let writes=0;const storage={getItem:()=>'{invalid-json',setItem:()=>{writes++;}};
 assert.throws(()=>load(storage));assert.equal(writes,0);
});
test('Backups enthalten beide Konten und keine API-Schlüssel',()=>{
 const m=src();m.settings.twelveKey='MY_PERSONAL_SECRET';
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.accounts.length,2);assert.equal(restored.settings.twelveKey,'');
});
