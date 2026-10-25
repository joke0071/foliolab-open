import test from 'node:test';
import assert from 'node:assert/strict';
import {historyFixture} from './booking-history-fixture.mjs';
import {bookingHistoryRows,positionHistory,historyAction} from '../src/booking-history.js';
import {bookingRowMarkup} from '../src/booking-history-ui.js';
import {safeImport,backup} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
const {model,ids,accountB}=historyFixture();
test('245 trades + four corrections: signed journal deltas and exact gross volume without writes',()=>{
 const before=JSON.stringify(model),rows=bookingHistoryRows(model);
 assert.equal(rows.length,249);assert.equal(rows.filter(b=>b.technical).length,4);
 for(const row of rows.filter(b=>b.technical)){assert.equal(row.deltaExact,'2');assert.equal(row.tradeExactEUR,null);}
 assert.equal(ids.map(id=>Number(positionHistory(model,id).grossBuysExactEUR)).reduce((a,b)=>a+b,0),24500);
 const h=positionHistory(model,ids[0]);assert.equal(h.events[0].balanceExact,'64');assert.equal(h.events.length,63);
 assert.equal(JSON.stringify(model),before);
});
test('missing correction journal yields unknown movement, never replacement quantity',()=>{
 const m=structuredClone(model);m.journalEntries=m.journalEntries.filter(e=>e.type!=='correction');
 assert.equal(bookingHistoryRows(m).find(b=>b.type==='correction').deltaExact,null);
 assert.ok(positionHistory(m,ids[0]).events.every(e=>e.balanceExact===null));
});
test('orphan technical journal entries remain visible exactly once',()=>{
 const m=structuredClone(model);m.bookings=m.bookings.filter(b=>b.type!=='correction');
 const rows=bookingHistoryRows(m);assert.equal(rows.length,249);
 assert.equal(rows.filter(b=>b.technical&&b.deltaExact==='2').length,4);
});
test('same ISIN at a separate account never leaks into the timeline',()=>{
 const m=structuredClone(model);m.positions.push({...m.positions[0],id:'other',accountId:accountB.id});
 m.bookings.push({id:'other-buy',date:'2026-01-01',type:'buy',positionId:'other',quantityExact:'10',amountExactEUR:'9999'});
 assert.equal(positionHistory(m,ids[0]).grossBuysExactEUR,'6200');
});
test('unknown fees and opening history do not imply net profit or historical price',()=>{
 const m=structuredClone(model);delete m.openingPositions;const buy=m.bookings.find(b=>b.type==='buy');buy.amountExactEUR=null;buy.amountEUR=null;
 const h=positionHistory(m,buy.positionId);assert.equal(h.unknownBuys,1);assert.ok(h.events.every(e=>e.balanceExact===null));
 assert.equal(h.events[0].marketValue,undefined);
});
test('historical preview survives old portable JSON restore, wallet state unchanged',()=>{
 const restored=safeImport(JSON.parse(backup(model)));
 assert.deepEqual(positionHistory(restored,ids[0]),positionHistory(model,ids[0]));
 assert.equal(restored.walletHistory,model.walletHistory);
});
test('history actions use only supported chains and actual saved sessions',()=>{
 const p={id:'w',wallet:{enabled:true,chain:'evm',chainId:1}};
 assert.equal(historyAction(model,p).label,'Historie rekonstruieren');
 const m={...model,walletHistory:{sessions:[{id:'wallet-history:w'}]}};
 assert.equal(historyAction(m,p).label,'Historie anzeigen');
 assert.equal(historyAction(m,{...p,wallet:{...p.wallet,chainId:43114}}),null);
 assert.equal(historyAction(model,model.positions[0]).label,'Historie anzeigen');
});
test('details escape notes and IDs; correction has no trade value',()=>{
 const row=bookingHistoryRows(model).find(b=>b.id==='trade-0'),html=bookingRowMarkup(row,model);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/<details/);
 const technical=bookingRowMarkup(bookingHistoryRows(model)[0],model);assert.match(technical,/Kein Handel/);assert.match(technical,/\+2/);
});
test('sales and reverse corrections keep signed deltas out of gross purchases',()=>{
 const m=structuredClone(model);
 executeTransaction(m,{id:'sale',type:'sell',date:'2026-02-01',positionId:ids[0],quantity:'3',unitPrice:'120'});
 executeTransaction(m,{id:'reduce',type:'correction',date:'2026-02-02',positionId:ids[0],targetQuantity:'60'});
 const h=positionHistory(m,ids[0]);
 assert.equal(h.events.find(b=>b.id==='sale').deltaExact,'-3');
 assert.equal(h.events.find(b=>b.id==='reduce').deltaExact,'-1');
 assert.equal(h.grossBuysExactEUR,'6200');assert.equal(h.events[0].balanceExact,'60');
});
