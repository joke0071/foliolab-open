import test from 'node:test';import assert from 'node:assert/strict';
import {bookingRowActionReasons,bookingRowsActionReasons,previewBookingChange} from '../src/booking-management.js';
import {transferFixture} from './transfer-matching-fixture.mjs';
export const cases=[
 ['healthy',m=>{}],['missing booking',m=>m.bookings.shift()],['missing journal',m=>m.journalEntries.shift()],['missing position',m=>m.positions.shift()],
 ['duplicate booking id',m=>m.bookings.unshift({...structuredClone(m.bookings[0]),notes:'first wins'})],['shared journal',m=>m.bookings.push({...structuredClone(m.bookings[0]),id:'duplicate-journal'})],
 ['first duplicate journal wins',m=>m.journalEntries.unshift({...structuredClone(m.journalEntries[0]),source:'csv'})],['first duplicate position wins',m=>m.positions.unshift({...structuredClone(m.positions[0]),wallet:{enabled:true}})],
 ['import fingerprint',m=>m.bookings[0].importFingerprint='synthetic:fingerprint'],['import source',m=>m.bookings[0].importSource='SYNTHETIC CSV'],['unknown source',m=>m.journalEntries[0].source='unknown'],
 ['matched booking',m=>m.bookings[0].transferMatch={id:'synthetic-match'}],['target position',m=>m.bookings[0].targetPositionId=m.positions[1].id],['matched journal',m=>m.journalEntries[0].status='matched-internal-transfer'],
 ['wallet enabled',m=>m.positions[0].wallet={enabled:true}],['wallet xpub',m=>m.positions[0].wallet={xpub:'synthetic-public'}],['represented position',m=>m.positions[0].representedByPositionId=m.positions[1].id],['liability',m=>m.positions[0].valuationMode='liability'],
 ['journal date conflict',m=>m.journalEntries[0].date='2026-01-02'],['journal type conflict',m=>m.journalEntries[0].type='deposit'],['unknown booking field',m=>m.bookings[0].syntheticDependency='x'],['unknown journal field',m=>m.journalEntries[0].syntheticDependency='x'],['unknown posting field',m=>m.journalEntries[0].postings[0].syntheticDependency='x'],
 ['missing recorded state',m=>m.journalEntries[0].status='unknown'],['external classification',m=>m.bookings[0].external=false],['foreign currency',m=>m.positions[0].currency='USD'],['noncash',m=>m.positions[0].kind='crypto'],['fee',m=>m.bookings[0].feeEUR=1],['tax',m=>m.bookings[0].taxEUR=1],['countercash',m=>m.bookings[0].cashPositionId=m.positions[1].id],
 ['invalid exact amount',m=>m.bookings[0].quantityExact='invalid'],['zero quantity',m=>m.bookings[0].quantityExact='0'],['quantity conflict',m=>m.bookings[0].quantity=999],['account conflict',m=>m.bookings[0].accountId=m.accounts[1].id],['posting conflict',m=>m.journalEntries[0].postings[0].amountBookEURExact='0'],
 ['missing cash flow',m=>m.externalCashFlows.shift()],['duplicate cash flow',m=>m.externalCashFlows.push(structuredClone(m.externalCashFlows[0]))],['flow date conflict',m=>m.externalCashFlows[0].date='2026-01-02'],['flow amount conflict',m=>m.externalCashFlows[0].amountExactEUR='999'],
 ['later checkpoint',m=>m.snapshots.push({id:'synthetic-later',date:'2026-01-04',total:1000})],['legacy journal link absent',m=>delete m.bookings[0].journalEntryId],['undefined journal identity',m=>{delete m.bookings[0].journalEntryId;delete m.journalEntries[0].id;}]
];
test('batch row hints exactly preserve ordered fresh legacy reasons, including ambiguity and invalid evidence',()=>{
 for(const [label,change] of cases){const m=transferFixture(),originalIds=m.bookings.map(b=>b.id);change(m);const ids=[...originalIds,'absent'],before=JSON.stringify(m),actual=bookingRowsActionReasons(m,ids);for(const id of ids)assert.deepEqual(actual.get(id),bookingRowActionReasons(m,id),label+' '+id);assert.equal(JSON.stringify(m),before,label+' is read-only');}
});
test('row indices do not survive a subsequent call or grant economic permissions',()=>{
 const m=transferFixture(),ids=m.bookings.map(b=>b.id),initial=bookingRowsActionReasons(m,ids);assert.deepEqual(initial.get('out').remove,[]);
 m.externalCashFlows.push(structuredClone(m.externalCashFlows[0]));const changed=bookingRowsActionReasons(m,ids);assert.ok(changed.get('out').remove.some(r=>r.includes('Kapitalfluss')));assert.deepEqual(initial.get('out').remove,[],'prior result is an immutable observation, not a live cache');assert.deepEqual(changed.get('out'),bookingRowActionReasons(m,'out'));
 const before=JSON.stringify(m);assert.throws(()=>previewBookingChange(m,{ids:['out'],action:'remove',reason:'SYNTHETIC'}),/Doppelte oder leere ID/,'fresh complete action validation still rejects ambiguous canonical data');assert.equal(JSON.stringify(m),before);
 assert.deepEqual([...bookingRowsActionReasons(m,[])],[]);
});
