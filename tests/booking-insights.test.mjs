import test from 'node:test';
import assert from 'node:assert/strict';
import {bookedIncomeSummary} from '../src/booking-insights.js';

test('breaks out booked income and deductions without counting sales or deposits',()=>{
 const result=bookedIncomeSummary([
  {type:'dividend',amountEUR:120},
  {type:'interest',amountEUR:8},
  {type:'fee',amountEUR:3},
  {type:'tax',amountEUR:31},
  {type:'sell',amountEUR:500},
  {type:'deposit',amountEUR:2000}
 ]);
 assert.equal(result.income,128);
 assert.equal(result.deductions,34);
 assert.equal(result.net,94);
 assert.equal(result.counts.dividend,1);
});
test('rejects missing and invalid EUR amounts instead of constructing false data',()=>{
 const result=bookedIncomeSummary([{type:'dividend',amountEUR:null},{type:'tax',amountEUR:-3},{type:'fee',amountEUR:Infinity}]);
 assert.equal(result.net,0);
 assert.equal(result.unavailable,2);
});
