import test from 'node:test';
import assert from 'node:assert/strict';
import {openApp} from './flh04-backup-app.mjs';

const origin='https://example.invalid/';
function navigation(replies,{readinessError}={}){
 const calls=[],delays=[];
 let ready=0;
 const page={
  async goto(url){
   calls.push(url);
   const [status,header]=replies.shift();
   return {status:()=>status,headerValue:async(name)=>{assert.equal(name,'retry-after');return header;}};
  },
  async waitForFunction(){ready++;if(readinessError)throw readinessError;}
 };
 return {open:()=>openApp({newPage:async()=>page},origin,{waitForRetry:async ms=>{delays.push(ms);}}),
  calls,delays,page,readiness:()=>ready};
}
test('a Pages 429 retries the same navigation before waiting for the application',async()=>{
 const probe=navigation([[429,'0'],[429,'40'],[200]]);
 assert.equal(await probe.open(),probe.page);
 assert.deepEqual(probe.calls,[origin,origin,origin]);
 assert.deepEqual(probe.delays,[10000,40000]);
 assert.equal(probe.readiness(),1);
});
test('a long server hold or persistent throttling ends without an early or unbounded retry',async()=>{
 const hold=navigation([[429,new Date(Date.now()+240000).toUTCString()]]);
 await assert.rejects(hold.open(),/HTTP 429/);
 assert.deepEqual(hold.delays,[]);assert.equal(hold.readiness(),0);
 const persistent=navigation(Array.from({length:4},()=>[429,null]));
 await assert.rejects(persistent.open(),/HTTP 429/);
 assert.deepEqual(persistent.delays,[10000,30000,65000]);assert.equal(persistent.readiness(),0);
});
test('normal responses and application readiness errors retain the original behavior',async()=>{
 const ok=navigation([[200]]);
 assert.equal(await ok.open(),ok.page);assert.deepEqual(ok.delays,[]);
 const error=new Error('IndexedDB initialization failed');
 const failed=navigation([[200]],{readinessError:error});
 await assert.rejects(failed.open(),e=>e===error);
 assert.deepEqual(failed.calls,[origin]);assert.deepEqual(failed.delays,[]);
});
