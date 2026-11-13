import test from 'node:test';
import assert from 'node:assert/strict';
import {createC1Diagnostics} from './flh04-c1-diagnostics.mjs';
test('stable assertion ID, bounded expected/actual, and later NOT_REACHED',()=>{
 const c=createC1Diagnostics('C1-MARKERS',['A.01','A.02','A.03']);c.start('A.01');c.pass('A.01');c.start('A.02');
 let error;try{assert.notEqual('legacy','legacy');}catch(e){error=e;}
 const failure=c.fail(error);assert.equal(failure.id,'C1-MARKERS.A.02');assert.equal(failure.actual,'legacy');assert.equal(failure.expected,'legacy');
 assert.deepEqual(c.report().map(r=>r.status),['PASS','FAIL','NOT_REACHED']);
});
test('portfolio, keys, credentials, error messages and unknown field names never serialized',()=>{
 const secret='SYNTHETIC-DO-NOT-LOG';const c=createC1Diagnostics('C1-NO-REVERT',['A.01','A.02']);c.start('A.01');
 let error;try{assert.deepEqual({portfolio:{revision:2,raw:secret},sync:{key:secret},[secret]:secret},{portfolio:{revision:1,raw:'other'},sync:null});}catch(e){error=e;}
 error.message=secret;error.stack=secret;const report=JSON.stringify(c.fail(error));assert.equal(report.includes(secret),false);assert.equal(report.includes('other'),false);assert.equal(report.includes('portfolio.raw'),true);
});
test('operand failure is attached to current assertion; no invented expected/actual',()=>{
 const c=createC1Diagnostics('C1-RESTORE-CAS',['A.01','A.02']);c.start('A.01');const f=c.fail(new TypeError('sensitive detail'));
 assert.equal(f.errorType,'TypeError');assert.equal('actual' in f,false);assert.equal(c.report()[1].status,'NOT_REACHED');
});
test('operation failure between assertions leaves future assertions NOT_REACHED',()=>{
 const c=createC1Diagnostics('C1-CANCEL',['A.01','A.02']);c.start('A.01');c.pass('A.01');const f=c.fail(new Error('not logged'));
 assert.equal(f.id,'C1-CANCEL.OPERATION');assert.equal(c.report()[1].status,'NOT_REACHED');
});
test('invalid or repeated checks fail instead of fabricating PASS',()=>{
 const c=createC1Diagnostics('C1-X',['A.01']);assert.throws(()=>c.start('unknown'));c.start('A.01');c.pass('A.01');assert.throws(()=>c.start('A.01'));assert.throws(()=>c.pass('A.01'));
});
test('completion requires all planned assertions; snapshots cannot change tracker state',()=>{
 const c=createC1Diagnostics('C1-X',['A.01']);assert.throws(()=>c.complete());c.report()[0].status='PASS';assert.throws(()=>c.complete());
 c.start('A.01');c.pass('A.01');assert.doesNotThrow(()=>c.complete());
});
