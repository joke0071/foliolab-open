import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,snapshot,backup,safeImport} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {portfolioTwr} from '../src/performance.js';
function fixture(){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic broker'}));
 for(const [id,type]of [['d','securities'],['c','checking']])m.accounts.push(createAccount({id,providerId:'p',name:id,type},m));
 m.positions.push(createPosition({id:'etf',providerId:'p',accountId:'d',kind:'etf',name:'ETF',quantity:0,price:100},m),createPosition({id:'cash',providerId:'p',accountId:'c',kind:'cash',name:'Cash',quantity:2000,price:1},m));
 executeTransaction(m,{id:'purchase',date:'1999-01-02',positionId:'etf',cashPositionId:'cash',type:'buy',quantity:2,unitPrice:100,feeEUR:1});return m;
}
test('M2: an undated automatic provider quote cannot supply an observed return endpoint',()=>{
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic wallet'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'a',type:'wallet'},m));
 m.positions.push(createPosition({id:'x',providerId:'p',accountId:'a',kind:'crypto',name:'Token',quantity:1,price:110,quoteSource:'CoinGecko Token',quoteQuality:'provider-undated',quoteAsOf:null},m));
 snapshot(m,'1999-01-01','',{manualTotalEUR:'100'});snapshot(m);
 assert.equal(m.snapshots.at(-1).valuationStatus,'partial');
 assert.equal(portfolioTwr(m,'1999-01-01',m.snapshots.at(-1).date),null);
});
test('M3: a modern linked booking cannot disagree with its journal date',()=>{
 const raw=JSON.parse(backup(fixture()));raw.bookings[0].date='1999-01-03';
 assert.throws(()=>safeImport(raw),/Buchung|Journal|Datum/);
});
test('M3: modern linked journals cannot share a sequence',()=>{
 const m=fixture();executeTransaction(m,{id:'deposit',date:'1999-01-03',positionId:'cash',type:'deposit',quantity:1});
 const raw=JSON.parse(backup(m));raw.journalEntries[1].sequence=raw.journalEntries[0].sequence;
 assert.throws(()=>safeImport(raw),/Journal|Reihenfolge/);
});
test('M2: confirmed current price and FX evidence permit automatic valuation; manual totals remain explicit',()=>{
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'a',type:'securities'},m));
 const today=new Date().toISOString().slice(0,10),p=createPosition({id:'x',providerId:'p',accountId:'a',kind:'etf',name:'ETF',quantity:1,price:110,quoteSource:'Synthetic provider',quoteQuality:'provider-timestamp',quoteAsOf:today},m);m.positions.push(p);
 snapshot(m,'1999-01-01','',{manualTotalEUR:'100'});snapshot(m);assert.equal(m.snapshots.at(-1).valuationStatus,'observed');assert.ok(Math.abs(portfolioTwr(m,'1999-01-01',today)-0.1)<1e-12);
 p.currency='USD';p.fxRate=0.9;p.fxRateExact='0.9';snapshot(m);assert.equal(m.snapshots.at(-1).valuationStatus,'partial');
 p.fxSource='Synthetic dated FX';p.fxRateDate=today;snapshot(m);assert.equal(m.snapshots.at(-1).valuationStatus,'observed');
 p.quoteAsOf=null;snapshot(m,today,'',{manualTotalEUR:'99'});assert.equal(m.snapshots.at(-1).valuationStatus,'manual');assert.equal(m.snapshots.at(-1).totalEURExact,'99');
});
test('M2: unverified, stale and invalid quote dates remain partial and block returns',()=>{
 for(const change of [{quoteQuality:'provider-undated',quoteAsOf:null},{quoteQuality:'unverified',quoteAsOf:new Date().toISOString().slice(0,10)},{quoteQuality:'provider-timestamp',quoteAsOf:'1999-01-01'},{quoteQuality:'provider-timestamp',quoteAsOf:'2026-02-30'}]){
  const m=fixture(),p=m.positions.find(p=>p.id==='etf');Object.assign(p,{quoteSource:'Synthetic provider',...change});
  snapshot(m,'1999-01-01','',{manualTotalEUR:'2000'});snapshot(m);assert.equal(m.snapshots.at(-1).valuationStatus,'partial');assert.equal(portfolioTwr(m,'1999-01-01',m.snapshots.at(-1).date),null);
 }
});
test('M3: invalid or missing modern sequence fails without changing raw input; legacy unlinked V2 remains readable',()=>{
 for(const value of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1,null,undefined]){
  const raw=JSON.parse(backup(fixture()));if(value===undefined)delete raw.journalEntries[0].sequence;else raw.journalEntries[0].sequence=value;
  const before=JSON.stringify(raw);assert.throws(()=>safeImport(raw),/Journal|Reihenfolge/);assert.equal(JSON.stringify(raw),before);
 }
 const raw=JSON.parse(backup(fixture()));raw.version=2;delete raw.journalEntries;delete raw.openingPositions;delete raw.bookings[0].journalEntryId;
 const restored=safeImport(raw);assert.equal(restored.bookings.length,1);assert.equal(restored.positions.length,2);
});
