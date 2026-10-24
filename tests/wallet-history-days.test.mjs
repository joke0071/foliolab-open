import test from 'node:test';import assert from 'node:assert/strict';
import {historyDays,rawQuantity} from '../src/wallet-history-days.js';
import {event,stream} from './wallet-history-fixtures.mjs';
test('WH05 day checkpoints retain exact amounts, unknown coverage and UTC boundary',()=>{
 const events=[event({timestamp:'2026-10-23T23:59:59.000Z',quantityBaseUnits:'2'}),event({txid:'two',timestamp:'2026-10-24T00:00:00.000Z',blockHeight:'11',blockHash:'block-11'})];
 const s=stream({throughBlock:'11',coverage:{...stream().coverage,toBlock:'11',tipHash:'block-11'}}),session={events,streams:[s]},before=JSON.stringify(session);
 const rows=historyDays(session);assert.deepEqual(rows.map(r=>r.quantityBaseUnits),['2','3']);assert.deepEqual(rows.map(r=>r.date),['2026-10-23','2026-10-24']);assert.equal(JSON.stringify(session),before);
 assert.equal(historyDays({...session,streams:[{...s,opening:null}]}).every(r=>r.quantityBaseUnits===null),true);
 assert.equal(historyDays(session,{limit:1}).length,1);assert.equal(rawQuantity('7',24),'0.000000000000000000000007');assert.equal(rawQuantity(null,18),'Unbekannt');
});
