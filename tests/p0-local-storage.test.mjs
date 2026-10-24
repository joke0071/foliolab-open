import test from 'node:test';
import assert from 'node:assert/strict';
import {PortfolioStorage,MODE_KEY,MODE_VALUE} from '../src/browser-portfolio-storage.js';
import {blankModel,STORE_KEY,createProvider} from '../src/model.js';
const memory=()=>{const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test('Stale local writer cannot overwrite a confirmed save; reload renews comparison',async()=>{
 const storage=memory(),a=new PortfolioStorage(storage),b=new PortfolioStorage(storage);
 const x=await a.initialize(),y=await b.initialize();x.providers.push(createProvider({name:'Confirmed'}));await a.save(x);
 const before=storage.getItem(STORE_KEY);
 await assert.rejects(()=>b.save(y),/anderen Tab|geändert/);assert.equal(storage.getItem(STORE_KEY),before);
 const fresh=await b.reload();await b.save(fresh);assert.equal(fresh.providers[0].name,'Confirmed');
});
test('Stale local mode cannot write after another tab migrates to IndexedDB',async()=>{
 const storage=memory(),controller=new PortfolioStorage(storage),m=await controller.initialize();
 storage.setItem(MODE_KEY,MODE_VALUE);
 await assert.rejects(()=>controller.save(m),/Speichermodus|geändert/);assert.equal(storage.getItem(STORE_KEY),null);
});
test('Quota failure preserves old bytes and leaves retry possible',async()=>{
 const storage=memory(),controller=new PortfolioStorage(storage),m=await controller.initialize();await controller.save(m);
 const before=storage.getItem(STORE_KEY),set=storage.setItem;storage.setItem=()=>{throw new DOMException('full','QuotaExceededError');};
 m.providers.push(createProvider({name:'Not yet saved'}));await assert.rejects(()=>controller.save(m),{name:'QuotaExceededError'});
 assert.equal(storage.getItem(STORE_KEY),before);storage.setItem=set;await controller.save(m);
 assert.equal(JSON.parse(storage.getItem(STORE_KEY)).providers[0].name,'Not yet saved');
});
test('Deletion updates controller state and blocks stale resurrection',async()=>{
 const storage=memory(),a=new PortfolioStorage(storage);await a.initialize();await a.save(blankModel());
 const b=new PortfolioStorage(storage),stale=await b.initialize();await a.removeAll();
 await assert.rejects(()=>b.save(stale),/anderen Tab|geändert/);
 await a.save(blankModel());assert.equal(JSON.parse(storage.getItem(STORE_KEY)).version,3);
});
