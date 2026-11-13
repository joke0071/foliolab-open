import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';

function model(){
 const m=blankModel();
 m.providers.push(createProvider({id:'provider',name:'Broker',type:'broker'}));
 m.accounts.push(createAccount({id:'account',providerId:'provider',name:'Account',type:'securities'},m));
 m.positions.push(createPosition({id:'position',providerId:'provider',accountId:'account',kind:'stock',name:'Asset',quantityExact:'1.000000000000000001',price:1,currency:'USD',fxRate:null,fxRateExact:null},m));
 return m;
}
const raw=m=>backup(m,{includeHistory:true});
const envelope=data=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data});
const exported=async m=>JSON.parse(await createSyncSnapshot(raw(m))).data;

test('credential-bearing local settings are wholly excluded; source bytes remain unchanged',async()=>{
 const parsed=JSON.parse(raw(model()));
 parsed.settings={alphaVantageKey:'DO_NOT_COPY_API',solanaRpc:'https://user:SECRET@rpc.invalid/?token=SECRET',oauth:{accessToken:'DO_NOT_COPY_OAUTH'},vaultKey:'DO_NOT_COPY_VAULT'};
 const source=JSON.stringify(parsed),before=source;
 const plain=await createSyncSnapshot(source),validated=await validateSyncSnapshot(plain);
 assert.equal(source,before);assert.equal(validated.data.settings,undefined);
 assert.ok(!/DO_NOT_COPY|SECRET|settings|solanaRpc|oauth|vaultKey/.test(plain));
 assert.ok(Object.isFrozen(validated)&&Object.isFrozen(validated.data.positions[0]));
});
test('exact 18-decimal quantity, UNKNOWN FX/null and financial IDs survive without repair',async()=>{
 const result=await validateSyncSnapshot(await createSyncSnapshot(raw(model()))),p=result.data.positions[0];
 assert.equal(p.quantityExact,'1.000000000000000001');assert.equal(p.fxRate,null);assert.equal(p.fxRateExact,'UNKNOWN');
 assert.equal(p.id,'position');assert.equal(p.accountId,'account');assert.equal(p.providerId,'provider');
});
test('simple journal retains balanced postings, exact amounts, ordering and links',async()=>{
 const m=model();m.positions[0].currency='EUR';m.positions[0].fxRate=1;m.positions[0].fxRateExact='1';
 executeTransaction(m,{id:'buy-1',type:'buy',date:'2026-11-01',positionId:'position',quantity:'0.000000000000000001',unitPrice:'1',feeEUR:'0',taxEUR:'0'});
 const source=JSON.parse(raw(m)),result=await exported(m);
 assert.deepEqual(result.bookings,source.bookings);assert.deepEqual(result.journalEntries,source.journalEntries);
 assert.deepEqual(result.openingPositions,source.openingPositions);assert.equal(result.bookings[0].journalEntryId,'buy-1');
 assert.equal(result.positions[0].quantityExact,'1.000000000000000002');
});
test('empty history is retained; malformed accepted sessions and any pending history reject',async()=>{
 const m=model();m.walletHistory={schema:1,sessions:[],pending:[]};
 const data=await exported(m);assert.deepEqual(data.walletHistory,{schema:1,sessions:[],pending:[]});
 for(const field of ['sessions','pending']){
  const copy=structuredClone(data);copy.walletHistory[field].push({id:'unsupported'});
  await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),field==='sessions'?/Historie ist ungültig oder zu groß/:/envelope/);
 }
});
test('v4 booking archive is preserved with its reference identity',async()=>{
 const m=model();m.snapshots.push({id:'snap',date:'2026-10-01',total:1,totalEURExact:'1',recordedAt:null,byAccount:null,byPosition:null,valuationStatus:'manual',source:'manual',quoteTimes:[],revisions:[],note:''});
 m.version=4;m.bookingPresentation={version:2,archivedIds:[],referenceArchivedIds:['snap']};
 const result=await exported(m);assert.equal(result.version,4);assert.deepEqual(result.bookingPresentation,m.bookingPresentation);
});
test('history snapshot exact totals, revisions and quote provenance remain unchanged',async()=>{
 const m=model();m.snapshots.push({id:'snapshot',date:'2026-10-01',total:1,totalEURExact:'1.000000000000000001',recordedAt:null,byAccount:{account:1},byPosition:{position:'1.000000000000000001'},valuationStatus:'observed',source:'current',quoteTimes:[{positionId:'position',updatedAt:'2026-10-01T00:00:00.000Z',quoteAsOf:null,quoteSource:'market',fxRateDate:null}],revisions:[{recordedAt:null,totalEURExact:'0.000000000000000001',valuationStatus:'manual',source:'manual'}],note:'€😀'});
 const result=await exported(m);assert.deepEqual(result.snapshots,JSON.parse(raw(m)).snapshots);
});
test('unknown top-level payload/configuration/vault/extensions are rejected, not dropped',async()=>{
 const source=JSON.parse(raw(model()));
 for(const key of ['configuration','accessToken','vault','extension','deviceId','installationId']){
  const copy=structuredClone(source);copy[key]='SECRET';
  await assert.rejects(()=>createSyncSnapshot(JSON.stringify(copy)),/unsupported-data-or-field/);
 }
 await assert.rejects(()=>createSyncSnapshot(JSON.stringify({kind:'FolioLabCompleteBackup',data:source,configuration:{}})),/unsupported-data-or-field/);
});
test('unknown nested keys cannot hide credentials in allowed financial entities',async()=>{
 const data=await exported(model());
 for(const entity of ['providers','accounts','positions','assets']){
  const copy=structuredClone(data);copy[entity][0].accessToken='SECRET';
  await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/envelope/);
 }
 const copy=structuredClone(data);copy.positions[0].notes={accessToken:'SECRET'};
 await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/envelope/);
});
test('unrecognized wallet and snapshot nested extensions fail closed',async()=>{
 const data=await exported(model());
 data.positions[0].wallet={enabled:true,chain:'evm',address:'0x'+'11'.repeat(20),apiKey:'SECRET'};
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/envelope/);
 const m=model();m.snapshots.push({id:'snap',date:'2026-10-01',total:1,totalEURExact:'1',recordedAt:null,byAccount:null,byPosition:null,valuationStatus:'manual',source:'manual',quoteTimes:[],revisions:[],note:''});
 const d=await exported(m);d.snapshots[0].quoteTimes.push({positionId:'position',accessToken:'SECRET'});
 await assert.rejects(()=>validateSyncSnapshot(envelope(d)),/envelope/);
});
test('duplicate provider/position and orphan account identity reject via existing financial validator',async()=>{
 const data=await exported(model());
 for(const entity of ['providers','positions']){
  const copy=structuredClone(data);copy[entity].push(structuredClone(copy[entity][0]));
  await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/Doppelte/);
 }
 const copy=structuredClone(data);copy.positions[0].accountId='missing';
 await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/Konto/);
});
test('balanced but orphaned journal posting and duplicate posting IDs reject',async()=>{
 const data=await exported(model());
 data.journalEntries=[{id:'entry',type:'adjust',date:'2026-11-01',postings:[{id:'post',positionId:'missing',accountId:null,role:'documentation',quantityDeltaExact:null,amountBookEURExact:'0'}]}];
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/nicht vorhandene Position/);
 data.journalEntries[0].postings[0].positionId=null;
 data.journalEntries.push({...structuredClone(data.journalEntries[0]),id:'entry2'});
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/Doppelte Journal-Buchungs-ID/);
});
test('unbalanced journal cannot pass an allowlisted shape',async()=>{
 const data=await exported(model());data.journalEntries=[{id:'entry',type:'adjust',date:'2026-11-01',postings:[{id:'post',positionId:null,accountId:null,role:'documentation',quantityDeltaExact:null,amountBookEURExact:'1'}]}];
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/nicht ausgeglichen/);
});
test('unknown fee stays null in allowed booking; no zero default is inserted',async()=>{
 const data=await exported(model());data.bookings=[{id:'book',type:'fee',date:'2026-11-01',positionId:'position',quantity:0,quantityExact:'0',notes:'',feeEUR:null,taxEUR:null,amountEUR:null,amountExactEUR:null}];
 const r=await validateSyncSnapshot(envelope(data));assert.equal(r.data.bookings[0].feeEUR,null);assert.equal(r.data.bookings[0].amountExactEUR,null);
});
test('opaque import source/proof branches block instead of stripping their identities',async()=>{
 const data=await exported(model());data.bookings=[{id:'book',type:'fee',date:'2026-11-01',positionId:'position',quantity:0,quantityExact:'0',notes:'',importSource:{sourcePayload:'{"accessToken":"SECRET"}'}}];
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/envelope/);
 const copy=await exported(model());copy.version=5;copy.flatexNetRemovals=[];
 await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/envelope/);
});
test('nonempty price/evidence/audit branches fail without partial output',async()=>{
 const data=await exported(model());
 for(const [key,value] of [['priceHistories',{position:{points:[]}}],['purchaseEvidence',{schema:1,receipts:[],decisions:[]}]]){
  const copy=structuredClone(data);copy[key]=value;
  await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/envelope/);
 }
 data.journalEntries=[{id:'audit',type:'booking-management-audit',date:'2026-11-01',postings:[],managementAudit:{originals:[]}}];
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/envelope/);
});
test('normalization, trimmed IDs/labels and numeric FX repair are rejected, never silently emitted',async()=>{
 const data=await exported(model());
 for(const mutate of [d=>{d.providers[0].name=' Broker ';},d=>{d.positions[0].quantityExact='1.0000000000000000010';},d=>{d.positions[0].fxRate=undefined;delete d.positions[0].fxRateExact;}]){
  const copy=structuredClone(data);mutate(copy);
  await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/normalization-required/);
 }
});
test('received settings and extra envelope keys are forbidden',async()=>{
 const data=await exported(model());data.settings={alphaVantageKey:'SECRET'};
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/envelope/);
 delete data.settings;
 await assert.rejects(()=>validateSyncSnapshot(JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data,verified:true})),/envelope/);
});
test('duplicate keys, extra whitespace and alternate JSON numeric spellings are rejected',async()=>{
 const data=await exported(model()),plain=envelope(data);
 for(const bad of [' '+plain,plain.replace('"snapshotVersion":1','"snapshotVersion":1,"snapshotVersion":1'),plain.replace('"snapshotVersion":1','"snapshotVersion":1.0')])
  await assert.rejects(()=>validateSyncSnapshot(bad),/envelope/);
 const source=JSON.stringify(JSON.parse(raw(model())));
 await assert.rejects(()=>createSyncSnapshot(source.replace('"version":3','"version":3,"version":3')),/noncanonical-local-json/);
});
test('malformed Unicode, malformed JSON and unsupported versions reject',async()=>{
 await assert.rejects(()=>createSyncSnapshot('\ud800'),/payload-unicode/);
 await assert.rejects(()=>validateSyncSnapshot('{'),/json/);
 const data=await exported(model());
 for(const version of [1,2,5,6]){const copy=structuredClone(data);copy.version=version;await assert.rejects(()=>validateSyncSnapshot(envelope(copy)),/envelope/);}
});
test('invalid types and over-limit text reject before JSON processing',async()=>{
 for(const value of [null,{},true,new Uint8Array([1]),'x'.repeat(10000001)]){
  await assert.rejects(()=>createSyncSnapshot(value),/payload-size-or-type/);
  await assert.rejects(()=>validateSyncSnapshot(value),/payload-size-or-type/);
 }
});

test('escaped lone surrogates inside financial strings never reach emitted data',async()=>{
 const data=await exported(model());data.positions[0].notes='\ud800';
 await assert.rejects(()=>validateSyncSnapshot(envelope(data)),/envelope/);
 const parsed=JSON.parse(raw(model()));parsed.positions[0].notes='\udfff';
 await assert.rejects(()=>createSyncSnapshot(JSON.stringify(parsed)),/unsupported-data-or-field/);
});
