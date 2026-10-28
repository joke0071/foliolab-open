import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectNativeFlatexSourceIdentities as inspect,validateNativeSourceEvidence,sourceUnmodified,importSourceKey} from '../src/import-identity.js';
import {parseFlatexNativeCSV,readFlatexNativeBytes,FLATEX_NATIVE_COLUMNS} from '../src/flatex-native.js';
import {nativeFlatexCSV as nativeCSV,syntheticCP1252} from './flatex-native-fixture.mjs';
import {fixture,csv} from './p0-import-fixture.mjs';
import {previewCSV,inferMapping,importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
const D=(rows=[{}])=>parseFlatexNativeCSV(nativeCSV('depot',rows));
const C=(rows=[{}])=>parseFlatexNativeCSV(nativeCSV('account',rows));
const offer=d=>inspect([d]).rows[0].identity;
// Independently invented normalized DTO: proves the shared source guard only.
// This is deliberately not a native economic mapping or import adapter.
const project=(m,identity,options={})=>{const p=csv(identity.externalId);p.sourceIdentities={2:identity};return previewCSV(m,p,inferMapping(p.headers),options);};
test('source identity separates bank ID/order ID/side/scope with exact strings and no portfolio binding',()=>{
 const r=inspect([D(),C()]);assert.equal(r.rows.length,2);assert.ok(r.rows.every(x=>x.status==='candidate-source'));assert.notEqual(r.rows[0].sourceId,r.rows[1].sourceId);assert.notEqual(r.rows[0].externalId,r.rows[0].orderReference);assert.equal(r.rows[0].externalId,'00070000000000000001');assert.notEqual(offer(D()).sourceId,offer(D([{11:'OTHER'}])).sourceId);
 assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);assert.equal('accountId' in r.rows[0].identity,false);assert.equal(r.rows[0].identity.costsVerified,false);for(const k of ['commit','import','parsed','mapping','simulated'])assert.equal(k in r,false);
});
test('canonical source digest independently matches SHA256 of fixed original fields excluding only ordinal',()=>{
 const d=D(),r=inspect([d]).rows[0];const canonical=JSON.stringify(FLATEX_NATIVE_COLUMNS.depot.filter(c=>c.key!=='number').map(c=>[c.key,d.rows[0].values[c.key]]));
 assert.equal(r.payloadDigest,createHash('sha256').update(canonical).digest('hex'));assert.equal(r.sourceId,'flatex-native-v1:depot:'+createHash('sha256').update(JSON.stringify(d.rows[0].values.depot)).digest('hex'));
 assert.deepEqual(validateNativeSourceEvidence(r.identity),r.identity.sourceEvidence);
});
test('encoding, document order, source lines and changed ordinal cannot create new identities',()=>{
 const d=D(),renumbered=D([{0:'999'}]),encoded=readFlatexNativeBytes(syntheticCP1252(nativeCSV()));
 assert.deepEqual(offer(d),offer(renumbered));assert.deepEqual(offer(d),offer(encoded));assert.equal(inspect([C(),d]).rows[1].sourceId,offer(d).sourceId);
 const shifted=D([{8:'ANOTHER'},{0:'99'}]);assert.deepEqual(inspect([shifted]).rows[1].identity,offer(d));assert.equal(inspect([shifted]).rows[1].line,3);
});
test('changed source facts never change source identity and every raw field except ordinal affects evidence',()=>{
 for(const [d,side]of [[D(),'depot'],[C(),'account']]){
  const base=inspect([d]).rows[0];
  for(const col of FLATEX_NATIVE_COLUMNS[side].filter(c=>!['number','transactionReference','depot','account'].includes(c.key))){
   const updated=parseFlatexNativeCSV(nativeCSV(side,[{[col.index]:d.rows[0].values[col.key]+'X'}])),r=inspect([updated]).rows[0];
   assert.equal(r.sourceId,base.sourceId,col.key);assert.equal(r.externalId,base.externalId,col.key);assert.notEqual(r.payloadDigest,base.payloadDigest,col.key);
  }
 }
});
test('overlap and conflicting repetitions retain all rows and withhold all affected offers',()=>{
 for(const docs of [[D(),D([{0:'99'}])],[C(),C()]]){const r=inspect(docs);assert.equal(r.rows.length,2);assert.ok(r.rows.every(x=>x.status==='overlap-review'&&x.identity===null));}
 for(const docs of [[D(),D([{1:'03.01.1999'}]),D()],[D(),D([{7:'ORDER Kauf IE00SYNTH001 99'}])]]){const r=inspect(docs);assert.equal(r.rows.length,docs.length);assert.ok(r.rows.every(x=>x.status==='conflict'&&x.identity===null));}
 const independent=inspect([D([{8:'A'},{8:'B'}]),C([{5:'A'}])]);assert.ok(independent.rows.every(x=>x.status==='candidate-source'));assert.equal(new Set(independent.rows.map(x=>JSON.stringify([x.sourceId,x.externalId]))).size,3);
});
test('missing unsafe references and parser issues never get a content/order/file fallback',()=>{
 for(const d of [D([{8:''}]),D([{11:'-'}]),D([{8:'A\nB'}]),D([{8:'x'.repeat(201)}]),D([{11:'x'.repeat(201)}]),D([{8:'\u0081'}]),D([{2:'29.02.1900'}]),D([{5:'-'}]),D([{7:'unclassified'}])]){const r=inspect([d]);assert.equal(r.rows[0].status,'source-review');assert.equal(r.rows[0].identity,null);assert.equal(r.rows.length,1);}
});
test('bounded immutable source projection rejects tampered shapes and retains 5000 independent rows',()=>{
 const d=D();for(const docs of [null,[],Array(21).fill(d),[{...d}],[Object.freeze({...d,writeEnabled:true})],[Object.freeze({...d,columns:[]})],[Object.freeze({...d,rows:Object.freeze([d.rows[0],d.rows[0]])})],[Object.freeze({...d,rows:Object.freeze(Array(5001).fill(d.rows[0]))})]])assert.throws(()=>inspect(docs));
 const many=D(Array.from({length:5000},(_,i)=>({8:'SYN-'+i}))),before=JSON.stringify(many),r=inspect([many]);assert.equal(r.rows.length,5000);assert.ok(r.rows.every(x=>x.status==='candidate-source'));assert.equal(JSON.stringify(many),before);assert.ok(Object.isFrozen(r.rows[0].identity.sourceEvidence));assert.throws(()=>{r.rows[0].identity.externalId='changed';},TypeError);
});
test('changed native evidence conflicts even with identical normalized financial projection',()=>{
 const m=fixture(),id=offer(D());importCSV(m,project(m,id));const before=JSON.stringify(m),p=project(m,offer(D([{2:'05.01.1999'}])));
 assert.equal(p.ready,0);assert.equal(p.duplicates,0);assert.equal(p.issues[0].code,'source-conflict');assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);assert.deepEqual(JSON.parse(m.bookings[0].importSource.sourcePayload).sourceEvidence,id.sourceEvidence);
});
test('native replay is idempotent after raw ordinal changes, plain backup and encrypted restore',async()=>{
 const m=fixture(),id=offer(D());importCSV(m,project(m,id));const restored=safeImport(JSON.parse(backup(m)));assert.equal(project(restored,offer(D([{0:'999'}]))).duplicates,1);assert.ok(sourceUnmodified(restored,restored.bookings[0]));
 const {encryptBackup,decryptBackup}=await import('../src/crypto-backup.js');const encrypted=await encryptBackup(backup(m),'synthetic-native-replay');const recovered=safeImport(JSON.parse(await decryptBackup(JSON.parse(encrypted),'synthetic-native-replay')));assert.equal(project(recovered,id).duplicates,1);assert.deepEqual(recovered.bookings,m.bookings);
});
test('native manual edits, manual ownership and damaged journals keep existing protection',()=>{
 const original=fixture(),id=offer(D());importCSV(original,project(original,id));
 for(const edit of [m=>m.bookings[0].notes='User correction',m=>m.bookings[0].importSource.ownership='manual',m=>m.journalEntries[0].description='Changed']){const m=structuredClone(original);edit(m);const before=JSON.stringify(m),p=project(m,id);assert.equal(p.issues[0].code,'source-conflict');assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);}
});
test('malformed, missing or foreign evidence fails closed in preview and backup validation',()=>{
 const good=offer(D());
 for(const change of [{sourceEvidence:undefined},{sourceEvidence:null},{sourceEvidence:{version:2,payloadDigest:'a'.repeat(64)}},{sourceEvidence:{version:1,payloadDigest:'A'.repeat(64)}},{sourceEvidence:{version:1,payloadDigest:'a'.repeat(64),extra:true}},{externalId:''},{externalId:'\u0081'},{sourceId:'flatex-native-v2:depot:'+'a'.repeat(64)},{sourceId:'generic-csv'}]){const id={...good,...change},m=fixture(),p=project(m,id);assert.equal(p.ready,0);assert.equal(p.issues.length,1);assert.throws(()=>importCSV(m,p));}
 const m=fixture();importCSV(m,project(m,good));for(const sourceEvidence of [undefined,{version:2,payloadDigest:'a'.repeat(64)}]){const raw=JSON.parse(backup(m)),b=raw.bookings[0],payload=JSON.parse(b.importSource.sourcePayload);payload.sourceEvidence=sourceEvidence;b.importSource.sourcePayload=JSON.stringify(payload);assert.throws(()=>safeImport(raw));}
});
test('legacy Flatex references and other unproven same-projection bookings cannot be bypassed by a new namespace',()=>{
 const native=offer(D());
 for(const sourceId of ['flatex-at','generic-csv']){const m=fixture();importCSV(m,project(m,{sourceId,externalId:native.externalId}));const before=JSON.stringify(m),p=project(m,native);assert.equal(p.issues[0].code,'source-conflict');assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);}
 const m=fixture();importCSV(m,project(m,{sourceId:'flatex-at',externalId:native.externalId}));const p=csv(native.externalId);p.rows[0].date='2025-01-02';p.sourceIdentities={2:native};assert.equal(previewCSV(m,p,inferMapping(p.headers)).issues[0].code,'source-conflict');
});
test('distinct native bank references and separate scopes are not collapsed by equal economic values',()=>{
 const m=fixture(),a=offer(D()),b=offer(D([{8:'OTHER'}])),c=offer(D([{11:'OTHER-SCOPE'}]));for(const id of [a,b,c]){const p=project(m,id);assert.deepEqual(p.issues,[]);assert.equal(p.ready,1);importCSV(m,p);}assert.equal(m.bookings.length,3);assert.equal(new Set(m.bookings.map(b=>importSourceKey(b.importSource))).size,3);
});
test('mixed native/legacy rows in either batch order cannot create two bookings for unproven shared provenance',()=>{
 const id=offer(D()),legacy={sourceId:'flatex-at',externalId:id.externalId};
 for(const origins of [[id,legacy],[legacy,id]]){const m=fixture(),before=JSON.stringify(m),p=csv(id.externalId);p.rows.push({...p.rows[0]});p.sourceIdentities={2:origins[0],3:origins[1]};const review=previewCSV(m,p,inferMapping(p.headers));assert.ok(review.issues.some(i=>i.code==='source-conflict'));assert.throws(()=>importCSV(m,review));assert.equal(JSON.stringify(m),before);}
});
test('native evidence cannot weaken whole-batch rollback or stale portfolio checks',()=>{
 const m=fixture(),id=offer(D());importCSV(m,project(m,id));const before=JSON.stringify(m),p=csv(id.externalId);p.rows.push({...p.rows[0],externalId:'OTHER'});p.sourceIdentities={2:offer(D([{2:'05.01.1999'}])),3:offer(D([{8:'OTHER'}]))};const review=previewCSV(m,p,inferMapping(p.headers));assert.equal(review.issues[0].code,'source-conflict');assert.equal(review.ready,1);assert.throws(()=>importCSV(m,review));assert.equal(JSON.stringify(m),before);
 const fresh=project(m,offer(D([{8:'NEXT'}])));m.settings.autoRefresh=false;const changed=JSON.stringify(m);assert.throws(()=>importCSV(m,fresh),/Vorschau/);assert.equal(JSON.stringify(m),changed);
});
test('legacy evidence-free payload shape remains unchanged',()=>{
 const m=fixture(),p=csv('generic');importCSV(m,previewCSV(m,p,inferMapping(p.headers)));const b=m.bookings[0];assert.equal(Object.hasOwn(JSON.parse(b.importSource.sourcePayload),'sourceEvidence'),false);assert.deepEqual(safeImport(JSON.parse(backup(m))).bookings,m.bookings);assert.equal(validateNativeSourceEvidence({sourceId:'generic-csv'}),undefined);
});
