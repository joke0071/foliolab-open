import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel} from '../src/model.js';
import {transferDialogChoices} from '../src/transfer-matching-ui.js';
import {previewTransferMatch,confirmTransferMatch} from '../src/transactions.js';
import {transferFixture} from './transfer-matching-fixture.mjs';
const ids=rows=>rows.map(b=>b.id);
test('Empty model and asset/wallet movements do not pretend to be own cash choices',()=>{
 const m=blankModel();assert.deepEqual(transferDialogChoices(m),{outgoing:[],out:null,incoming:[],hasOwnCash:false});
 const a=transferFixture();for(const p of a.positions)p.kind='crypto';assert.equal(transferDialogChoices(a).outgoing.length,0);assert.equal(transferDialogChoices(a).hasOwnCash,false);
 const b=transferFixture();for(const p of b.positions)p.wallet={enabled:true};assert.equal(transferDialogChoices(b).outgoing.length,0);
});
test('Own cash split choices are listed, but never selected or economically matched automatically',()=>{
 const m=transferFixture(),before=JSON.stringify(m);assert.deepEqual(ids(transferDialogChoices(m).outgoing),['out']);assert.deepEqual(transferDialogChoices(m).incoming,[]);
 const c=transferDialogChoices(m,'out');assert.deepEqual(ids(c.incoming),['in2','in']);assert.equal(c.out.id,'out');assert.equal(JSON.stringify(m),before);
});
test('Already confirmed groups remain outside open choices through the existing matching engine',()=>{
 const m=transferFixture();confirmTransferMatch(m,{...previewTransferMatch(m,'out',['in2','in']),reference:'Synthetic checked receipt',confirmed:true});
 assert.deepEqual(transferDialogChoices(m).outgoing,[]);assert.equal(transferDialogChoices(m).hasOwnCash,true);
});
test('Same account, different currency and more than seven days are not incoming choices',()=>{
 const m=transferFixture();m.positions[1].accountId=m.positions[0].accountId;assert.deepEqual(ids(transferDialogChoices(m,'out').incoming),['in2']);
 const n=transferFixture();n.positions[1].currency='USD';assert.deepEqual(ids(transferDialogChoices(n,'out').incoming),['in2']);
 const o=transferFixture();o.bookings.find(b=>b.id==='in').date='2026-01-09';assert.deepEqual(ids(transferDialogChoices(o,'out').incoming),['in2']);
});
test('Exactly seven days is included, with no amount-based pairing',()=>{
 const m=transferFixture();m.bookings.find(b=>b.id==='in').date='2026-01-08';m.bookings.find(b=>b.id==='in').quantityExact='999';assert.deepEqual(ids(transferDialogChoices(m,'out').incoming),['in2','in']);
});
test('Missing or ambiguous account ownership is not presented as own cash',()=>{
 const m=transferFixture();m.accounts=[];assert.equal(transferDialogChoices(m).hasOwnCash,false);assert.deepEqual(transferDialogChoices(m).outgoing,[]);
 const n=transferFixture();n.accounts[0].providerId='unrelated';assert.deepEqual(transferDialogChoices(n).outgoing,[]);
});
test('Choice availability does not bypass existing journal/fee/cashflow proof checks',()=>{
 const m=transferFixture();m.bookings.find(b=>b.id==='out').external=false;assert.equal(transferDialogChoices(m).outgoing.length,1);const p=previewTransferMatch(m,'out',['in2','in']);assert.equal(p.ready,false);assert.equal(p.reasons[0],'Externe Ausgangsklassifikation nicht eindeutig belegt.');
});
test('Frozen input remains untouched even with multiple accounts and repeated rendering',()=>{
 const m=transferFixture(),before=JSON.stringify(m);const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}};freeze(m);
 for(let i=0;i<3;i++)assert.deepEqual(ids(transferDialogChoices(m,'out').incoming),['in2','in']);assert.equal(JSON.stringify(m),before);
});
