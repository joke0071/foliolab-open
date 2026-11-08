import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,totalEUR,totalExactEUR,backup,safeImport,snapshot,gainSummary,money,persist,load,STORE_KEY} from '../src/model.js';
import {FX_UNKNOWN,positionFX} from '../src/fx-state.js';
import {aggregateValuePresentation,positionValueLabel} from '../src/quote-quality.js';
import {currentPositionValues} from '../src/position-history.js';
import {executeTransaction} from '../src/transactions.js';
import {projectHistoricalPosition} from '../src/historical-position-value.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
import {portfolioXirr,portfolioTwr} from '../src/performance.js';
export function unknownFXFixture(){
 const m=blankModel(),p=createProvider({id:'synthetic-fx-provider',name:'Synthetic FX'});m.providers.push(p);
 const a=createAccount({id:'usd-account',providerId:p.id,name:'USD Spot',currency:'USD',type:'exchange'},m);m.accounts.push(a);
 const v={id:'usd',name:'Synthetic USD',kind:'cash',providerId:p.id,accountId:a.id,currency:'USD',quantityExact:'17.000000000000000005',price:1};
 return {m,v};
}
test('missing/null/empty FX remains explicit UNKNOWN at the first constructor boundary',()=>{
 for(const fx of [{},{fxRate:null},{fxRate:''},{fxRate:'  '},{fxRate:null,fxRateExact:null},{fxRateExact:FX_UNKNOWN,fxRate:null}]){
  const {m,v}=unknownFXFixture(),p=createPosition({...v,...fx},m);m.positions.push(p);
  assert.equal(p.fxRate,null);assert.equal(p.fxRateExact,FX_UNKNOWN);assert.equal(p.quantityExact,v.quantityExact);
  assert.equal(valueEUR(p),null);assert.equal(totalEUR(m),null);assert.equal(totalExactEUR(m),null);
  assert.equal(positionValueLabel(p,valueEUR(p),money),'Nicht bewertet');assert.equal(currentPositionValues(m).usd,null);
  const before=JSON.stringify(m);assert.equal(snapshot(m),null);assert.equal(JSON.stringify(m),before);
 }
});
test('known identity FX and nonidentity rates retain independent exact Decimal100 outcomes',()=>{
 for(const [rate,expected] of [['1','17.000000000000000005'],['0.8','13.600000000000000004']]){
  const {m,v}=unknownFXFixture(),p=createPosition({...v,fxRate:rate},m);m.positions.push(p);
  assert.equal(positionFX(p).state,'known');assert.equal(p.fxRateExact,rate);assert.equal(totalExactEUR(m),expected);
  const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.positions[0].fxRateExact,rate);assert.equal(totalExactEUR(restored),expected);
 }
});
test('invalid rates and unknown/numeric contradictions reject without source mutation',()=>{
 const {m,v}=unknownFXFixture(),before=JSON.stringify(m);
 for(const extra of [{fxRate:0},{fxRate:-1},{fxRate:'invalid'},{fxRate:Infinity},{fxRate:1,fxRateExact:FX_UNKNOWN},{fxRate:'0.8',fxRateExact:'0.9'}])assert.throws(()=>createPosition({...v,...extra},m),/Wechselkurs/);
 assert.equal(JSON.stringify(m),before);
});
test('canonical backup and encrypted fresh object restore preserve UNKNOWN and exact native quantities',async()=>{
 const {m,v}=unknownFXFixture();m.positions.push(createPosition(v,m));
 const before=JSON.stringify(m),plain=backup(m),complete=createCompleteBackup(JSON.parse(plain));
 const encrypted=await encryptBackup(JSON.stringify(complete),'Synthetic FX secret 2026!');
 const fresh=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(encrypted),'Synthetic FX secret 2026!'))).data);
 assert.equal(fresh.positions[0].fxRateExact,FX_UNKNOWN);assert.equal(fresh.positions[0].fxRate,null);assert.equal(totalExactEUR(fresh),null);
 assert.equal(fresh.positions[0].quantityExact,v.quantityExact);assert.equal(JSON.stringify(m),before);
 assert.equal(backup(fresh),plain);
});
test('legacy stored numeric1 is not inferred to be UNKNOWN or repaired',()=>{
 const {m,v}=unknownFXFixture();m.positions.push(createPosition({...v,fxRate:1},m));
 const before=backup(m),raw=JSON.parse(before);assert.equal(raw.positions[0].fxRateExact,'1');
 const restored=safeImport(raw);assert.equal(backup(restored),before);assert.equal(totalExactEUR(restored),v.quantityExact);
 assert.deepEqual(restored.journalEntries,m.journalEntries);assert.deepEqual(restored.snapshots,m.snapshots);
});
test('raw nullable legacy FX is canonicalized fail-closed without mutating raw source',()=>{
 const {m,v}=unknownFXFixture();m.positions.push(createPosition({...v,fxRate:1},m));
 m.positions[0].fxRate=null;m.positions[0].fxRateExact=null;const raw=structuredClone(m),before=JSON.stringify(raw);
 const restored=safeImport(raw);assert.equal(restored.positions[0].fxRateExact,FX_UNKNOWN);assert.equal(JSON.stringify(raw),before);
 const saved=JSON.parse(backup(m));assert.equal(saved.positions[0].fxRateExact,FX_UNKNOWN);assert.equal(m.positions[0].fxRateExact,null);
});
test('known partial sum is explicit and no cost basis or performance is inferred from UNKNOWN',()=>{
 const {m,v}=unknownFXFixture();const p=createPosition({...v,costBasisEUR:10},m);m.positions.push(p);
 m.positions.push(createPosition({...v,id:'eur',currency:'EUR',quantity:7,quantityExact:'7'},m));
 const view=aggregateValuePresentation(m.positions,totalEUR(m),money);assert.equal(view.value,money(7));assert.equal(view.knownTotalEUR,7);assert.equal(view.missing,1);assert.match(view.note,/Teilsumme/);
 assert.equal(totalEUR(m),null);assert.equal(gainSummary(m).withBasis,0);assert.equal(gainSummary(m).unrealized,null);assert.equal(p.costBasisEUR,10);
 assert.equal(portfolioXirr(m,'1999-01-01','1999-01-02'),null);assert.equal(portfolioTwr(m,'1999-01-01','1999-01-02'),null);
});
test('current FX never grants historical valuation or historical transaction FX',()=>{
 const {m,v}=unknownFXFixture(),p=createPosition({...v,fxRate:'0.8'},m);m.positions.push(p);
 m.openingPositions.push({positionId:p.id,quantityExact:v.quantityExact,costBasisExact:null,realizedPnLExact:null,source:'observed-opening',asOf:'1999-01-01'});
 assert.equal(projectHistoricalPosition(m,p.id,{dates:['1999-01-02']}).rows[0].valueEURExact,null);
 const before=JSON.stringify(m);assert.throws(()=>executeTransaction(m,{type:'withdraw',date:'1999-01-02',positionId:p.id,quantity:'1'}),/historischen Wechselkurs/);assert.equal(JSON.stringify(m),before);
});
test('zero holdings and excluded contributions are mathematical zeros without proving FX',()=>{
 const {m,v}=unknownFXFixture(),p=createPosition({...v,quantityExact:'0'},m);m.positions.push(p);
 assert.equal(p.fxRateExact,FX_UNKNOWN);assert.equal(valueEUR(p),0);assert.equal(totalExactEUR(m),'0');
 p.quantityExact='2';p.quantity=2;p.valuationMode='excluded';assert.equal(valueEUR(p),0);assert.equal(totalExactEUR(m),'0');
});
test('legacy storage serialization and reload remain fail-closed for nullable FX',()=>{
 const {m,v}=unknownFXFixture();m.positions.push(createPosition(v,m));m.positions[0].fxRateExact=null;
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 persist(m,storage);const saved=JSON.parse(data.get(STORE_KEY));assert.equal(saved.positions[0].fxRateExact,FX_UNKNOWN);assert.equal(m.positions[0].fxRateExact,null);
 const restored=load(storage);assert.equal(restored.positions[0].fxRateExact,FX_UNKNOWN);assert.equal(totalExactEUR(restored),null);
});
test('UNKNOWN never rewrites existing independently recorded historical observations',()=>{
 const {m,v}=unknownFXFixture();m.positions.push(createPosition(v,m));
 m.snapshots.push({id:'old-shot',date:'2001-01-01',total:123.456,totalEURExact:'123.456',recordedAt:null,byAccount:null,byPosition:null,valuationStatus:'manual',source:'manual',quoteTimes:[],revisions:[],note:'Independent retained observation'});
 const prior=JSON.stringify(m.snapshots);assert.equal(snapshot(m),null);assert.equal(JSON.stringify(m.snapshots),prior);
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(JSON.stringify(restored.snapshots),prior);assert.equal(totalExactEUR(restored),null);
});
