import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareNativeFlatexImport as project} from '../src/flatex-import.js';
import {prepareNativeFlatexPreview as preview} from '../src/flatex-backfill.js';
import {importCSV} from '../src/csv-import.js';
import {csvUndoReceipt,canUndoCSV,undoCSV} from '../src/csv-batch.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {parseFlatexNativeCSV as parse} from '../src/flatex-native.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
import {nativeProjectionFixture as fixture,nativeTradeText as text} from './flatex-native-projection-fixture.mjs';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
const run=(f,mode='append',extra={})=>preview(f.model,f.documents,f.assignments,{mode,...extra});
const blocked=r=>{assert.equal(r.eligible,false,r.reason);assert.equal(r.preview,null);assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);};
test('native rows project exactly into existing fields and provenance without invented costs or cash',()=>{
 const f=fixture(),before=JSON.stringify(f.documents),r=project(f.documents);assert.equal(r.parsed.rows.length,2);assert.equal(r.rows.length,2);assert.equal(r.issues.length,0);assert.deepEqual(r.sourceRows,[{sourceIndex:0,line:2},{sourceIndex:0,line:3}]);
 assert.deepEqual(r.parsed.rows.map(x=>[x.type,x.quantity,x.unitPrice,x.date]),[['buy','2','3.25','1999-01-02'],['sell','1','4','1999-01-05']]);
 for(const row of r.parsed.rows)for(const key of ['feeEUR','taxEUR','cashPosition','fxRate'])assert.equal(row[key],'');
 for(const id of Object.values(r.parsed.sourceIdentities)){assert.match(id.sourceId,/^flatex-native-v1:depot:/);assert.equal(id.costsVerified,false);assert.match(id.sourceEvidence.payloadDigest,/^[a-f0-9]{64}$/);}
 assert.equal(r.parsed.rows[0].externalId,'SYN-BUY');assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);assert.equal(JSON.stringify(f.documents),before);
 const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};frozen(r);
});
test('clean empty append simulates share history via common engine, with unknown basis and no external flows',()=>{
 const f=fixture(),before=JSON.stringify(f.model),r=run(f);assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.ready,2);assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);assert.equal(JSON.stringify(f.model),before);
 const s=r.preview.simulated;assert.equal(s.positions[0].quantityExact,'1');assert.equal(s.positions[0].costBasisExact,null);assert.equal(s.positions[0].realizedPnLExact,null);assert.equal(s.externalCashFlows.length,0);assert.equal(s.bookings.length,2);assert.ok(s.bookings.every(b=>b.costsVerified===false&&b.feeEUR===null&&b.taxEUR===null));assert.equal(ledgerQuantityAudit(s).ok,true);
});
test('unknown charges cannot be promoted to zero by import overrides or cash selection',()=>{
 const f=fixture();for(const extra of [{cashPositionId:'cash'},{skippedLines:[2]},{fxRateOverrides:{2:'1'}},{positionOverrides:{2:'asset'}}])assert.throws(()=>run(f,'append',extra));for(const options of [{},{mode:'other'},{mode:'append',stale:'yes'},null])assert.throws(()=>preview(f.model,f.documents,f.assignments,options));
});
test('all non-trade, cash, invalid, FX, unit, direction and precision rows remain review and block whole batch',()=>{
 for(const change of [{7:'Split'},{7:'Thesaurierung'},{7:'Storno ORDER Kauf IE00SYNTH001 100'},{6:'%'},{10:'CHF'},{5:'-2'},{9:'0'},{5:'0,000000000000000001',9:'0,9'},{8:''},{2:'29.02.1900'}]){
  const f=fixture({rows:[{}, {8:'SYN-OTHER',7:'ORDER Kauf IE00SYNTH001 102',...change}]});const p=project(f.documents);assert.equal(p.rows.length,2);assert.ok(p.issues.length);blocked(run(f));
 }
 const f=fixture();f.documents.push(parse(csv('account')));assert.equal(project(f.documents).rows.length,3);blocked(run(f));
});
test('overlap and conflicting bank/order sources cannot be hidden as partial successful imports',()=>{
 for(const other of [parse(text()),parse(text([{1:'03.01.1999'}])),parse(text([{7:'ORDER Verkauf IE00SYNTH001 100',8:'OTHER',5:'-1'}]))]){
  const f=fixture({rows:[{}]});f.documents.push(other);assert.equal(project(f.documents).rows.length,2);assert.ok(project(f.documents).issues.length);blocked(run(f));
 }
});
test('distinct partial executions keep separate bank identities; an unproven mixed intraday sequence is blocked',()=>{
 const f=fixture({rows:[{5:'1',8:'SYN-A'},{5:'1',8:'SYN-B'}]});assert.equal(project(f.documents).issues.length,0);assert.equal(run(f).preview.ready,2);
 const mixed=fixture({rows:[{}, {5:'-1',8:'SYN-SELL',7:'ORDER Verkauf IE00SYNTH001 101'}]});assert.ok(project(mixed.documents).issues.every(x=>x.code==='intraday-review'));blocked(run(mixed));
});
test('account selection, separate current confirmation, source scope and provider type are mandatory',()=>{
 const f=fixture();blocked(preview(f.model,f.documents,{}, {mode:'append'}));Object.values(f.assignments)[0].confirmed=false;blocked(run(f));Object.values(f.assignments)[0].confirmed=true;blocked(run(f,'append',{stale:true}));f.model.accounts[0].name='changed';blocked(run(f));
 const g=fixture();g.model.providers[0].name='Other broker';blocked(run(g));
 const h=fixture();h.documents.push(parse(text([{8:'OTHER',7:'ORDER Kauf IE00SYNTH001 102',11:'OTHER-SCOPE'}])));blocked(run(h));
});
test('missing/ambiguous/wrong-currency/wallet securities cannot be silently mapped or created',()=>{
 for(const change of [f=>f.model.positions=[],f=>f.model.positions.push({...f.model.positions[0],id:'second'}),f=>f.model.positions[0].currency='CHF',f=>f.model.positions[0].managementSource='wallet',...['crypto','cash','other'].map(kind=>f=>f.model.positions[0].kind=kind)]){const f=fixture(),before=()=>JSON.stringify(f.model);change(f);const b=before();blocked(run(f));assert.equal(before(),b);}
});
test('append cannot add history on top of observed balances or existing protected evidence',()=>{
 const held=fixture({quantity:1});blocked(run(held));
 for(const change of [f=>{f.model.positions[0].costBasisExact='1';},f=>f.model.openingPositions.push({positionId:'asset',quantityExact:'0',costBasisExact:null,realizedPnLExact:null,asOf:'1998-01-01'}),f=>f.model.snapshots.push({date:'1998-01-01',byPosition:{asset:'1'}})]){const f=fixture();change(f);const before=JSON.stringify(f.model);blocked(run(f));assert.equal(JSON.stringify(f.model),before);}
});
test('backfill delegates conservative observed-balance replacement and preserves exact ending shares',()=>{
 const f=fixture({quantity:1}),before=JSON.stringify(f.model),r=run(f,'backfill');assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.baseline,before);assert.equal(r.preview.simulated.positions[0].quantityExact,'1');assert.equal(r.preview.simulated.positions[0].costBasisExact,null);assert.equal(JSON.stringify(f.model),before);
 blocked(run(fixture({quantity:2}),'backfill'));blocked(run(fixture({quantity:1,basis:10}),'backfill'));
});
test('baseline mismatch prevents synthetic commit and preserves all changes made since preview',()=>{
 const f=fixture(),r=run(f);f.model.settings.autoRefresh=false;const before=JSON.stringify(f.model);assert.throws(()=>importCSV(f.model,r.preview),/seit der CSV/);assert.equal(JSON.stringify(f.model),before);
});
test('same exact native sources replay as duplicates after synthetic commit/backup without doubling',()=>{
 const f=fixture(),r=run(f);assert.equal(importCSV(f.model,r.preview).imported,2);const restored=safeImport(JSON.parse(backup(f.model))),before=JSON.stringify(restored);const again=preview(restored,f.documents,f.assignments,{mode:'append'});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);assert.equal(importCSV(restored,again.preview).imported,0);assert.equal(JSON.stringify(restored),before);
 const reordered=preview(restored,[parse(text([{1:'05.01.1999',2:'06.01.1999',5:'-1',7:'ORDER Verkauf IE00SYNTH001 101',8:'SYN-SELL',9:'4'},{0:'99'}]))],f.assignments,{mode:'append'});assert.equal(reordered.eligible,true,reordered.reason);assert.equal(reordered.preview.duplicates,2);
 const parts=[parse(text([{1:'05.01.1999',2:'06.01.1999',5:'-1',7:'ORDER Verkauf IE00SYNTH001 101',8:'SYN-SELL',9:'4'}])),parse(text([{0:'99'}]))];assert.equal(preview(restored,parts,f.assignments,{mode:'append'}).preview.duplicates,2);
});
test('raw evidence conflicts and manual corrections remain protected after synthetic import',()=>{
 const f=fixture();importCSV(f.model,run(f).preview);const changed=structuredClone(f.model);changed.bookings[0].notes='Synthetic correction';const b=JSON.stringify(changed);blocked(preview(changed,f.documents,f.assignments,{mode:'append'}));assert.equal(JSON.stringify(changed),b);
 const different=[parse(text([{}, {1:'05.01.1999',2:'07.01.1999',5:'-1',7:'ORDER Verkauf IE00SYNTH001 101',8:'SYN-SELL',9:'4'}]))];blocked(preview(f.model,different,f.assignments,{mode:'append'}));
});
test('session-only common undo restores the exact pre-import synthetic baseline and refuses later edits',()=>{
 const f=fixture(),before=JSON.stringify(f.model);importCSV(f.model,run(f).preview);const receipt=csvUndoReceipt(before,f.model);assert.equal(canUndoCSV(f.model,receipt),true);undoCSV(f.model,receipt);assert.equal(JSON.stringify(f.model),before);
 importCSV(f.model,run(f).preview);const stale=csvUndoReceipt(before,f.model);f.model.settings.autoRefresh=false;assert.equal(canUndoCSV(f.model,stale),false);assert.throws(()=>undoCSV(f.model,stale),/seit dem Import/);
});
test('shared errors never return a partial financial preview',()=>{
 const f=fixture({rows:[{}, {5:'-9',8:'SYN-SELL',7:'ORDER Verkauf IE00SYNTH001 101',1:'05.01.1999',2:'06.01.1999'}]}),before=JSON.stringify(f.model);blocked(run(f));assert.equal(JSON.stringify(f.model),before);
 const later=fixture();importCSV(later.model,run(later).preview);later.documents=[parse(text([{7:'ORDER Kauf IE00SYNTH001 102',8:'SYN-NEW',1:'07.01.1999',2:'08.01.1999'}]))];blocked(run(later));
});
test('direct native document/file/row bounds stay fail closed',()=>{
 for(const documents of [null,[],Array(21).fill(fixture().documents[0]),[{...fixture().documents[0]}]])assert.throws(()=>project(documents));
 const large=parse(text(Array.from({length:5000},(_,i)=>({7:'ORDER Kauf IE00SYNTH001 '+i,8:'SYN-'+i}))));assert.equal(project([large]).rows.length,5000);assert.throws(()=>project([large,...fixture().documents]));
});
test('encrypted backup roundtrip preserves native evidence, unknown costs and duplicate replay',async()=>{
 const f=fixture();importCSV(f.model,run(f).preview);const plain=backup(f.model),encrypted=await encryptBackup(plain,'synthetic-native-projection-password');assert.equal(encrypted.includes('SYN-BUY'),false);
 const restored=safeImport(JSON.parse(await decryptBackup(JSON.parse(encrypted),'synthetic-native-projection-password'))),r=preview(restored,f.documents,f.assignments,{mode:'append'});assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.ready,0);assert.equal(r.preview.duplicates,2);assert.ok(restored.bookings.every(b=>b.feeEUR===null&&b.taxEUR===null&&b.costsVerified===false));
});
