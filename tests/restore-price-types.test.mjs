import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createPosition,safeImport,defaultSettings,totalExactEUR} from '../src/model.js';
import {fixture} from './restore-position-fixture.mjs';
test('Backup readers reject non-price JSON types in v1/v2/v3/v4 without source changes',()=>{
 for(const version of [1,2,3,4])for(const price of [true,false,[123.45],[],{}]){
  const raw=fixture(version);raw.positions[0].price=price;delete raw.positions[0].priceExact;const before=JSON.stringify(raw);
  assert.throws(()=>safeImport(raw),/Kurs|Zahl/,version+'/'+JSON.stringify(price));assert.equal(JSON.stringify(raw),before);
 }
});
test('Actual position constructor preserves valid numeric/localized/manual and missing-price behavior',()=>{
 const m=fixture();
 for(const [price,expected] of [[123.45,'123.45'],['123,45','123.45'],['1 234,50','1234.5'],[0,'0'],['','0'],[null,'0']]){
  const p=createPosition({...m.positions[0],price,priceExact:undefined},m);assert.equal(p.priceExact,expected);
 }
 const legacy=fixture();legacy.positions[0].price=110;legacy.positions[0].priceExact='100';
 const restored=safeImport(legacy);assert.equal(restored.positions[0].price,110);assert.equal(restored.positions[0].priceExact,'100','Do not silently repair numeric legacy discrepancies');
});
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const begin=app.indexOf('      async restoreData(data,configuration=null){'),end=app.indexOf('      onBackedUp()',begin);
assert.ok(begin>0&&end>begin);
function harness(){
 const model=fixture(),before=JSON.stringify(model);let saves=0,rollbackOffers=0,stored=before;
 const context=vm.createContext({model,saving:false,otherTabChangedPortfolio:false,loadFailure:null,recoveryDownloaded:false,safeImport,defaultSettings,decideImportedConfiguration:()=>null,
  hasBackupPassword:async()=>false,confirm:()=>true,downloadBackup:()=>{rollbackOffers++;},save:async()=>{saves++;stored=JSON.stringify(context.model);},backupDone(){},notify(){}});
 const restore=vm.runInContext('({'+app.slice(begin,end)+'}).restoreData',context);
 return {context,restore,before,saves:()=>saves,rollbackOffers:()=>rollbackOffers,stored:()=>stored};
}
test('Actual Drive restore callback rejects invalid price before backup offer, model replacement or save',async()=>{
 for(const version of [1,2,3,4])for(const price of [true,[123.45]]){
  const h=harness(),raw=fixture(version);raw.positions[0].price=price;delete raw.positions[0].priceExact;const before=JSON.stringify(raw);
  await assert.rejects(()=>h.restore(raw),/Kurs|Zahl/);assert.equal(h.saves(),0);assert.equal(h.rollbackOffers(),0);
  assert.equal(JSON.stringify(h.context.model),h.before);assert.equal(h.stored(),h.before);assert.equal(JSON.stringify(raw),before);
 }
});
test('Actual Drive restore callback still saves a valid independent two-unit price once',async()=>{
 const h=harness(),raw=fixture();raw.positions[0].price=123.45;raw.positions[0].priceExact='123.45';
 assert.equal(await h.restore(raw),true);assert.equal(h.saves(),1);assert.equal(h.rollbackOffers(),1);
 assert.equal(totalExactEUR(JSON.parse(h.stored())),'246.9');assert.equal(h.context.model.positions[0].quantityExact,'2');
});
test('Structured exact prices reject before restore replaces or saves the portfolio',async()=>{
 for(const version of [1,2,3,4])for(const priceExact of [[123.45],[0],[[123.45]],true,false,{}]){
  const raw=fixture(version);raw.positions[0].priceExact=priceExact;const before=JSON.stringify(raw);
  assert.throws(()=>safeImport(raw),/Kurs|Dezimal|Zahl/,version+'/'+JSON.stringify(priceExact));
  const h=harness();await assert.rejects(()=>h.restore(raw),/Kurs|Dezimal|Zahl/);
  assert.equal(h.saves(),0);assert.equal(h.rollbackOffers(),0);assert.equal(h.stored(),h.before);
  assert.equal(JSON.stringify(h.context.model),h.before);assert.equal(JSON.stringify(raw),before);
 }
});
test('Scalar exact prices and existing numeric display discrepancies retain their contract',()=>{
 for(const priceExact of ['123.45',123.45]){
  const raw=fixture();raw.positions[0].priceExact=priceExact;
  const restored=safeImport(raw);assert.equal(restored.positions[0].price,100);
  assert.equal(restored.positions[0].priceExact,'123.45');assert.equal(totalExactEUR(restored),'246.9');
 }
});

