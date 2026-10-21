import test from 'node:test';import assert from 'node:assert/strict';
import {units,exact,mul,div,preciseValue} from '../src/decimal.js';
import {xirr,twr,modifiedDietz} from '../src/performance.js';
test('Fixed-point arithmetic avoids binary floating-point loss',()=>{assert.equal(exact(units('0.1')+units('0.2')),'0.3');assert.equal(exact(mul(units('0.1'),units('0.2'))),'0.02');assert.equal(exact(div(units('1'),units('8'))),'0.125');});
test('18-decimal crypto holdings and sums do not vanish',()=>{assert.equal(exact(units('0.000000000000000001')),'0.000000000000000001');assert.equal(preciseValue('0.000000000000000001','300000000000000000','1'),'0.3');assert.throws(()=>units('0.0000000000000000001'),/18/);});
test('XIRR annualizes investor cashflows',()=>{const rate=xirr([{date:'2025-01-01',amount:-1000},{date:'2026-01-01',amount:1100}]);assert.ok(Math.abs(rate-.1)<.001);assert.equal(xirr([{date:'2025-01-01',amount:-1000}]),null);});
test('TWR requires explicitly valued subperiods',()=>{assert.ok(Math.abs(twr([{start:100,end:110},{start:100,end:105}])-.155)<1e-12);assert.equal(twr([{start:100,end:110,hasUnvaluedExternalFlow:true}]),null);});
test('Modified Dietz is separate from naive wealth growth',()=>{assert.equal(modifiedDietz({start:100,end:160,netFlowEUR:50,weightedFlowEUR:25}),.08);});
