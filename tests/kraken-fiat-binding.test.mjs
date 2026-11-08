import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,source} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {readSharedImportFiles,previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
const legacy=JSON.parse(readFileSync(new URL('./kraken-fiat-legacy-v297.json',import.meta.url)));
const opts={openingConfirmed:true};
const reward=(asset='USD',subclass='fiat')=>krakenCSV([{type:'earn',subtype:'reward',asset,subclass,amount:'0.3',fee:'0',balance:'2.3',feecurrency:asset}]);
function blocked(m,text,assignments,extra={}){
 const before=JSON.stringify(m),sourceBytes=text,bindingBytes=JSON.stringify(assignments),p=previewKrakenImport(m,[text],assignments,{...opts,...extra,reconstructExisting:true});
 assert.ok(p.issues.some(i=>/native.*Fiat|Fiat.*Cash|Fremdwährungsfiat/i.test(i.message)),JSON.stringify(p.issues));
 assert.throws(()=>confirmKrakenImport(m,[text],assignments,{...opts,...extra,baseline:p.baseline,confirmed:true}));
 assert.equal(JSON.stringify(m),before);assert.equal(text,sourceBytes);assert.equal(JSON.stringify(assignments),bindingBytes);
}
test('fresh native foreign fiat cannot enter through a matching crypto ticker in any supported event class',()=>{
 const internal=krakenCSV([{asset:'USD',subclass:'fiat',type:'earn',subtype:'autoallocation',wallet:'spot',amount:'-1',fee:'0',balance:'2',feecurrency:'USD'},{asset:'USD',subclass:'fiat',type:'earn',subtype:'autoallocation',wallet:'earn',amount:'1',fee:'0',balance:'3',feecurrency:'USD'}]);
 const texts=[...legacy.cases.map(c=>c.text),internal,...['deposit','withdrawal'].map(type=>krakenCSV([{type,subtype:'',asset:'USD',subclass:'fiat',amount:type==='deposit'?'1':'-1',fee:'0',balance:'2',feecurrency:'USD'}]))];
 for(const text of texts){const {m,assignments}=fixture(text),id=prepareKrakenSourcePlan([text]).groups[0].id;blocked(m,text,assignments,{externalReferences:[id]});}
});
test('native EUR fiat requires cash and cash requires native EUR fiat',()=>{
 const text=reward('EUR'),{m,assignments}=fixture(text);m.positions[0].kind='crypto';blocked(m,text,assignments);
 for(const subclass of ['crypto','stable_coin']){const text=reward('EUR',subclass),f=fixture(text);blocked(f.m,text,f.assignments);}
});
test('ordinary EUR, crypto, stablecoin and internal fee-credit quantity paths retain their old exact effects',()=>{
 const texts=[source(),reward('EUR'),reward('ETH','crypto'),reward('USDT','stable_coin'),krakenCSV([{asset:'EUR',subclass:'fiat',amount:'-13',fee:'0',balance:'7',feecurrency:'EUR'},{asset:'ETH',amount:'2',fee:'0',balance:'2',feecurrency:'ETH'},{asset:'FEE',amount:'0',fee:'0.2',balance:'0.8',feecurrency:'FEE'}])];
 for(const text of texts){const {m,assignments}=fixture(text),before=JSON.stringify(m),p=previewKrakenImport(m,[text],assignments,opts);assert.deepEqual(p.issues,[]);assert.equal(p.ready,1);const next=confirmKrakenImport(m,[text],assignments,{...opts,baseline:p.baseline,confirmed:true});assert.equal(ledgerQuantityAudit(next).ok,true);assert.equal(JSON.stringify(m),before);const q=previewKrakenImport(safeImport(JSON.parse(backup(next))),[text],assignments,opts);assert.deepEqual(q.issues,[]);assert.equal(q.ready,0);assert.equal(q.duplicates,1);if(text.includes(',FEE,')){const fee=next.bookings.find(b=>b.type==='fee');assert.equal(fee.amountExactEUR,null);assert.equal(fee.taxEUR,null);}}
});
test('actual v297-generated synthetic legacy groups remain readable, zero-effect replayable, undoable and documentarily withdrawable',()=>{
 assert.equal(legacy.synthetic,true);assert.equal(legacy.generatedByCommit,'602ef464a94381ba86615f8e25f82a71c2d25e8d');
 for(const f of legacy.cases){const m=safeImport(JSON.parse(backup(f.imported))),before=JSON.stringify(m),p=previewKrakenImport(m,[f.text,f.text],f.assignments,opts);assert.deepEqual(p.issues,[]);assert.equal(p.ready,0);assert.equal(p.duplicates,1);assert.equal(JSON.stringify(p.simulated),before);assert.equal(JSON.stringify(m),before);
  const undone=structuredClone(f.imported);undoCSV(undone,csvUndoReceipt(JSON.stringify(f.before),f.imported));assert.deepEqual(undone,f.before);blocked(undone,f.text,f.assignments);
  const o={...opts,selectedGroups:[f.group]},w=previewKrakenWithdrawal(m,[f.text],f.assignments,o),end=confirmKrakenWithdrawal(m,[f.text],f.assignments,{...o,baseline:w.baseline,confirmed:true,at:'1999-02-04T12:00:00Z'});
  assert.deepEqual(end.positions.map(p=>p.quantityExact),f.before.positions.map(p=>p.quantityExact));assert.equal(end.bookings.length,0);assert.equal(ledgerQuantityAudit(end).ok,true);const restored=safeImport(JSON.parse(backup(end))),repeat=previewKrakenImport(restored,[f.text],f.assignments,opts);assert.equal(repeat.ready,0);assert.match(repeat.issues[0].message,/dauerhaft/);assert.equal(JSON.stringify(m),before);
 }
});
test('legacy presence cannot admit changed source, partial membership, changed binding, orphan journal or a fresh foreign-fiat reference',()=>{
 for(const f of legacy.cases){
  const altered=f.text.replace('1999-01-02','1999-01-03'),variants=[{m:structuredClone(f.imported),text:altered,a:f.assignments},{m:structuredClone(f.imported),text:f.text,a:f.assignments},{m:structuredClone(f.imported),text:f.text,a:f.assignments},{m:structuredClone(f.imported),text:f.text,a:{...f.assignments}},{m:structuredClone(f.imported),text:f.text,a:f.assignments}];
  variants[1].m.bookings.pop();variants[2].m.bookings[0].notes+=' edited';
  const pos=structuredClone(variants[3].m.positions.find(p=>p.id===Object.values(f.assignments)[0]));pos.id='synthetic-remapped';variants[3].m.positions.push(pos);variants[3].a[Object.keys(f.assignments)[0]]=pos.id;
  variants[4].m.bookings=[];
  variants.push({m:structuredClone(f.imported),text:f.text,a:f.assignments});variants[5].m.journalEntries.pop();
  for(const {m,text,a} of variants){const raw=JSON.stringify(m),p=previewKrakenImport(m,[text],a,opts);assert.ok(p.issues.length);assert.throws(()=>confirmKrakenImport(m,[text],a,{...opts,baseline:p.baseline,confirmed:true}));assert.equal(JSON.stringify(m),raw);}
  blocked(structuredClone(f.imported),f.text.replaceAll('SYN-FIAT-','SYN-FRESH-'),f.assignments);
 }
});
test('shared import never partially commits a valid EUR sibling beside blocked native foreign fiat',()=>{
 const text=krakenCSV([{txid:'SYN-EUR-REWARD',refid:'SYN-VALID',type:'earn',subtype:'reward',asset:'EUR',subclass:'fiat',amount:'1',fee:'0',balance:'2',feecurrency:'EUR'},{txid:'SYN-USD-REWARD',refid:'SYN-INVALID',type:'earn',subtype:'reward',asset:'USD',subclass:'fiat',amount:'0.3',fee:'0',balance:'2.3',feecurrency:'USD'}]),{m,assignments}=fixture(text),raw=JSON.stringify(m),files=[{name:'Synthetic fiat guard.csv',text}],sources=readSharedImportFiles(files),choices={kraken:{assignments,openingConfirmed:true,confirmed:true}},p=previewKrakenImport(m,[text],assignments,opts);
 assert.equal(p.ready,1);assert.equal(p.issues.length,1);assert.throws(()=>previewSharedImport(m,sources,choices),/Fiat/);assert.equal(JSON.stringify(m),raw);assert.equal(files[0].text,text);
});

test('a previously valid shared plan cannot confirm changed native roles, bindings or model',()=>{
 const text=source(),{m,assignments}=fixture(text),sources=readSharedImportFiles([{name:'Synthetic valid.csv',text}]),choices={kraken:{assignments,openingConfirmed:true,confirmed:true}},plan=previewSharedImport(m,sources,choices),raw=JSON.stringify(m);
 const changedText=text.replace(',crypto,ETH,',',fiat,ETH,'),changed=readSharedImportFiles([{name:'Synthetic altered role.csv',text:changedText}]);
 const changedChoices={kraken:{...choices.kraken,assignments:fixture(changedText).assignments}};
 assert.throws(()=>previewSharedImport(m,changed,changedChoices),/Fiat/);
 assert.throws(()=>confirmSharedImport(m,changed,choices,plan,{confirmed:true,backupConfirmed:true}));
 assert.throws(()=>confirmSharedImport(m,sources,{kraken:{...choices.kraken,assignments:{}}},plan,{confirmed:true,backupConfirmed:true}));
 const altered=structuredClone(m);altered.settings.showSmall=!altered.settings.showSmall;
 assert.throws(()=>confirmSharedImport(altered,sources,choices,plan,{confirmed:true,backupConfirmed:true}));
 assert.equal(JSON.stringify(m),raw);assert.equal(ledgerQuantityAudit(confirmSharedImport(m,sources,choices,plan,{confirmed:true,backupConfirmed:true})).ok,true);
});
