import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectNativeFlatexOrderLinks as inspect,pairFlatexSettlements} from '../src/flatex-settlements.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const D=(rows=[{}])=>parseFlatexNativeCSV(csv('depot',rows)),C=(rows=[{}])=>parseFlatexNativeCSV(csv('account',rows));
const order=(type='Kauf',isin='IE00SYNTH001',ref='0009007199254740993')=>'ABR ORDER '+type+' '+isin+' '+ref;
const status=(docs,options)=>inspect(docs,options).groups.map(g=>g.status);
test('native 1:1 candidates reuse legacy criteria while bank IDs and order IDs remain separate strings',()=>{
 const docs=[D(),C()],before=JSON.stringify(docs),r=inspect(docs);assert.deepEqual(status(docs),['possible-single']);assert.equal(r.groups[0].orderReference,'0009007199254740993');assert.notEqual(r.groups[0].depot[0].bankReference,r.groups[0].cash[0].bankReference);assert.equal(r.rows.length,2);assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);assert.equal('commit' in r,false);assert.equal(JSON.stringify(docs),before);
 assert.equal(pairFlatexSettlements({sourceTrades:[{reference:'SYN',date:'1999-01-02',isin:'IE00SYNTH001',type:'buy'}],cashItems:[{reference:'SYN',date:'1999-01-02',amount:'-1',kind:'settlement',details:order()}]}).paired.length,1);
});
test('multiple distinct cash legs remain a review group, even for equal amounts',()=>{
 const r=inspect([D(),C([{5:'SYN-A'},{5:'SYN-B'}])]);assert.equal(r.groups[0].status,'multiple-cash-review');assert.equal(r.groups[0].cash.length,2);assert.equal(r.rows.length,3);assert.doesNotMatch(JSON.stringify(r),/3086|cashExact|grossExact|differenceExact|feeEUR|totalAmount/);
});
test('partial depot executions are not deduplicated, summed or allocated across cash legs',()=>{
 const r=inspect([D([{8:'SYN-EXEC-A',5:'1'},{8:'SYN-EXEC-B',5:'2'}]),C()]);assert.equal(r.groups[0].status,'multiple-depot-review');assert.equal(r.groups[0].depot.length,2);assert.equal(r.rows.length,3);
});
test('missing counterpart and unassigned non-order events never invent a leg',()=>{
 assert.deepEqual(status([D()]),['missing-cash']);assert.deepEqual(status([C()]),['missing-depot']);
 const r=inspect([D([{7:'Thesaurierung'},{7:'Storno Fusion'},{7:'Split'},{7:'Lagerstellenwechsel'}]),C()]);assert.equal(r.rows.length,5);assert.equal(r.unassigned.length,4);assert.deepEqual(r.groups[0].depot,[]);
});
test('same bank ID, ISIN, date and amount cannot override different or absent order references',()=>{
 const r=inspect([D(),C([{4:order('Kauf','IE00SYNTH001','OTHER'),5:'00070000000000000001'}])]);assert.equal(r.groups.length,1);assert.equal(r.groups[0].status,'missing-cash');assert.equal(r.unassigned.length,1); // Non-numeric order token stays unassigned, even with an equal bank ID.
 const distinct=inspect([D(),C([{4:order('Kauf','IE00SYNTH001','9002'),5:'00070000000000000001'}])]);assert.deepEqual(distinct.groups.map(g=>g.status),['missing-cash','missing-depot']);
 const missing=inspect([D(),C([{4:'ORDER Kauf IE00SYNTH001'}])]);assert.equal(missing.unassigned.length,1);assert.equal(missing.groups[0].status,'missing-cash');
});
test('an order reference with conflicting type or ISIN is one conflict, not two hidden groups',()=>{
 for(const c of [C([{4:order('Kauf','IE00SYNTH002')}]),C([{4:order('Verkauf'),6:'1'}])]){const r=inspect([D(),c]);assert.equal(r.groups.length,1);assert.equal(r.groups[0].status,'conflict');assert.equal(r.rows.length,2);}
 assert.deepEqual(status([D([{3:'IE00SYNTH002'}]),C()]),['source-review']);assert.deepEqual(status([D(),C([{4:'IE00SYNTH002 '+order()}])]),['source-review']);
});
test('identical overlap across exports stays visible and row ordinal changes do not create an execution',()=>{
 const r=inspect([D(),D([{0:'999'}]),C()]);assert.equal(r.rows.length,3);assert.equal(r.groups[0].status,'overlap-review');assert.equal(r.groups[0].depot.length,2);assert.equal(r.groups[0].depot[1].sourceIndex,1);
});
test('changed payload with same bank identity blocks every affected group, independent of dates',()=>{
 assert.deepEqual(status([D(),D([{1:'03.01.1999'}]),C()]),['conflict']);
 const r=inspect([D(),D([{7:order('Kauf','IE00SYNTH001','9002')}]),C()]);assert.equal(r.groups.length,2);assert.ok(r.groups.every(g=>g.status==='conflict'));assert.equal(r.rows.length,3);
});
test('order-bound cancellations block the full group without netting or partial matching',()=>{
 const r=inspect([D(),C(),C([{4:'Storno '+order(),5:'SYN-STORNO'}])]);assert.equal(r.groups[0].status,'cancelled-review');assert.equal(r.groups[0].cash.length,2);assert.equal(r.rows.length,3);
 assert.deepEqual(status([D([{7:'Storno '+order()}]),C()]),['cancelled-review']);
});
test('scope references are required, counterparty fields never establish ownership',()=>{
 assert.deepEqual(status([D(),C([{5:'SYN-A'},{5:'SYN-B',9:'SYN-SECOND-CASH'}])]),['scope-review']);assert.deepEqual(status([D([{8:'SYN-A'},{8:'SYN-B',11:'SYN-SECOND-DEPOT'}]),C()]),['scope-review']);
 assert.deepEqual(status([D([{11:''}]),C()]),['source-review']);assert.deepEqual(status([D(),C([{9:'-'}])]),['source-review']);assert.deepEqual(status([D(),C([{3:'OTHER-COUNTERPARTY',8:'OTHER-ORIGINATOR'}])]),['possible-single']);
});
test('unknown/zero/invalid exact quantities, wrong cash directions and missing references stay in review',()=>{
 for(const d of [D([{5:'-'}]),D([{5:'0'}]),D([{9:'0'}]),D([{9:'1,0000000000000000001'}]),D([{6:''}]),D([{8:'-'}])])assert.deepEqual(status([d,C()]),['source-review']);
 for(const c of [C([{6:'0'}]),C([{6:'1'}]),C([{6:'-'}]),C([{5:''}]),C([{7:''}])])assert.deepEqual(status([D(),c]),['source-review']);
 assert.deepEqual(status([D(),C([{5:'SYN-A'},{5:'SYN-B',6:'1'}])]),['source-review']);
});
test('currencies remain declared evidence, with no EUR or FX inference',()=>{
 assert.deepEqual(status([D(),C([{7:'CHF'}])]),['source-review']);assert.deepEqual(status([D([{10:'CHF'}]),C([{7:'CHF'}])]),['possible-single']);
 assert.deepEqual(status([D(),C([{5:'SYN-A'},{5:'SYN-B',7:'CHF'}])]),['source-review']);
});
test('booking and value dates both obey the unchanged bounded horizon',()=>{
 assert.deepEqual(status([D(),C([{0:'03.01.1999'}])],{maxDays:0}),['source-review']);assert.deepEqual(status([D(),C([{1:'20.01.1999'}])]),['source-review']);assert.deepEqual(status([D(),C([{1:'29.02.1900'}])]),['source-review']);
 assert.deepEqual(status([D(),C([{0:'22.01.1999',1:'22.01.1999'}])],{maxDays:30}),['possible-single']);
 for(const maxDays of [-1,31,NaN,1.5])assert.throws(()=>inspect([D(),C()],{maxDays}));
});
test('output is deeply immutable and semantic groups do not depend on document order',()=>{
 const a=inspect([D(),C()]),b=inspect([C(),D()]);assert.equal(a.groups[0].status,b.groups[0].status);assert.equal(a.groups[0].orderReference,b.groups[0].orderReference);
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.rows)&&Object.isFrozen(a.rows[0])&&Object.isFrozen(a.groups)&&Object.isFrozen(a.groups[0])&&Object.isFrozen(a.groups[0].reasons)&&Object.isFrozen(a.groups[0].cash)&&Object.isFrozen(a.unassigned));assert.throws(()=>{a.groups[0].status='confirmed';},TypeError);
});
test('input and row bounds fail closed while a full bounded source remains represented',()=>{
 for(const docs of [null,[],Array(21).fill(D()),[{...D(),writeEnabled:true}],[{...D(),rows:Array(5001).fill(D().rows[0])}]])assert.throws(()=>inspect(docs));
 const d=D(Array.from({length:5000},(_,i)=>({7:order('Kauf','IE00SYNTH001',String(i)),8:'SYN-'+i}))),r=inspect([d]);assert.equal(r.rows.length,5000);assert.equal(r.groups.length,5000);assert.ok(r.groups.every(g=>g.status==='missing-cash'));
});

test('control characters and unbounded source reference strings never become possible matches',()=>{
 for(const d of [D([{8:'SYN\nREF'}]),D([{11:'SYN\u0081SCOPE'}]),D([{8:'9'.repeat(201)}]),D([{7:order('Kauf','IE00SYNTH001','9'.repeat(201))}])])assert.ok(inspect([d,C()]).groups.every(g=>g.status!=='possible-single'));
});

test('multiple ORDER tuples in one source row cannot yield a unique 1:1 candidate',()=>{
 const d=D([{7:order('Kauf','IE00SYNTH001','9002')+' '+order()}]);
 assert.deepEqual(status([d,C()]),['source-review']);
});
