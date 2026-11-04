import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFlatexNativeCSV as parse,readFlatexNativeBytes,looksLikeFlatexNativeCSV} from '../src/flatex-native.js';
import {readCSVRecords} from '../src/csv-records.js';
import {parseCSV} from '../src/csv-import.js';
import {inspectNativeFlatexSourceIdentities} from '../src/import-identity.js';
import {inspectNativeFlatexOrderLinks} from '../src/flatex-settlements.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {flatexNativeMarkup,flatexNativeSimulationMarkup,reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {nativeProjectionFixture} from './flatex-native-projection-fixture.mjs';
import {nativeFlatex13CSV as csv,depot13Headers,syntheticCP1252} from './flatex-native-fixture.mjs';

test('depot13 positional contract retains every original field and exact number without inferred scope or net cash',()=>{
 const text=csv(),d=readFlatexNativeBytes(syntheticCP1252(text)),r=d.rows[0];
 assert.equal(looksLikeFlatexNativeCSV(readCSVRecords(text,{delimiter:';'})),true);
 assert.equal(d.encoding,'windows-1252');assert.equal(d.type,'depot');assert.equal(d.dialect,'depot13');
 assert.deepEqual(d.columns.map(c=>c.header),depot13Headers);assert.equal(r.fields.length,13);assert.equal(Object.keys(r.values).length,13);
 assert.equal(r.numbers.nominal,'2.000000000000000001');assert.equal(r.numbers.amount,'-6.500000000000000001');assert.equal(r.numbers.rate,'3.25');assert.equal(r.numbers.fxRate,'1');
 assert.equal(r.values.unit,'Stück');assert.equal(r.values.transactionReference,'00070000000000000001');assert.equal(r.order.reference,'0009007199254740993');
 assert.equal(r.values.depot,undefined);assert.equal(r.values.number,undefined);assert.equal(d.ready,false);assert.equal(d.writeEnabled,false);
 assert.equal('cashExact' in r,false);assert.equal('feeEUR' in r,false);assert.match(r.issues.join(' '),/Depotkennung fehlt/);
 assert.throws(()=>parseCSV(text),/Leere oder doppelte/);
 const immutable=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(immutable);}};immutable(d);
});
test('depot13 rejects reordered/extra/renamed columns, malformed widths, repeated headers and unsupported dialects',()=>{
 for(const headers of [[...depot13Headers].reverse(),[...depot13Headers,'Depot'],depot13Headers.map((h,i)=>i===5?'Einheit':h),depot13Headers.map((h,i)=>i===11?'TA-Nr.':h)])assert.throws(()=>parse(csv([{}],{headers})));
 for(const text of [csv()+';extra',csv()+'\nshort;row',csv()+'\n'+csv()])assert.throws(()=>parse(text));
 const d=parse(csv());for(const changed of [{...d,dialect:'future'},{...d,type:'account'},{...d,dialect:undefined}])assert.throws(()=>inspectNativeFlatexSourceIdentities([Object.freeze(changed)]));
});
test('depot13 unknown fields remain unknown; full original amounts never establish fee, tax or FX completeness',()=>{
 const rows=parse(csv([{4:'-',6:'',8:'-',10:'-'},{4:'0',6:'0',8:'0',10:'0'},{4:'1e3',6:'1,0000000000000000001',8:'1.23',10:'x'}])).rows;
 assert.deepEqual(rows[0].numbers,{nominal:null,rate:null,amount:null,fxRate:null});
 assert.deepEqual(rows[1].numbers,{nominal:'0',rate:'0',amount:'0',fxRate:'0'});
 assert.deepEqual(rows[2].numbers,{nominal:null,rate:null,amount:null,fxRate:null});
});
test('depot13 stays source-review through bindings/order/simulation even beside a valid depot12 document',()=>{
 const f=nativeProjectionFixture(),d=parse(csv([{4:'2',6:'-6,5'}])),before=JSON.stringify(f.model);
 const identities=inspectNativeFlatexSourceIdentities([d]);assert.equal(identities.rows[0].sourceId,null);assert.equal(identities.rows[0].sourceScope,'');assert.equal(identities.rows[0].identity,null);assert.equal(identities.rows[0].status,'source-review');
 const staging=reviewNativeFlatexBindings(f.model,identities,f.assignments);assert.equal(staging.contexts[0].disabled,true);assert.equal(staging.confirmed,0);
 assert.equal(inspectNativeFlatexOrderLinks([d]).groups[0].status,'source-review');
 for(const docs of [[d],[...f.documents,d],[d,...f.documents]]){
  const r=prepareNativeFlatexPreview(f.model,docs,f.assignments,{mode:'append'});assert.equal(r.eligible,false);assert.equal(r.preview,null);assert.ok(r.prepared.issues.some(i=>i.code==='source-scope-review'));assert.equal(JSON.stringify(f.model),before);
 }
});
test('depot13 source UI and blocked simulation show escaped declared fields and located next steps',()=>{
 const f=nativeProjectionFixture(),d=parse(csv([{2:'<img src=x>',12:'Ausführung ORDER Kauf IE00SYNTH001 0009007199254740993'}]));
 const result=prepareNativeFlatexPreview(f.model,[d],{}, {mode:'append'});
 const html=flatexNativeMarkup([{name:'<svg onload=x>',document:d}])+flatexNativeSimulationMarkup(result,{mode:'append'});
 assert.doesNotMatch(html,/<img|<svg/);assert.match(html,/&lt;img/);assert.match(html,/&lt;svg/);assert.match(html,/Devisenkurs laut Export: 1/);assert.match(html,/Depotkennung fehlt/);assert.match(html,/Datei 1 · Zeile 2/);assert.match(html,/keine Depotkennung aus Dateiname, ISIN oder Order/);
 const many=prepareNativeFlatexPreview(f.model,[parse(csv(Array.from({length:25},(_,i)=>({11:'SYN-'+i}))))],{}, {mode:'append'});
 const bounded=flatexNativeSimulationMarkup(many,{mode:'append'});assert.equal((bounded.match(/<li>/g)||[]).length,20);assert.match(bounded,/5 weitere Hinweise/);
});
