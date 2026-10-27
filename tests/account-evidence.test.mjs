import test from 'node:test';
import assert from 'node:assert/strict';
import {accountEvidenceRows} from '../src/account-evidence.js';
import {fixture,csv,preview} from './p0-import-fixture.mjs';
import {importCSV} from '../src/csv-import.js';
const now=Date.parse('2026-10-27T12:00:00Z');
const position=(id,accountId='a',providerId='p',extra={})=>({id,accountId,providerId,kind:'etf',isin:'AT0000000001',quantityExact:'1',priceExact:'100',...extra});
function model(){return {accounts:[{id:'a',providerId:'p'},{id:'b',providerId:'q'},{id:'empty',providerId:'p'}],positions:[position('x'),position('y','b','q',{archived:true})],bookings:[],openingPositions:[]};}
test('same instrument in different providers and archived accounts remains separate; reads preserve exact model',()=>{
 const m=model(),before=JSON.stringify(m),rows=accountEvidenceRows(m,now);
 assert.deepEqual(rows.map(r=>[r.accountId,r.positions,r.archived,r.openingAbsent]),[['a',1,0,1],['b',1,1,1],['empty',0,0,0]]);assert.equal(JSON.stringify(m),before);
 m.positions.push(position('wrong','a','q'));assert.equal(accountEvidenceRows(m,now)[0].positions,1);
});
test('existing quote rules retain missing and stale evidence, with no warning for deliberate manual or zero holdings',()=>{
 const m=model();m.positions.push(position('missing','a','p',{priceExact:'0'}),position('old','a','p',{quoteAsOf:'2026-01-01'}),position('zero','a','p',{quantityExact:'0',priceExact:'0'}));
 assert.equal(accountEvidenceRows(m,now)[0].quoteReview,2);assert.equal(accountEvidenceRows(m,now)[1].quoteReview,0);
});
test('opening dates and missing trade costs remain distinct from invented historical valuations',()=>{
 const m=model();m.openingPositions=[{positionId:'x',quantityExact:'1',asOf:null},{positionId:'y',quantityExact:'1',asOf:'2026-01-01'}];
 m.bookings=[{id:'b1',positionId:'x',type:'buy',feeEUR:null,taxEUR:0},{id:'b2',positionId:'x',type:'sell',feeEUR:0,taxEUR:0},{id:'b3',positionId:'y',type:'buy',feeEUR:0,taxEUR:0,costsVerified:false}];
 const rows=accountEvidenceRows(m,now);assert.equal(rows[0].openingUndated,1);assert.equal(rows[1].openingUndated,0);assert.equal(rows[0].openingAbsent,0);assert.equal(rows[0].tradeCostsUnknown,1);assert.equal(rows[1].tradeCostsUnknown,1);assert.ok(!JSON.stringify(rows).includes('costBasis'));
});
test('source namespaces and explicit transfer assignments count evidence without matching transactions',()=>{
 const m=model();m.positions.push(position('cash','a','p',{kind:'cash'}));m.bookings=[{id:'d',positionId:'cash',type:'deposit',importSource:{version:1,accountId:'a',sourcePayload:'SECRET'}},{id:'w',positionId:'cash',type:'withdraw',transferMatch:{id:'confirmed'}},{id:'other',positionId:'x',type:'buy',importSource:{version:1,accountId:'b'}}];
 const before=JSON.stringify(m),rows=accountEvidenceRows(m,now);assert.equal(rows[0].cash,1);assert.equal(rows[0].imported,1);assert.equal(rows[0].unmatchedCashMovements,1);assert.equal(rows[1].imported,0);assert.ok(!JSON.stringify(rows).includes('SECRET'));assert.equal(JSON.stringify(m),before);
});
test('real canonical CSV imports use importSource rather than a guessed alternate field',()=>{
 const m=fixture();importCSV(m,preview(m,csv('native-identity')));const before=JSON.stringify(m),rows=accountEvidenceRows(m,now);
 assert.equal(rows.reduce((n,r)=>n+r.imported,0),1);assert.equal(rows.reduce((n,r)=>n+r.unmatchedCashMovements,0),1);assert.equal(JSON.stringify(m),before);
});
test('multiple history symptoms count a position once and do not leak raw provider errors',()=>{
 const m=model();m.positions[0].wallet={enabled:true,chain:'evm',chainId:1};m.walletHistory={sessions:[{id:'wallet-history:x',walletKey:'x',streams:[{coverage:{status:'partial'}}],issues:['archive-gap https://rpc.test/SECRET']}],pending:[{id:'wallet-history:x',walletKey:'x',updatedAt:'2026-10-26'}]};
 const rows=accountEvidenceRows(m,now);assert.equal(rows[0].historyReview,1);assert.equal(rows[1].historyReview,0);assert.ok(!JSON.stringify(rows).includes('SECRET'));
});
