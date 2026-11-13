// Characterization evidence ONLY: these PASSes demonstrate missing sync gates.
// This file does not validate or authorize a sync payload.
import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition,backup,safeImport,snapshot} from '../src/model.js';
import {createCompleteBackup} from '../src/complete-backup.js';
import {executeTransaction} from '../src/transactions.js';
import {validateWalletHistory,portableWalletHistory} from '../src/wallet-history-state.js';

const marker='SYNTHETIC_CREDENTIAL_NEVER_REAL';
function fixture(){
 const m=blankModel();
 const provider=createProvider({id:'synthetic-provider',name:'Synthetic',type:'broker'});
 m.providers.push(provider);
 m.positions.push(createPosition({id:'synthetic-cash',providerId:provider.id,name:'Synthetic cash',kind:'cash',quantity:10,price:1,currency:'EUR'},m));
 executeTransaction(m,{type:'deposit',date:'2026-11-13',positionId:m.positions[0].id,quantity:1,unitPrice:1});
 snapshot(m,'2026-11-13','',{manualTotalEUR:'11'});
 return m;
}

test('existing gates: valid synthetic journal retains exact amounts and references',()=>{
 const m=fixture(),restored=safeImport(JSON.parse(backup(m)));
 assert.deepEqual(restored.journalEntries,m.journalEntries);
 assert.equal(restored.positions[0].quantityExact,'11');
 assert.equal(restored.bookings[0].journalEntryId,restored.journalEntries[0].id);
});

test('existing gates: unknown version, duplicate identities and journal quantity mismatch reject',()=>{
 for(const mutate of [
  m=>{m.version=999;},
  m=>m.positions.push(structuredClone(m.positions[0])),
  m=>m.journalEntries.push(structuredClone(m.journalEntries[0])),
  m=>{m.positions[0].quantity=12;m.positions[0].quantityExact='12';}
 ]){
  const raw=JSON.parse(backup(fixture()));mutate(raw);
  assert.throws(()=>safeImport(raw));
 }
});

test('GAP: backup spread retains unknown root credentials; settings cleanup is insufficient',()=>{
 for(const key of ['apiKey','oauthToken','password','privateDeviceCredential']){
  const m=fixture();m[key]=marker;
  assert.equal(JSON.parse(backup(m))[key],marker);
 }
});

test('GAP: importer silently ignores unknown roots and has no portfolio identity binding',()=>{
 const raw=JSON.parse(backup(fixture()));raw.portfolioId='foreign-portfolio';raw.unrecognizedSchema=999;
 const restored=safeImport(raw);
 assert.equal(restored.portfolioId,undefined);
 assert.equal(restored.unrecognizedSchema,undefined);
 assert.equal(restored.positions.length,1);
});

test('GAP: ordinary booking, journal and posting extras survive existing import',()=>{
 for(const pick of [m=>m.bookings[0],m=>m.journalEntries[0],m=>m.journalEntries[0].postings[0]]){
  const raw=JSON.parse(backup(fixture()));pick(raw).privateDeviceCredential=marker;
  assert.equal(pick(safeImport(raw)).privateDeviceCredential,marker);
 }
});

test('GAP: historical opaque structures admit unknown nested credentials and dangling account keys',()=>{
 const raw=JSON.parse(backup(fixture())),s=raw.snapshots[0];
 s.revisions=[{password:marker}];s.quoteTimes=[{oauthToken:marker}];
 s.byAccount={'nonexistent-account':{apiKey:marker}};
 const restored=safeImport(raw).snapshots[0];
 assert.deepEqual(restored.revisions,s.revisions);
 assert.deepEqual(restored.quoteTimes,s.quoteTimes);
 assert.deepEqual(restored.byAccount,s.byAccount);
});

test('GAP: import is a normalizing reader, not a byte-preserving predicate',()=>{
 const raw=JSON.parse(backup(fixture()));raw.openingPositions[0].quantityExact='10.0000';
 const before=JSON.stringify(raw),restored=safeImport(raw);
 assert.equal(restored.openingPositions[0].quantityExact,'10');
 assert.equal(JSON.stringify(raw),before,'reader leaves input unchanged but returns normalized data');
 assert.notEqual(JSON.stringify(restored),before);
});

test('GAP: optional complete-backup configuration can intentionally contain credentials',()=>{
 const m=fixture();
 const complete=createCompleteBackup(m,{settings:{...m.settings,coinGeckoKey:marker},drive:{}});
 assert.equal(complete.configuration.settings.coinGeckoKey,marker);
 assert.equal(createCompleteBackup(m).configuration,undefined);
});

test('GAP: accepted history reader drops unknown fields and rewrites resume status',()=>{
 const raw={schema:1,sessions:[],pending:[{id:'pending',chain:'btc',walletKey:'synthetic',provider:'synthetic',filter:'all',updatedAt:'2026-11-13T00:00:00.000Z',status:'running',oauthToken:marker}],password:marker};
 const validated=validateWalletHistory(raw);
 assert.equal(validated.password,undefined);
 assert.equal(validated.pending[0].oauthToken,undefined);
 assert.equal(validated.pending[0].status,'re-fetch-needed');
 assert.deepEqual(portableWalletHistory(raw).pending,[]);
});

test('GAP: importer has row limits but no aggregate plaintext-byte gate',()=>{
 const raw=JSON.parse(backup(fixture()));
 raw.snapshots[0].revisions=[{opaque:'x'.repeat(10000001)}];
 assert.ok(new TextEncoder().encode(JSON.stringify(raw)).length>10000000);
 assert.equal(safeImport(raw).snapshots[0].revisions[0].opaque.length,10000001);
});
