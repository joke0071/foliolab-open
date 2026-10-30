import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForAsyncReadiness} from './browser-async-readiness.mjs';

test('async browser readiness awaits false and requires actual boolean true',async()=>{
 const values=[Promise.resolve(false),Promise.resolve('truthy'),Promise.resolve(true)];
 const receipt=await waitForAsyncReadiness({evaluate:()=>values.shift()},()=>{},null,{timeout:1000});
 assert.equal(receipt.value,true);assert.equal(receipt.polls,3);assert.equal(values.length,0);
});
test('an always-false async readiness condition times out rather than passing',async()=>{
 await assert.rejects(waitForAsyncReadiness({evaluate:async()=>false},()=>{},null,{timeout:25}),{name:'TimeoutError'});
});
test('expected document replacement is observed again inside the same deadline',async()=>{
 let calls=0;
 const receipt=await waitForAsyncReadiness({evaluate:async()=>{
  if(++calls===1)throw Error('Execution context was destroyed, most likely because of a navigation');
  return true;
 }},()=>{},null,{timeout:1000});
 assert.equal(calls,2);assert.equal(receipt.value,true);
});
test('actual browser errors fail immediately and a stuck observation keeps the original deadline',async()=>{
 const failure=Error('unexpected storage failure');let calls=0;
 await assert.rejects(waitForAsyncReadiness({evaluate:async()=>{calls++;throw failure;}},()=>{},null,{timeout:1000}),e=>e===failure);
 assert.equal(calls,1);
 await assert.rejects(waitForAsyncReadiness({evaluate:()=>new Promise(()=>{})},()=>{},null,{timeout:25}),{name:'TimeoutError'});
});
