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
