import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR,snapshot,backup,safeImport} from '../src/model.js';
const sizes=[500,2000,5000];
for(const count of sizes){
 test('Portfolio scale '+count+' positions and up to 5000 historic records roundtrips',()=>{
  const start=performance.now(),m=blankModel(),provider=createProvider({name:'Stress Broker'});m.providers.push(provider);
  const account=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);m.accounts.push(account);
  for(let i=0;i<count;i++)m.positions.push(createPosition({
    providerId:provider.id,accountId:account.id,id:'p'+i,name:'Asset '+i,
    kind:'etf',symbol:'A'+i,quantity:'1.25',price:'10'
  },m));
  for(let i=0;i<5000;i++)m.bookings.push({id:'history-'+i,date:'2026-01-01',type:'buy',positionId:'p'+i%count,quantity:1,notes:'Legacy transaction test'});
  assert.equal(totalExactEUR(m),String(count*12.5));
  snapshot(m,new Date().toISOString().slice(0,10));
  const exported=backup(m);assert.ok(Buffer.byteLength(exported)<20_000_000);
  const restored=safeImport(JSON.parse(exported));
  assert.equal(restored.positions.length,count);
  assert.equal(restored.bookings.length,5000);
  assert.equal(totalExactEUR(restored),String(count*12.5));
  console.log('SCALE-PROBE '+JSON.stringify({positions:count,bookings:5000,ms:Math.round(performance.now()-start),bytes:Buffer.byteLength(exported)}));
 });
}
