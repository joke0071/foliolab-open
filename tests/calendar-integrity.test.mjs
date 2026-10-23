import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,safeImport} from '../src/model.js';

const valid=()=>structuredClone(blankModel());

test('Restoring a backup rejects impossible snapshot calendar dates',()=>{
 const m=valid();
 m.snapshots.push({id:'day-1',date:'2026-02-30',total:120,totalEURExact:'120'});
 assert.throws(()=>safeImport(m),/Stichtag|Datum/);
});

test('Restoring a backup rejects impossible transaction calendar dates',()=>{
 const m=valid();
 m.bookings.push({id:'booking-1',positionId:'asset-1',date:'2026-02-30',type:'buy',quantity:1});
 assert.throws(()=>safeImport(m),/Buchung|Datum/);
});

test('Restoring a backup rejects impossible external cashflow calendar dates',()=>{
 const m=valid();
 m.externalCashFlows.push({id:'flow-1',date:'2026-02-30',amountEUR:100,amountExactEUR:'100'});
 assert.throws(()=>safeImport(m),/Cashflow|Datum/);
});

test('A valid leap-day remains importable',()=>{
 const m=valid();
 m.snapshots.push({id:'leap',date:'2024-02-29',total:120,totalEURExact:'120'});
 assert.equal(safeImport(m).snapshots[0].date,'2024-02-29');
});
