import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateHistoryDays} from '../src/wallet-history-calculation.js';
import {event,stream} from './wallet-history-fixtures.mjs';

test('handled worker load failures prevent the browser default without turning real failures into success',async()=>{
 const originalWorker=globalThis.Worker,navigatorDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let worker;
 class FailedWorker {constructor(){worker=this;this.terminated=false;}postMessage(){}terminate(){this.terminated=true;}}
 globalThis.Worker=FailedWorker;
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  const session={events:[event({txid:'handled-worker-error',quantityBaseUnits:'7'})],streams:[stream()]};
  const online=calculateHistoryDays(session,{limit:31}).catch(e=>e);
  const onlineError=new Event('error',{cancelable:true});await worker.onerror(onlineError);
  assert.equal(onlineError.defaultPrevented,true);assert.equal(worker.terminated,true);
  assert.match((await online).message,/Lokale Historienberechnung nicht verfügbar/);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
  const offline=calculateHistoryDays(session,{limit:31});
  const offlineError=new Event('error',{cancelable:true});await worker.onerror(offlineError);
  assert.equal(offlineError.defaultPrevented,true);assert.equal(worker.terminated,true);
  assert.equal((await offline).at(-1).quantityBaseUnits,'7');
 }finally{
  if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;
  if(navigatorDescriptor)Object.defineProperty(globalThis,'navigator',navigatorDescriptor);else delete globalThis.navigator;
 }
});

test('explicit worker dependency-load failures reuse the existing online rejection and exact offline replay',async()=>{
 const originalWorker=globalThis.Worker,navigatorDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let worker;
 class FailedWorker {constructor(){worker=this;this.terminated=false;}postMessage(){}terminate(){this.terminated=true;}}
 globalThis.Worker=FailedWorker;
 try{
  const session={events:[event({txid:'dependency-worker-error',quantityBaseUnits:'11'})],streams:[stream()]};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  const online=calculateHistoryDays(session,{limit:32}).catch(e=>e);
  worker.onmessage({data:{loadError:true}});
  assert.equal(worker.terminated,true);assert.match((await online).message,/Lokale Historienberechnung nicht verfügbar/);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
  const offline=calculateHistoryDays(session,{limit:32});worker.onmessage({data:{loadError:true}});
  assert.equal((await offline).at(-1).quantityBaseUnits,'11');assert.equal(worker.terminated,true);
  // A calculation failure is not a dependency-load failure and must never be
  // converted into offline success or cached as valid data.
  const invalid=calculateHistoryDays(session,{limit:33}).catch(e=>e);
  worker.onmessage({data:{error:'Tagesbestände konnten nicht sicher berechnet werden.'}});
  assert.match((await invalid).message,/nicht sicher berechnet/);
  const large=calculateHistoryDays({...session,events:Array(5001).fill(session.events[0])},{limit:32}).catch(e=>e);
  worker.onmessage({data:{loadError:true}});assert.match((await large).message,/große Historien/);
 }finally{
  if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;
  if(navigatorDescriptor)Object.defineProperty(globalThis,'navigator',navigatorDescriptor);else delete globalThis.navigator;
 }
});
