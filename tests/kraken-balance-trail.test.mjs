import test from 'node:test';
import assert from 'node:assert/strict';
import {krakenBalanceTrail,previewKrakenImport,confirmKrakenImport} from '../src/kraken-import.js';
import {units} from '../src/decimal.js';
import {backup,safeImport} from '../src/model.js';
import {sameAssetSource,fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
const rows=edges=>edges.map(([a,b],id)=>({id,beforeExact:String(a),balanceExact:String(b)}));
function brute(edges,start){
 let count=0,path;
 function visit(rest,current,trail){
  if(count===2)return;
  if(!rest.length){count++;path=trail;return;}
  for(const id of rest)if(edges[id][0]===current)visit(rest.filter(i=>i!==id),edges[id][1],[...trail,id]);
 }
 visit(edges.map((_,i)=>i),start,[]);return {count,path};
}
test('production exact trail matches independent exhaustive traversal on 199290 graph/start cases',()=>{
 const all=Array.from({length:9},(_,i)=>[Math.floor(i/3),i%3]);let cases=0;
 for(let n=0;n<=5;n++)for(let code=0;code<9**n;code++){
  let c=code;const edges=[];for(let i=0;i<n;i++){edges.push(all[c%9]);c=Math.floor(c/9);}
  for(let start=0;start<3;start++){
   const expected=brute(edges,start);let actual,error;
   try{actual=krakenBalanceTrail(rows(edges),units(String(start))).map(r=>r.id);}catch(e){error=e;}
   if(expected.count===1)assert.deepEqual(actual,expected.path);
   else {assert.ok(error);assert.match(error.message,expected.count===2?/mehrere vollständige/:/Quellsaldo/);}
   cases++;
  }
 }
 assert.equal(cases,199290);
});
test('global sole trail can branch locally; exact large decimals, 64 bound, loops and isolated cycles',()=>{
 assert.deepEqual(krakenBalanceTrail(rows([[0,2],[1,0],[0,1]]),units('0')).map(r=>r.id),[2,1,0]);
 const base=9007199254740993000000000000000000n,edges=Array.from({length:64},(_,i)=>({id:i,beforeExact:`9007199254740993.${String(i).padStart(18,'0')}`,balanceExact:`9007199254740993.${String(i+1).padStart(18,'0')}`}));
 assert.equal(units(edges[0].beforeExact),base);
 assert.deepEqual(krakenBalanceTrail([...edges].reverse(),base).map(r=>r.id),edges.map(r=>r.id));
 assert.throws(()=>krakenBalanceTrail([...edges,edges[0]],base),/Große Referenzgruppe/);
 assert.throws(()=>krakenBalanceTrail(rows([[0,1],[2,2]]),0n),/Quellsaldo/);
 assert.throws(()=>krakenBalanceTrail(rows([[0,0],[0,0]]),0n),/mehrere vollständige/);
 assert.deepEqual(krakenBalanceTrail(rows([[0,0],[0,1]]),0n).map(r=>r.id),[0,1]);
});
const permutations=([a,b,c])=>[[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
test('all six same-asset fee permutations preserve exact model, canonical journal and overlapping reimport after restore',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-11-03T00:00:00Z')});
 let uid=0;t.mock.method(globalThis.crypto,'randomUUID',()=>`synthetic-posting-${uid++}`);
 const text=sameAssetSource(),{m,assignments}=fixture(text),before=JSON.stringify(m),[header,...lines]=text.split('\n');let canonical;
 for(const linesInOrder of permutations(lines)){
  const input=[header,...linesInOrder].join('\n'),options={openingConfirmed:true};uid=0;
  const p=previewKrakenImport(m,[input],assignments,options);assert.deepEqual(p.issues,[]);
  uid=0;const next=confirmKrakenImport(m,[input],assignments,{...options,confirmed:true,baseline:p.baseline});
  assert.deepEqual(next.positions.map(p=>p.quantityExact),['100','2.99']);assert.equal(next.bookings.length,2);assert.deepEqual(next.externalCashFlows,[]);
  // Compare every serialized financial and identity field; no production calculation is the oracle.
  const normalized=JSON.parse(backup(next));if(!canonical)canonical=normalized;else assert.deepEqual(normalized,canonical);
  const restored=safeImport(normalized),overlap=[header,...lines.slice(1).reverse()].join('\n');
  const repeat=previewKrakenImport(restored,[input,overlap,text],assignments);
  assert.deepEqual(repeat.issues,[]);assert.equal(repeat.duplicates,1);assert.equal(repeat.ready,0);assert.equal(JSON.stringify(repeat.simulated),JSON.stringify(restored));
 }
 assert.equal(JSON.stringify(m),before);
});
test('ambiguous full paths, gaps, changed IDs, wallet/asset mismatch and protected opening never authorize writes',()=>{
 const source=sameAssetSource(),{m,assignments}=fixture(source),[header,...lines]=source.split('\n');
 const ambiguous=krakenCSV([
  {txid:'A',asset:'EUR',subclass:'fiat',amount:'-100',fee:'0',balance:'100',feecurrency:'EUR'},
  {txid:'B',asset:'ETH',amount:'3',fee:'0',balance:'3',feecurrency:'ETH'},
  {txid:'C',asset:'ETH',amount:'0',fee:'0',balance:'3',feecurrency:'ETH'},
  {txid:'D',asset:'ETH',amount:'0',fee:'0',balance:'3',feecurrency:'ETH'}
 ]);
 const cases=[ambiguous,source.replace('2.99','2.98'),source+'\n'+lines[2].replace('0.01','0.02'),source.replaceAll(',spot,',',earn,'),source.replaceAll(',ETH,',',SOL,')];
 for(const text of cases){const before=JSON.stringify(m),p=previewKrakenImport(m,[text],assignments,{openingConfirmed:true});assert.ok(p.issues.length);assert.throws(()=>confirmKrakenImport(m,[text],assignments,{openingConfirmed:true,confirmed:true,baseline:p.baseline}),/Ungeklärte/);assert.equal(JSON.stringify(m),before);}
 const protectedModel=structuredClone(m);protectedModel.openingPositions[0].costBasisExact='200';
 assert.match(previewKrakenImport(protectedModel,[source],assignments,{openingConfirmed:true}).issues[0].message,/Kostenbasis/);
 const dated=structuredClone(m);dated.openingPositions[0].asOf='2000-01-01';assert.match(previewKrakenImport(dated,[source],assignments,{openingConfirmed:true}).issues[0].message,/Datierter Anfangsbestand/);
 assert.throws(()=>confirmKrakenImport(m,[source],assignments,{openingConfirmed:true,confirmed:true,baseline:'stale'}),/erneut/);
});
