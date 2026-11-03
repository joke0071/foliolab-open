import test from 'node:test';
import assert from 'node:assert/strict';
import {krakenReferenceOrder,previewKrakenImport,confirmKrakenImport} from '../src/kraken-import.js';
import {backup,safeImport} from '../src/model.js';
import {fixture,crossReferenceSource} from './kraken-import-fixture.mjs';
const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(t=>[x,...t])):[[]];
const groups=spec=>[...new Set(spec.map(r=>r[0]))].map(id=>({id,issues:[],rows:spec.filter(r=>r[0]===id).map(([,stream,a,b],i)=>({identity:id+i,streamId:stream,values:{time:'1999-01-02 12:00:00'},beforeExact:String(a),balanceExact:String(b)}))}));
test('independent exhaustive group permutations validate accepted dependencies across two streams',()=>{
 let cases=0,accepted=0;
 // Every pair of three-row stream paths and each group assignment, including interleavings/cycles.
 for(const left of permutations(['A','B','C']))for(const right of permutations(['A','B','C'])){
  const spec=[...left.map((id,i)=>[id,'x',i,i+1]),...right.map((id,i)=>[id,'y',i,i+1])],gs=groups(spec);
  const valid=permutations(gs).filter(order=>['x','y'].every(stream=>{
   let current=0;
   for(const g of order)for(const r of g.rows.filter(r=>r.streamId===stream)){if(Number(r.beforeExact)!==current)return false;current=Number(r.balanceExact);}
   return true;
  }));
  let actual,error;try{actual=krakenReferenceOrder(gs,new Map([['x',0n],['y',0n]]));}catch(e){error=e;}
  if(valid.length){assert.ok(!error);assert.deepEqual(actual.map(g=>g.id),valid[0].map(g=>g.id));accepted++;}else assert.match(error.message,/widersprechen/);
  cases++;
 }
 assert.equal(cases,36);assert.equal(accepted,6);
});
test('independent references canonicalize; interleaving, ambiguous paths, gaps and bounds stay blocked',()=>{
 const start=new Map([['x',0n],['y',0n]]);
 assert.deepEqual(krakenReferenceOrder(groups([['B','y',0,1],['A','x',0,1]]),start).map(g=>g.id),['A','B']);
 for(const [spec,reason] of [
  [[['A','x',0,1],['B','x',1,2],['A','x',2,3]],/verschachtelt/],
  [[['A','x',0,0],['B','x',0,0]],/mehrere vollständige/],
  [[['A','x',0,1],['B','x',2,3]],/Quellsaldo/],
  [Array.from({length:65},(_,i)=>[String(i),'x',i,i+1]),/Große Referenzgruppe/]
 ])assert.throws(()=>krakenReferenceOrder(groups(spec),start),reason);
});
test('24 CSV permutations have identical exact journal, v5 restore and mixed existing/new reimports',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-11-03T00:00:00Z')});let uid=0;t.mock.method(globalThis.crypto,'randomUUID',()=>`synthetic-chronology-${uid++}`);
 const text=crossReferenceSource(),{m,assignments}=fixture(text),before=JSON.stringify(m),[header,...rows]=text.split('\n');let canonical;
 for(const permutation of permutations(rows)){
  const input=[header,...permutation].join('\n');uid=0;
  const options={openingConfirmed:true},p=previewKrakenImport(m,[input],assignments,options);assert.deepEqual(p.issues,[]);assert.equal(p.ready,2);
  uid=0;const next=confirmKrakenImport(m,[input],assignments,{...options,confirmed:true,baseline:p.baseline});
  assert.deepEqual(next.positions.map(p=>p.quantityExact),['50','5']);assert.equal(next.bookings.length,2);assert.deepEqual(next.externalCashFlows,[]);
  const normalized=JSON.parse(backup(next));if(!canonical)canonical=normalized;else assert.deepEqual(normalized,canonical);
  const restored=safeImport(normalized),repeat=previewKrakenImport(restored,[input,text],assignments);assert.deepEqual(repeat.issues,[]);assert.equal(repeat.duplicates,2);assert.equal(repeat.ready,0);assert.equal(JSON.stringify(repeat.simulated),JSON.stringify(restored));
 }
 // Import the first source group, then overlapping originals: current holdings
 // include that group, so using it again as an edge would incorrectly rewind history.
 const initial=[header,...rows.slice(0,2)].join('\n'),p=previewKrakenImport(m,[initial],assignments,{openingConfirmed:true});
 const first=confirmKrakenImport(m,[initial],assignments,{openingConfirmed:true,confirmed:true,baseline:p.baseline});
 const mixed=previewKrakenImport(safeImport(JSON.parse(backup(first))),[text,initial],assignments,{openingConfirmed:true});assert.deepEqual(mixed.issues,[]);assert.equal(mixed.duplicates,1);assert.equal(mixed.ready,1);assert.deepEqual(mixed.simulated.positions.map(p=>p.quantityExact),['50','5']);
 const bad=structuredClone(first);bad.bookings[0].notes+=' changed';const blocked=previewKrakenImport(bad,[text],assignments,{openingConfirmed:true});assert.ok(blocked.issues.length);assert.throws(()=>confirmKrakenImport(bad,[text],assignments,{openingConfirmed:true,confirmed:true,baseline:blocked.baseline}),/Ungeklärte/);
 assert.equal(JSON.stringify(m),before);
});
test('729 independently enumerated reference assignments prove contiguity and cycle guards',()=>{
 const starts=new Map([['x',0n],['y',0n]]);let cases=0;
 for(let code=0;code<3**6;code++){
  let value=code;const spec=[];
  for(const stream of ['x','y'])for(let i=0;i<3;i++){spec.push([['A','B','C'][value%3],stream,i,i+1]);value=Math.floor(value/3);}
  const gs=groups(spec),valid=permutations(gs).filter(order=>['x','y'].every(stream=>{
   const sequence=order.flatMap(g=>g.rows.filter(r=>r.streamId===stream));return sequence.every((r,i)=>Number(r.beforeExact)===i&&Number(r.balanceExact)===i+1);
  }));
  let actual,error;try{actual=krakenReferenceOrder(gs,starts);}catch(e){error=e;}
  if(valid.length){assert.ok(!error);assert.deepEqual(actual.map(g=>g.id),valid.map(o=>o.map(g=>g.id)).sort((a,b)=>a.join('').localeCompare(b.join('')))[0]);}
  else assert.ok(error);
  cases++;
 }
 assert.equal(cases,729);
});
test('one existing plus two new timestamp references uses current holdings without replaying the prefix',async()=>{
 const {krakenCSV}=await import('./kraken-ledger-fixture.mjs');
 const text=crossReferenceSource(),[header,...rows]=text.split('\n'),{m,assignments}=fixture(text),initial=[header,...rows.slice(0,2)].join('\n');
 const options={openingConfirmed:true},p=previewKrakenImport(m,[initial],assignments,options),first=confirmKrakenImport(m,[initial],assignments,{...options,confirmed:true,baseline:p.baseline});
 const third=krakenCSV([
  {txid:'SYN-THIRD-EUR',refid:'SYN-THIRD',asset:'EUR',subclass:'fiat',amount:'-10',fee:'0',balance:'40',feecurrency:'EUR'},
  {txid:'SYN-THIRD-ETH',refid:'SYN-THIRD',asset:'ETH',amount:'1',fee:'0',balance:'6',feecurrency:'ETH'}
 ]);
 const preview=previewKrakenImport(first,[third,text],assignments,options);assert.deepEqual(preview.issues,[]);assert.equal(preview.duplicates,1);assert.equal(preview.ready,2);
 const next=confirmKrakenImport(first,[third,text],assignments,{...options,confirmed:true,baseline:preview.baseline});assert.deepEqual(next.positions.map(p=>p.quantityExact),['40','6']);assert.equal(next.bookings.length,3);
});
