import test from 'node:test';
import assert from 'node:assert/strict';
import {validCalendarDate} from '../src/calendar-date.js';
import {validateJournalEntry} from '../src/transactions.js';
import {blankModel,createProvider,createPosition,safeImport} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
test('strict Gregorian month lengths and leap centuries agree across financial calendar boundaries',()=>{
 const years=[0,1,4,99,100,400,999,1582,1600,1700,1800,...Array.from({length:203},(_,i)=>1899+i),2400,9999];
 for(const y of years)for(let month=0;month<=13;month++)for(const day of [0,1,28,29,30,31,32]){
  const leap=y%4===0&&(y%100!==0||y%400===0),lengths=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  const value=String(y).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'),expected=month>=1&&month<=12&&day>=1&&day<=lengths[month-1];
  assert.equal(validCalendarDate(value),expected,value);
 }
});
test('cache pressure and reuse do not normalize invalid or non-calendar input',()=>{
 const bad=['2024-2-01','2024-01-1','2024-01-01T00:00:00Z',' 2024-01-01','2024-01-01 ',20240101,null,undefined,true,{},'x'.repeat(100000)];
 for(const v of bad)assert.equal(validCalendarDate(v),false);
 assert.equal(validCalendarDate('2000-02-29'),true);assert.equal(validCalendarDate('1900-02-29'),false);
 for(let n=0;n<16410;n++)assert.equal(validCalendarDate(new Date(Date.UTC(1970,0,1+n)).toISOString().slice(0,10)),true);
 assert.equal(validCalendarDate('2000-02-29'),true);assert.equal(validCalendarDate('1900-02-29'),false);
});
const journal=date=>({id:'j',date,postings:[{id:'p1',role:'cash',quantityDeltaExact:'1',amountBookEURExact:'1'},{id:'p2',role:'external-clearing',quantityDeltaExact:null,amountBookEURExact:'-1'}]});
test('a reused valid date grants no journal clearance; original journal year restriction remains',()=>{
 for(const date of ['1900-01-01','2000-02-29','2099-12-31']){assert.equal(validCalendarDate(date),true);validateJournalEntry(journal(date));const invalid=journal(date);invalid.postings[1].amountBookEURExact='0';assert.throws(()=>validateJournalEntry(invalid),/ausgeglichen/);}
 for(const date of ['1899-12-31','2100-01-01','9999-01-01']){assert.equal(validCalendarDate(date),true);assert.throws(()=>validateJournalEntry(journal(date)),/ungültig/);}
});
test('backup restore still rejects corrupt booking, journal and flow dates after a valid cached day',()=>{
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.positions.push(createPosition({id:'cash',providerId:'p',name:'Synthetic',kind:'cash',quantity:100,price:1},m));executeTransaction(m,{positionId:'cash',date:'2024-02-29',type:'deposit',quantity:1});assert.ok(safeImport(structuredClone(m)));
 for(const field of ['bookings','journalEntries','externalCashFlows']){const invalid=structuredClone(m);invalid[field][0].date='2023-02-29';assert.throws(()=>safeImport(invalid));}assert.equal(m.bookings[0].date,'2024-02-29');
});
