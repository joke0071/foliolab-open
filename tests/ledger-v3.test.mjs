import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalEUR,safeImport,backup,load,persist,STORE_KEY,snapshot} from '../src/model.js';
import {executeTransaction,validateJournalEntry,ledgerQuantityAudit} from '../src/transactions.js';
import {portfolioXirr} from '../src/performance.js';
function fixture({cash=3000,security=0,currency='EUR',fx=1}={}){
 const m=blankModel(),provider=createProvider({name:'Open Broker',type:'broker'});m.providers.push(provider);
 const custody=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);
 const bank=createAccount({providerId:provider.id,name:'Cash',type:'checking',currency},m);m.accounts.push(custody,bank);
 const etf=createPosition({providerId:provider.id,accountId:custody.id,kind:'etf',name:'World ETF',isin:'IE00BK5BQT80',symbol:'VWCE',quantity:security,price:100,currency,fxRate:fx,costBasisEUR:security?security*100*fx:null},m);
 const cashPosition=createPosition({providerId:provider.id,accountId:bank.id,kind:'cash',name:'Cash',quantity:cash,price:1,currency,fxRate:fx},m);
 m.positions.push(etf,cashPosition);return {m,etf,cashPosition};
}
const trade=(m,p,type,extra={})=>executeTransaction(m,{type,positionId:p.id,date:'2026-10-21',quantity:'10',unitPrice:'100',...extra});
test('Buy journals asset, cash and fee in one balanced unit',()=>{
 const {m,etf,cashPosition}=fixture();const before=totalEUR(m);
 const e=trade(m,etf,'buy',{cashPositionId:cashPosition.id,feeEUR:'5'});
 assert.equal(etf.quantityExact,'10');assert.equal(cashPosition.quantityExact,'1995');
 assert.equal(totalEUR(m),before-5);
 assert.equal(etf.costBasisExact,'1005');
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(m.bookings[0].journalEntryId,m.journalEntries[0].id);
 assert.equal(m.journalEntries[0].status,'recorded');
 assert.equal(m.journalEntries[0].postings.length,3);
 assert.deepEqual(m.journalEntries[0].postings.map(x=>x.amountBookEURExact),['1000','-1005','5']);
 assert.equal(e.cashPositionId,cashPosition.id);
});
test('Sell journals security exit, cash proceeds, fee and tax with realized P&L',()=>{
 const {m,etf,cashPosition}=fixture({cash:3000,security:10});
 const before=totalEUR(m);
 trade(m,etf,'sell',{cashPositionId:cashPosition.id,quantity:4,unitPrice:125,feeEUR:'3',taxEUR:'2'});
 assert.equal(etf.quantityExact,'6');assert.equal(cashPosition.quantityExact,'3495');
 assert.equal(etf.costBasisExact,'600');assert.equal(etf.realizedPnLExact,'95');
 assert.equal(totalEUR(m),before+95);assert.equal(m.externalCashFlows.length,0);
 assert.deepEqual(m.journalEntries[0].postings.map(x=>x.amountBookEURExact),['-500','495','3','2']);
});
test('Unlinked trades use unresolved clearing and do not fabricate deposits',()=>{
 const {m,etf,cashPosition}=fixture();
 trade(m,etf,'buy',{quantity:1});
 assert.equal(m.journalEntries[0].status,'unresolved-clearing');
 assert.equal(m.journalEntries[0].postings[1].role,'clearing');
 assert.equal(cashPosition.quantityExact,'3000');
 assert.equal(m.externalCashFlows.length,0);
});
test('Insufficient cash, wallet cash, unrelated currency and impossible timestamps are atomic errors',()=>{
 const {m,etf,cashPosition}=fixture({cash:5});const old=JSON.stringify(m);
 assert.throws(()=>trade(m,etf,'buy',{cashPositionId:cashPosition.id}),/genügend/);
 assert.equal(JSON.stringify(m),old);
 cashPosition.currency='JPY';
 assert.throws(()=>trade(m,etf,'buy',{cashPositionId:cashPosition.id}),/Verrechnungskonto/);
});
test('USD trade settles against USD cash with exact EUR fees and FX conversion',()=>{
 const {m,etf,cashPosition}=fixture({cash:2000,currency:'USD',fx:0.9});
 const before=totalEUR(m);
 trade(m,etf,'buy',{cashPositionId:cashPosition.id,feeEUR:9,fxRate:'0.9'});
 assert.equal(cashPosition.quantityExact,'990');
 assert.equal(etf.costBasisExact,'909');
 assert.ok(Math.abs(totalEUR(m)-(before-9))<1e-9);
 assert.deepEqual(m.journalEntries[0].postings.map(x=>x.amountBookEURExact),['900','-909','9']);
});
test('Cash deposits are external, internal asset transfers are not',()=>{
 const {m,etf,cashPosition}=fixture({security:10});
 trade(m,cashPosition,'deposit',{quantity:50,unitPrice:1});
 assert.equal(m.externalCashFlows.length,1);
 assert.equal(m.externalCashFlows[0].amountExactEUR,'50');
 assert.equal(m.journalEntries[0].postings.reduce((sum,p)=>sum+Number(p.amountBookEURExact),0),0);
 assert.equal(m.journalEntries[0].postings[1].role,'external-clearing');
});
test('Backdated inserts before existing ledger events reject without modification',()=>{
 const {m,etf}=fixture();
 trade(m,etf,'buy',{quantity:1});
 const raw=JSON.stringify(m);
 assert.throws(()=>trade(m,etf,'buy',{date:'2026-10-20',quantity:1}),/Rückdatierte/);
 assert.equal(JSON.stringify(m),raw);
});
test('Exact fractional quantity survives execution, import and export',()=>{
 const {m,etf}=fixture();
 trade(m,etf,'buy',{quantity:'0.000000000000000001'});
 assert.equal(etf.quantityExact,'0.000000000000000001');
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.positions.find(p=>p.id===etf.id).quantityExact,'0.000000000000000001');
 assert.equal(restored.bookings[0].quantityExact,'0.000000000000000001');
 assert.equal(restored.journalEntries[0].postings[0].quantityDeltaExact,'0.000000000000000001');
});
test('Import preserves full financial metadata and repeated backups',()=>{
 const {m,etf}=fixture();etf.priceStatus='Split geprüft';etf.fxUpdatedAt='2026-10-21T08:00:00Z';etf.priceExact='100';etf.costBasisExact='123.45';etf.costBasisEUR=123.45;
 snapshot(m,'2026-10-20','Kontoauszug',{manualTotalEUR:'3210.55'});
 const first=JSON.parse(backup(m)),second=JSON.parse(backup(safeImport(first)));
 assert.deepEqual(second,first);
 assert.equal(second.positions[0].priceStatus,'Split geprüft');
 assert.equal(second.positions[0].fxUpdatedAt,'2026-10-21T08:00:00Z');
 assert.equal(second.snapshots[0].source,'manual');
});
test('V2 migration retains original booked events, creates undated opening state, never replays them',()=>{
 const {m,etf,cashPosition}=fixture({security:3});
 const v2=structuredClone(m);v2.version=2;delete v2.journalEntries;delete v2.openingPositions;
 v2.bookings=[{id:'historic',type:'buy',date:'2025-01-02',positionId:etf.id,quantity:3,quantityExact:'3',notes:'Old booking'}];
 const storageMap=new Map([[STORE_KEY,JSON.stringify(v2)]]),storage={getItem:k=>storageMap.get(k)||null,setItem:(k,v)=>storageMap.set(k,v)};
 const migrated=load(storage);
 assert.equal(migrated.version,3);assert.equal(migrated.bookings[0].id,'historic');assert.equal(migrated.journalEntries.length,0);
 assert.equal(migrated.openingPositions.length,2);assert.equal(migrated.openingPositions[0].asOf,null);
 assert.equal(migrated.positions.find(p=>p.id===etf.id).quantityExact,'3');
 assert.equal(storageMap.get(STORE_KEY+'-premigration-v2'),JSON.stringify(v2));
 persist(migrated,storage);assert.equal(JSON.parse(storageMap.get(STORE_KEY)).version,3);
});
test('Historic dates cannot silently reuse current portfolio market prices',()=>{
 const {m}=fixture();
 const today=new Date().toISOString().slice(0,10);
 const past='2020-01-01';assert.notEqual(today,past);
 assert.throws(()=>snapshot(m,past),/historische/);
 assert.equal(m.snapshots.length,0);
 snapshot(m,past,'historischer Kontoauszug',{manualTotalEUR:'1234.50'});
 assert.equal(m.snapshots[0].totalEURExact,'1234.5');
 assert.equal(m.snapshots[0].valuationStatus,'manual');
});
test('Snapshot same-date revisions are retained',()=>{
 const {m,etf}=fixture();
 const today=new Date().toISOString().slice(0,10);
 snapshot(m,today);
 const earlier=m.snapshots[0].total;
 etf.price=102;snapshot(m,today);
 assert.equal(m.snapshots.length,1);
 assert.equal(m.snapshots[0].revisions.length,1);
 assert.equal(m.snapshots[0].revisions[0].totalEURExact,String(earlier));
});
test('Unverified migrated performance history must not be represented as XIRR',()=>{
 const {m}=fixture();
 snapshot(m,'2025-01-01','historisch',{manualTotalEUR:'1000'});
 snapshot(m,'2026-01-01','historisch',{manualTotalEUR:'1050'});
 const v2=structuredClone(m);v2.version=2;delete v2.journalEntries;delete v2.openingPositions;
 const restored=safeImport(v2);
 assert.equal(restored.snapshots[0].valuationStatus,'legacy-unverified');
 assert.equal(portfolioXirr(restored,'2025-01-01','2026-01-01'),null);
});
test('Import rejects unbalanced financial journal and duplicate posting identities',()=>{
 const {m,etf}=fixture();
 trade(m,etf,'buy',{quantity:1});
 const damaged=JSON.parse(backup(m));damaged.journalEntries[0].postings[0].amountBookEURExact='999';
 assert.throws(()=>safeImport(damaged),/nicht ausgeglichen/);
 assert.throws(()=>validateJournalEntry({id:'x',date:'2026-10-21',postings:[]}),/Journal/);
});

test('An unresolved buy blocks portfolio XIRR rather than reporting fictitious gains',()=>{
 const {m,etf}=fixture();
 snapshot(m,'2025-01-01','start',{manualTotalEUR:'1000'});
 trade(m,etf,'buy',{date:'2025-07-01',quantity:1});
 snapshot(m,'2026-01-01','end',{manualTotalEUR:'1200'});
 assert.equal(portfolioXirr(m,'2025-01-01','2026-01-01'),null);
});
test('External in-kind deliveries without verified valuation block XIRR',()=>{
 const {m,etf}=fixture();
 snapshot(m,'2025-01-01','start',{manualTotalEUR:'1000'});
 trade(m,etf,'deliver_in',{date:'2025-06-01',quantity:1});
 snapshot(m,'2026-01-01','end',{manualTotalEUR:'1100'});
 assert.equal(portfolioXirr(m,'2025-01-01','2026-01-01'),null);
});

test('Opening quantities plus journal movements reconstruct every current position exactly',()=>{
 const {m,etf,cashPosition}=fixture({cash:3000,security:10});
 trade(m,etf,'sell',{cashPositionId:cashPosition.id,quantity:2,unitPrice:120,feeEUR:3});
 trade(m,etf,'buy',{cashPositionId:cashPosition.id,quantity:1,unitPrice:100});
 trade(m,etf,'split',{ratioNumerator:2,ratioDenominator:1,quantity:0});
 const audit=ledgerQuantityAudit(m);assert.deepEqual(audit,{ok:true,mismatches:[]});
 const original=JSON.stringify(m);etf.quantityExact='999';
 assert.equal(ledgerQuantityAudit(m).ok,false);etf.quantityExact='18';
 assert.equal(ledgerQuantityAudit(m).ok,true);
});
test('Rewards, in-kind deliveries and corrections retain exact quantity deltas',()=>{
 const {m,etf}=fixture();
 trade(m,etf,'deliver_in',{quantity:2});
 trade(m,etf,'reward',{quantity:'0.25'});
 trade(m,etf,'correction',{targetQuantity:'3',quantity:0});
 assert.equal(etf.quantityExact,'3');
 assert.equal(ledgerQuantityAudit(m).ok,true);
 assert.deepEqual(m.journalEntries.map(e=>e.postings[0].quantityDeltaExact),['2','0.25','0.75']);
});
