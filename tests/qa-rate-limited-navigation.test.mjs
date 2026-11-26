import test from 'node:test';
import assert from 'node:assert/strict';
import {openApp,reloadApp} from './flh04-backup-app.mjs';

const origin='https://example.invalid/';
function navigation(replies,{readinessError}={}){
 const calls=[],delays=[];
 let ready=0;
 const page={
  on(){},off(){},
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

test('reload waits for the longest same-origin script limit after an actual readiness timeout',async()=>{
 const waits=[],listeners=new Set();
 let reloads=0;
 const frame={};
 const page={
  url:()=>origin,mainFrame:()=>frame,
  on:(name,listener)=>listeners.add(listener),
  off:(name,listener)=>listeners.delete(listener),
  async reload(){
   reloads++;
   if(reloads===1){
    for(const header of ['0','47']){
     for(const listener of listeners)listener({status:()=>429,url:()=>origin+'src/model.js',
      request:()=>({frame:()=>frame,resourceType:()=>'script'}),headerValue:async()=>header});
    }
   }
   return {status:()=>200};
  },
  async waitForFunction(){if(reloads===1)throw Object.assign(new Error('readiness timed out'),{name:'TimeoutError'});}
 };
 assert.equal(await reloadApp(page,{waitForRetry:async delay=>waits.push(delay)}),page);
 assert.deepEqual(waits,[47000]);
 assert.equal(reloads,2);
 assert.equal(listeners.size,0);
});

test('an HTTP 429 for a different origin cannot turn a readiness failure into a retry',async()=>{
 const frame={},error=Object.assign(new Error('readiness failed'),{name:'TimeoutError'});
 let observe;
 const page={url:()=>origin,mainFrame:()=>frame,on:(_name,f)=>{observe=f;},off:()=>{observe=null;},
  async reload(){
   observe({status:()=>429,url:()=>'https://external.invalid/asset.js',
    request:()=>({frame:()=>frame,resourceType:()=>'script'})});
   return {status:()=>200};
  },async waitForFunction(){throw error;}
 };
 await assert.rejects(reloadApp(page,{waitForRetry:()=>assert.fail('unexpected retry')}),e=>e===error);
 assert.equal(observe,null);
});
