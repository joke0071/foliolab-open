import test from 'node:test';
import assert from 'node:assert/strict';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {backup,safeImport} from '../src/model.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {executeTransaction,ledgerQuantityAudit,nextJournalSequence} from '../src/transactions.js';
import {source,fixture,sameAssetSource,crossReferenceSource} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {ledgerModel,ledgerEvidence} from './ledger-live-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
const at='2026-11-03T10:00:00.000Z';
function imported(text=source(),extra={}){
 const {m,assignments}=fixture(text),p=previewKrakenImport(m,[text],assignments,{openingConfirmed:true,...extra});
 assert.deepEqual(p.issues,[]);
 const next=confirmKrakenImport(m,[text],assignments,{baseline:p.baseline,confirmed:true,openingConfirmed:true,...extra});
 return {m,next,text,assignments,ids:p.groups.map(g=>g.id),extra};
}
const options=(f,id=f.ids.at(-1))=>({selectedGroups:[id],openingConfirmed:true,partialConfirmed:true,...f.extra});
function withdraw(f,id){const o=options(f,id),p=previewKrakenWithdrawal(f.next,[f.text],f.assignments,o);return confirmKrakenWithdrawal(f.next,[f.text],f.assignments,{...o,baseline:p.baseline,confirmed:true,at});}
test('independent inverse amounts: cash/trade/distinct and same-asset fees; evidence survives restore and blocks reordered/remapped overlapping reimport',()=>{
 for(const text of [source(),sameAssetSource()]){
  const f=imported(text),before=JSON.stringify(f.next),end=withdraw(f);
  assert.equal(JSON.stringify(f.next),before);
  assert.deepEqual(end.positions.map(p=>p.quantityExact),text===source()?['200','0','0.000001']:['200','0']);
  assert.deepEqual(end.externalCashFlows,[]);assert.equal(end.bookings.length,0);assert.equal(ledgerQuantityAudit(end).ok,true);
  const r=safeImport(JSON.parse(backup(end))),j=r.journalEntries.find(j=>j.type==='uh03-undo');
  assert.equal(j.krakenWithdrawal.count,2);assert.equal(j.sequence,nextJournalSequence(f.next));
  assert.equal(j.krakenWithdrawal.originals[0].booking.importSource.sourceId,'kraken-uh03-v1');
  const [header,...rows]=text.split('\n');
  for(const input of [[text],[text,text],[[header,...rows.reverse()].join('\n')]]){
   const p=previewKrakenImport(r,input,f.assignments,{openingConfirmed:true});
   assert.equal(p.ready,0);assert.match(p.issues[0].message,/dauerhaft/);
   assert.throws(()=>confirmKrakenImport(r,input,f.assignments,{baseline:p.baseline,confirmed:true,openingConfirmed:true}),/Ungeklärte/);
  }
 }
});
test('terminal reference withdrawal retains prefix and blocks removal of consumed predecessor',()=>{
 const f=imported(crossReferenceSource()),first=f.ids[0],last=f.ids[1];
 assert.throws(()=>withdraw(f,first),/Spätere/);
 const end=withdraw(f,last);assert.deepEqual(end.positions.map(p=>p.quantityExact),['100','3']);assert.equal(end.bookings.length,1);
 const p=previewKrakenImport(end,[f.text],f.assignments,{openingConfirmed:true});assert.equal(p.duplicates,1);assert.equal(p.ready,0);assert.equal(p.issues.length,1);
 assert.equal(ledgerQuantityAudit(end).ok,true);assert.equal(end.bookings[0].importSource.fileId,first);
});
test('external cash classification, rewards, principal transfer and fees reverse all legs and flows',()=>{
 const texts=[
  krakenCSV([{type:'deposit',subtype:'',asset:'EUR',subclass:'fiat',amount:'100',fee:'2',balance:'198',feecurrency:'EUR'}]),
  krakenCSV([{type:'withdrawal',subtype:'',asset:'EUR',subclass:'fiat',amount:'-10',fee:'2',balance:'88',feecurrency:'EUR'}]),
  krakenCSV([{type:'earn',subtype:'reward',asset:'ETH',amount:'0.1',fee:'0.01',balance:'1.09',feecurrency:'ETH'}]),
  krakenCSV([{type:'earn',subtype:'autoallocation',wallet:'spot',asset:'ETH',amount:'-2',fee:'0',balance:'1',feecurrency:'ETH'},{type:'earn',subtype:'autoallocation',wallet:'earn',asset:'ETH',amount:'2',fee:'0',balance:'2',feecurrency:'ETH'}])
 ];
 for(const text of texts){const id=prepareKrakenSourcePlan([text]).groups[0].id,f=imported(text,{externalReferences:[id]}),end=withdraw(f);assert.deepEqual(end.positions.map(p=>p.quantityExact),f.m.positions.map(p=>p.quantityExact));assert.deepEqual(end.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(safeImport(JSON.parse(backup(end)))).ok,true);}
});
test('archive cleanup preserves v5 and independent reference archive',()=>{
 for(const reference of [false,true]){
  const f=imported(),btc=ledgerEvidence(ledgerModel()),input={receipts:btc.purchaseEvidence.receipts,operations:[]},protectedModel=confirmUnifiedBitcoin(btc,input,'wallet',{confirmed:true,externalFunding:true,baseline:previewUnifiedBitcoin(btc,input,'wallet').baseline});
  for(const key of ['providers','accounts','positions','openingPositions','bookings','journalEntries','externalCashFlows'])f.next[key].push(...protectedModel[key]);
  f.next.version=5;f.next.purchaseEvidence=protectedModel.purchaseEvidence;f.next.walletHistory=protectedModel.walletHistory;
  if(reference)f.next.snapshots.push({id:'shot',date:'1999-01-01',total:0,totalEURExact:'0',source:'legacy',valuationStatus:'unknown',quoteTimes:[],revisions:[],note:''});
  setArchivePresentation(f.next,{bookingIds:f.next.bookings.filter(b=>b.importSource?.sourceId==='kraken-uh03-v1').map(b=>b.id),referenceIds:reference?['shot']:[]});
  const end=withdraw(f);assert.equal(end.version,5);
  assert.deepEqual(end.bookingPresentation,reference?{version:2,archivedIds:[],referenceArchivedIds:['shot']}:undefined);safeImport(JSON.parse(backup(end)));
 }
});
test('stale approval, missing or partial group, changed payload, manual edits, unknown fields, dependencies and protected basis never mutate',()=>{
 const f=imported(),o=options(f),p=previewKrakenWithdrawal(f.next,[f.text],f.assignments,o),before=JSON.stringify(f.next);
 assert.throws(()=>confirmKrakenWithdrawal(f.next,[f.text],f.assignments,{...o,baseline:'stale',confirmed:true}),/erneut/);
 assert.throws(()=>confirmKrakenWithdrawal(f.next,[f.text],f.assignments,{...o,baseline:p.baseline}),/erneut/);
 assert.throws(()=>previewKrakenWithdrawal(f.next,[f.text],f.assignments,{selectedGroups:[]}),/Genau eine/);
 assert.throws(()=>previewKrakenWithdrawal(f.next,[f.text.replace('0.00000017','0.00000018')],f.assignments,o),/Originalgruppe/);
 for(const change of [
  m=>m.bookings.pop(),m=>{m.bookings[0].notes='manual';},m=>{m.bookings[0].unknownEvidence='unproved';},
  m=>{m.positions[1].costBasisEUR=1;m.positions[1].costBasisExact='1';},
  m=>{m.openingPositions[0].costBasisExact='1';},
  m=>{m.settings.externalEvidence=m.bookings[0].id;},
  m=>{m.bookings[0].transferMatch={id:'manual-match'};},
  m=>{executeTransaction(m,{type:'reward',date:'2026-11-03',positionId:'p1',quantity:'1',unitPrice:'0'});}
 ]){const m=structuredClone(f.next);change(m);const original=JSON.stringify(m);assert.throws(()=>previewKrakenWithdrawal(m,[f.text],f.assignments,o));assert.equal(JSON.stringify(m),original);}
 assert.equal(JSON.stringify(f.next),before);
});
test('tampered persistent withdrawal is rejected on backup and restore; no orphan resurrection',()=>{
 const end=withdraw(imported());
 for(const change of [
  j=>{j.krakenWithdrawal.originals.pop();},j=>{j.krakenWithdrawal.originals[0].booking.quantityExact='999';},
  j=>{j.status='recorded';},j=>{j.krakenWithdrawal.group='f'.repeat(64);},j=>{j.postings[0].quantityDeltaExact='1';},
  j=>{j.krakenWithdrawal.count=1;},j=>{j.source='other';},j=>{j.type='correction';}
 ]){const raw=structuredClone(end);change(raw.journalEntries[0]);assert.throws(()=>backup(raw));assert.throws(()=>safeImport(raw));}
 const raw=structuredClone(end);raw.bookings.push(raw.journalEntries[0].krakenWithdrawal.originals[0].booking);assert.throws(()=>backup(raw));assert.throws(()=>safeImport(raw));
});
