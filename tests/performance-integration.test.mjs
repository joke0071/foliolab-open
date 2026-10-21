import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,snapshot,safeImport,backup} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {portfolioXirr} from '../src/performance.js';
function fixture(){
 const m=blankModel(),provider=createProvider({name:'Bank'});m.providers.push(provider);
 const a=createAccount({providerId:provider.id,name:'Giro',type:'checking'},m);m.accounts.push(a);
 const p=createPosition({providerId:provider.id,accountId:a.id,name:'EUR',kind:'cash',quantity:1000,price:1},m);m.positions.push(p);return {m,p};
}
test('XIRR requires explicit cashflow completeness marker in caller and two valuations',()=>{
 const {m,p}=fixture();m.performanceFlowTrackingSince='2025-01-01';snapshot(m,'2025-01-01','',{manualTotalEUR:'1000'});
 executeTransaction(m,{positionId:p.id,type:'deposit',date:'2025-07-01',quantity:500,unitPrice:1});
 executeTransaction(m,{positionId:p.id,type:'interest',date:'2025-08-01',quantity:150,unitPrice:1});snapshot(m,'2026-01-01','',{manualTotalEUR:'1650'});
 const rate=portfolioXirr(m,'2025-01-01','2026-01-01');
 assert.ok(rate!=null&&Number.isFinite(rate));
 assert.equal(portfolioXirr(m,'2025-02-01','2026-01-01'),null);
 const imported=safeImport(JSON.parse(backup(m)));assert.equal(imported.externalCashFlows.length,1);
});
test('Historical transactions do not rewrite previous dated valuations',()=>{
 const {m,p}=fixture();snapshot(m,'2025-01-01','',{manualTotalEUR:'1000'});const first=m.snapshots[0].total;
 executeTransaction(m,{positionId:p.id,type:'deposit',date:'2025-02-01',quantity:100,unitPrice:1});
 assert.equal(m.snapshots[0].total,first);assert.equal(m.snapshots.length,1);
});
