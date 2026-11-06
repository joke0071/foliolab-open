import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexNetPairs,prepareFlatexNetPreview} from '../src/flatex-net-settlement.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {twoFixture} from './flatex-two-fill-fixture.mjs';
test('two independently identified EUR executions, one payment, exact group difference and no allocations',()=>{
 for(const equal of [false,true])for(const reverse of [false,true]){
 const f=twoFixture({equal,reverse}),before=JSON.stringify(f.model),p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(p.eligible,true,p.reason);assert.equal(JSON.stringify(f.model),before);assert.equal(p.preview.ready,3);importCSV(f.model,p.preview);
 const m=f.model;assert.equal(m.bookings.length,3);assert.equal(m.positions[0].quantityExact,equal?'2':'3');assert.equal(m.positions[1].quantityExact,equal?'78':'68');assert.equal(m.externalCashFlows.length,0);assert.equal(m.journalEntries.flatMap(j=>j.postings).filter(p=>p.role==='cash').length,1);assert.equal(m.journalEntries.flatMap(j=>j.postings).filter(p=>p.role==='asset').length,2);assert.equal(m.journalEntries.flatMap(j=>j.postings).find(p=>p.role==='unresolved-net-amount').amountBookEURExact,'2');assert.equal(ledgerQuantityAudit(m).ok,true);
 for(const b of m.bookings){assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);}assert.equal(m.positions[0].costBasisEUR,null);
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(prepareFlatexNetPreview(restored,f.documents,f.assignments,f.options).preview.duplicates,3);
 }
});
test('exact export overlaps deduplicate while later documentary occurrences extend the whole group only',()=>{
 const f=twoFixture();f.documents.push(f.documents[0]);const p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(p.eligible,true,p.reason);assert.equal(p.preview.ready,3);importCSV(f.model,p.preview);const before=structuredClone(f.model);
 const extra=parseFlatexNativeCSV(nativeFlatexCSV('depot',[{0:'9',5:'1',9:'10',8:'SYN-FILL-A'}]));f.documents.push(extra);const repeat=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(repeat.eligible,true,repeat.reason);assert.equal(repeat.preview.ready,0);assert.equal(repeat.preview.duplicates,3);assert.equal(repeat.preview.evidenceUpdates,1);importCSV(f.model,repeat.preview);assert.deepEqual(f.model.positions,before.positions);assert.deepEqual(f.model.journalEntries,before.journalEntries);safeImport(JSON.parse(backup(f.model)));
});
test('negative source matrix: missing legs, excess fills, conflicting identity, date, direction, currency, scope, order and ISIN',()=>{
 const bad=[
  [nativeFlatexCSV('depot',[{5:'1',9:'10',8:'SYN-FILL-A'}]),nativeFlatexCSV('account',[{6:'-32'}])],
  ...[{5:'2',9:'10',8:'SYN-FILL-A'},{5:'2',9:'10',8:'-'},{5:'2',9:'10',8:'SYN-FILL-B',2:'05.01.1999'},{5:'-2',9:'10',8:'SYN-FILL-B'},{5:'2',9:'10',8:'SYN-FILL-B',10:'USD'},{5:'2',9:'10',8:'SYN-FILL-B',11:'OTHER'},{5:'2',9:'10',8:'SYN-FILL-B',7:'ABR ORDER Kauf IE00SYNTH001 666'},{5:'2',9:'10',8:'SYN-FILL-B',3:'IE00SYNTH002'}].map(r=>[nativeFlatexCSV('depot',[{5:'1',9:'10',8:'SYN-FILL-A'},r]),nativeFlatexCSV('account',[{6:'-32'}])]),
  [nativeFlatexCSV('depot',[{5:'1',9:'10',8:'A'},{5:'2',9:'10',8:'B'},{5:'3',9:'10',8:'C'}]),nativeFlatexCSV('account',[{6:'-32'}])],
  [nativeFlatexCSV('depot',[{5:'1',9:'10',8:'A'},{5:'2',9:'10',8:'B'}]),nativeFlatexCSV('account',[{6:'-32'},{5:'CASH2',6:'-1'}])]
 ];
 for(const texts of bad){const f=twoFixture(),docs=texts.map(parseFlatexNativeCSV),n=inspectFlatexNetPairs(docs);assert.equal(n.pairs.filter(p=>p.version===2).length,0);}
 const f=twoFixture();for(const options of [{...f.options,openingConfirmed:false},{...f.options,stale:true},{...f.options,openingDate:'1999-01-02'},{...f.options,selectedIds:[...f.options.selectedIds,...f.options.selectedIds]}]){const before=JSON.stringify(f.model);assert.equal(prepareFlatexNetPreview(f.model,f.documents,f.assignments,options).eligible,false);assert.equal(JSON.stringify(f.model),before);}
});
test('all three members and every financial field survive hostile restore checks; omissions and edits fail closed',()=>{
 const f=twoFixture(),p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);importCSV(f.model,p.preview);
 for(const edit of [m=>m.bookings.pop(),m=>m.journalEntries.pop(),m=>m.bookings[0].netMember='fill-0',m=>m.bookings[0].feeEUR=0,m=>m.bookings[0].netSettlement.cashExact='-31',m=>m.journalEntries[0].postings[0].quantityDeltaExact='2',m=>m.bookings[0].external=true,m=>delete m.bookings[0].netSettlement]){const m=structuredClone(f.model);edit(m);assert.throws(()=>safeImport(m));}
 const incomplete=structuredClone(f.model);incomplete.bookings=incomplete.bookings.filter(b=>b.netMember!=='cash');incomplete.journalEntries=incomplete.journalEntries.filter(j=>j.type!=='withdraw');assert.equal(prepareFlatexNetPreview(incomplete,f.documents,f.assignments,f.options).eligible,false);
});
test('independent integer oracle includes unequal prices, decimal quantities, sell direction, and exact precision rejection',()=>{
 for(const type of ['buy','sell']){
  const f=twoFixture(),sign=type==='buy'?'':'-',details='ABR ORDER '+(type==='buy'?'Kauf':'Verkauf')+' IE00SYNTH001 0009007199254740993';
  f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:sign+'0,125',9:'8',8:'SYN-FILL-A',7:details},{5:sign+'0,25',9:'12',8:'SYN-FILL-B',7:details}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:type==='buy'?'-4,02':'3,98',4:details}]))];f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);
  if(type==='sell'){f.model.positions[0].quantity=1;f.model.positions[0].quantityExact='1';}
  const p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(p.eligible,true,p.reason);importCSV(f.model,p.preview);
  const n=type==='buy'?1n:-1n;
  // Integer oracle uses 1/1000 shares and cents, independent of product arithmetic.
  assert.equal(f.model.positions[0].quantityExact,type==='buy'?'0.375':'0.625');assert.equal(f.model.positions[1].quantityExact,type==='buy'?'95.98':'103.98');assert.equal(f.model.bookings[0].netSettlement.grossExact,String((125n*8n+250n*12n)/1000n));assert.equal(f.model.bookings[0].netSettlement.differenceExact,'-0.02');
 }
 const f=twoFixture();f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'0,000000000000000001',9:'0,1',8:'SYN-FILL-A'},{5:'1',9:'10',8:'SYN-FILL-B'}])),f.documents[1]];assert.equal(inspectFlatexNetPairs(f.documents).pairs.length,0);
});
test('new group cannot overwrite existing references, protected costs or partially journalized sources',()=>{
 for(const change of [m=>m.positions[0].costBasisExact='1',m=>m.snapshots.push({byPosition:{etf:'0'},date:'1999-01-01'}),m=>m.openingPositions.push({positionId:'etf',quantityExact:'0',source:'observed-opening',asOf:null,costBasisExact:null,realizedPnLExact:null}),m=>{m.positions[1].quantity=1;m.positions[1].quantityExact='1';}]){const f=twoFixture();change(f.model);const before=JSON.stringify(f.model),p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(p.eligible,false,p.reason);assert.equal(JSON.stringify(f.model),before);}
 const f=twoFixture(),p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);importCSV(f.model,p.preview);const m=structuredClone(f.model);m.bookings=m.bookings.filter(b=>b.netMember==='fill-0');m.journalEntries=m.journalEntries.filter(j=>j.id===m.bookings[0].journalEntryId);assert.equal(prepareFlatexNetPreview(m,f.documents,f.assignments,f.options).eligible,false);
});
test('two complete dated groups compose without reallocating cash or reusing any source',()=>{
 const f=twoFixture(),later=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'10.01.1999',2:'12.01.1999',5:'1',9:'10',8:'SYN-FILL-C',7:'ORDER Kauf IE00SYNTH001 200'},{1:'10.01.1999',2:'12.01.1999',5:'2',9:'10',8:'SYN-FILL-D',7:'ORDER Kauf IE00SYNTH001 200'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'10.01.1999',1:'12.01.1999',6:'-32',5:'SYN-CASH-LATER',4:'ORDER Kauf IE00SYNTH001 200'}]))];f.documents.push(...later);f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);
 const p=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(p.eligible,true,p.reason);importCSV(f.model,p.preview);assert.equal(f.model.bookings.length,6);assert.equal(f.model.positions[0].quantityExact,'6');assert.equal(f.model.positions[1].quantityExact,'36');safeImport(JSON.parse(backup(f.model)));
});
