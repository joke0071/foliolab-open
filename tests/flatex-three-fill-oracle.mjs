import assert from 'node:assert/strict';
import {ledgerQuantityAudit} from '../src/transactions.js';
export function assertThreeOracle(m,c){
 assert.equal(m.bookings.length,4);assert.equal(m.journalEntries.length,4);assert.equal(m.journalEntries.flatMap(j=>j.postings).length,9);assert.equal(m.externalCashFlows.length,0);
 assert.equal(m.positions.find(p=>p.id==='etf').quantityExact,c.end.asset);assert.equal(m.positions.find(p=>p.id==='cash').quantityExact,c.end.cash);
 for(const expected of c.members){
  const b=m.bookings.find(b=>b.netMember===expected.role);assert.ok(b);assert.equal(b.netSettlement.version,3);assert.equal(JSON.parse(b.importSource.sourcePayload).version,3);assert.equal(b.date,c.date);assert.equal(b.netSettlement.valueDate,c.valueDate);
  for(const k of ['grossExact','quantityExact','cashExact','differenceExact'])assert.equal(b.netSettlement[k],c[k]);
  const j=m.journalEntries.find(j=>j.id===b.journalEntryId);assert.deepEqual(j.postings.map(p=>({role:p.role,quantityDeltaExact:p.quantityDeltaExact,amountBookEURExact:p.amountBookEURExact})),expected.postings);
  assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);
 }
 const asset=m.positions.find(p=>p.id==='etf');for(const key of ['costBasisExact','costBasisEUR','realizedPnLExact','realizedPnLEUR'])assert.equal(asset[key]??null,null);
 assert.equal(ledgerQuantityAudit(m).ok,true);
}
