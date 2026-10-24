import test from 'node:test';
import assert from 'node:assert/strict';
import {xirr,twr,modifiedDietz} from '../src/performance.js';
const flows=amounts=>amounts.map((amount,i)=>({date:`${2021+i}-01-01`,amount}));
test('XIRR does not choose one of three roots (-50%, 0%, 100% approximately)',()=>{
 assert.equal(xirr(flows([-100,350,-350,100])),null);
});
test('Same-day offsetting flows have no defined annual return',()=>{
 assert.equal(xirr([{date:'2025-01-01',amount:-100},{date:'2025-01-01',amount:100}]),null);
});
test('XIRR rejects missing amounts and invalid calendar dates rather than coercing them',()=>{
 for(const amount of [null,'',false,undefined])assert.equal(xirr([...flows([-100,110]),{date:'2021-06-01',amount}]),null);
 assert.equal(xirr([{date:'2025-02-30',amount:-100},{date:'2026-02-28',amount:110}]),null);
});
test('Negative returns and same-day netting use independent endpoint arithmetic',()=>{
 const rows=[{date:'2025-01-01',amount:-100},{date:'2025-01-01',amount:-50},{date:'2025-01-01',amount:50},{date:'2026-01-01',amount:80}];
 assert.ok(Math.abs(xirr(rows)-(Math.pow(.8,365.25/365)-1))<1e-9);
 assert.equal(xirr(flows([-100,-10])),null);
 assert.ok(Math.abs(twr([{start:100,end:80}])+.2)<1e-12);
});
test('Unspecified cashflows and arithmetic overflow never become a return',()=>{
 assert.equal(modifiedDietz({start:100,end:110}),null);
 assert.equal(twr([{start:Number.MIN_VALUE,end:Number.MAX_VALUE}]),null);
 assert.equal(modifiedDietz({start:1,end:Number.MAX_VALUE,netFlowEUR:-Number.MAX_VALUE,weightedFlowEUR:0}),null);
});
