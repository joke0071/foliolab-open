import test from 'node:test';import assert from 'node:assert/strict';
import {transferDialogChoices} from '../src/transfer-matching-ui.js';
import {transferFixture} from './transfer-matching-fixture.mjs';
import {previewTransferMatch} from '../src/transactions.js';
test('incoming booking narrows outgoing candidates without amount proof or model mutation',()=>{
 const m=transferFixture(),before=JSON.stringify(m),r=transferDialogChoices(m,'','in');assert.deepEqual(r.outgoing.map(b=>b.id),['out']);assert.equal(r.out,null);assert.deepEqual(r.incoming,[]);
 const selected=transferDialogChoices(m,'out','in');assert.deepEqual(selected.incoming.map(b=>b.id),['in2','in']);assert.equal(JSON.stringify(m),before);
 m.bookings.find(b=>b.id==='in').quantityExact='999';assert.equal(transferDialogChoices(m,'','in').outgoing.length,1,'amount is no evidence for UI pairing');assert.equal(previewTransferMatch(m,'out',['in','in2']).ready,false,'existing financial proof stays authoritative');
});
test('incoming contexts exclude foreign currencies, same accounts, distant days and missing identities',()=>{
 for(const mutate of [m=>m.positions[1].currency='USD',m=>m.positions[1].accountId=m.positions[0].accountId,m=>m.bookings.find(b=>b.id==='in').date='2026-01-09',m=>m.positions[1].wallet={enabled:true}]){const m=transferFixture();mutate(m);assert.equal(transferDialogChoices(m,'','in').outgoing.length,0);}
 assert.equal(transferDialogChoices(transferFixture(),'','missing').outgoing.length,0);assert.equal(transferDialogChoices(transferFixture(),'','out').outgoing.length,0);
});
