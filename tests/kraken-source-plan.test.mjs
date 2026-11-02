import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
const trade=()=>krakenCSV([
 {txid:'SYN-EUR',asset:'EUR',subclass:'fiat',amount:'-120',fee:'0',balance:'80',feecurrency:'EUR'},
 {txid:'SYN-ETH',asset:'ETH',amount:'0.04',fee:'0',balance:'0.04',feecurrency:'ETH'},
 {txid:'SYN-FEE',asset:'BTC',amount:'0',fee:'0.00000017',balance:'0.00000083',feecurrency:'BTC'}
]);
test('three-leg trade retains zero-amount crypto fee as an independent exact movement',()=>{
 const p=prepareKrakenSourcePlan([trade()]);assert.equal(p.groups.length,1);
 const g=p.groups[0];assert.equal(g.kind,'exchange');assert.deepEqual(g.issues,[]);assert.equal(g.rows.length,3);
 assert.deepEqual(g.movements.map(m=>[m.asset,m.amountExact,m.feeExact,m.deltaExact]),[['EUR','-120','0','-120'],['ETH','0.04','0','0.04'],['BTC','0','0.00000017','-0.00000017']]);
 assert.deepEqual(g.rows.map(r=>r.beforeExact),['200','0','0.000001']);
 assert.equal(g.outgoing.length,1);assert.equal(g.incoming.length,1);
});
test('overlap deduplicates only identical Ledger IDs, and changed fields conflict across files',()=>{
 const a=prepareKrakenSourcePlan([trade(),trade()]);assert.equal(a.groups[0].rows.length,3);assert.equal(a.repeated,3);assert.equal(a.conflicts,0);assert.deepEqual(a.groups[0].issues,[]);
 const b=prepareKrakenSourcePlan([trade(),trade().replace('0.00000017','0.00000018')]);assert.equal(b.conflicts,1);assert.match(b.groups[0].issues.join(' '),/widersprüchliche/);
});
test('same refid across distinct ledger IDs keeps all fills and refuses guessed two-leg execution',()=>{
 const p=prepareKrakenSourcePlan([krakenCSV([{txid:'SYN-A',amount:'1',fee:'0'},{txid:'SYN-B',amount:'1',fee:'0'},{txid:'SYN-C',asset:'EUR',amount:'-20',fee:'0',feecurrency:'EUR'}])]);
 assert.equal(p.observations.length,3);assert.equal(p.groups[0].kind,'unresolved');assert.match(p.groups[0].issues.join(' '),/nicht eindeutig/);
});
test('reordered identical source legs retain stable group payload and identities',()=>{
 const text=trade().split('\n'),a=prepareKrakenSourcePlan([text.join('\n')]),b=prepareKrakenSourcePlan([[text[0],...text.slice(1).reverse()].join('\n')]);
 assert.equal(a.groups[0].payloadDigest,b.groups[0].payloadDigest);assert.equal(a.groups[0].id,b.groups[0].id);
});
test('allocation is principal transfer, reward is distinct, mismatched amounts remain unresolved',()=>{
 const make=q=>krakenCSV([{type:'earn',subtype:'autoallocation',wallet:'spot',amount:'-2',fee:'0'},{type:'earn',subtype:'autoallocation',wallet:'earn',amount:q,fee:'0'}]);
 assert.equal(prepareKrakenSourcePlan([make('2')]).groups[0].kind,'internal-transfer');assert.equal(prepareKrakenSourcePlan([make('1.9')]).groups[0].kind,'unresolved');
 assert.equal(prepareKrakenSourcePlan([krakenCSV([{type:'earn',subtype:'reward',amount:'0.000000000000000001',fee:'0'}])]).groups[0].kind,'reward');
});
test('unknown or contradictory fee asset cannot acquire an invented zero or EUR fee',()=>{
 for(const values of [{fee:''},{fee:'0.1',feecurrency:'USD'}]){
  const p=prepareKrakenSourcePlan([krakenCSV([values])]);assert.ok(p.groups[0].issues.length);assert.equal('feeEUR' in p.groups[0],false);
 }
 const p=prepareKrakenSourcePlan([krakenCSV([{fee:''}])]);assert.equal(p.groups[0].movements[0].deltaExact,null);
});

test('a declared zero fee needs no invented denomination, while an absent fee stays unknown',()=>{
 const text=trade().replace('80,500,0.5,500,EUR','80,500,0.5,500,');
 const a=prepareKrakenSourcePlan([text]);assert.deepEqual(a.groups[0].issues,[]);assert.equal(a.groups[0].rows[0].values.feecurrency,'');assert.equal(a.groups[0].rows[0].feeExact,'0');
 const b=prepareKrakenSourcePlan([krakenCSV([{fee:'',feecurrency:''}])]);assert.ok(b.groups[0].issues.length);assert.equal(b.observations[0].feeExact,null);
});
