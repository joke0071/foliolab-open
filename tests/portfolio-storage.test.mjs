import test from 'node:test';
import assert from 'node:assert/strict';
import {PortfolioStorage,MODE_KEY,MODE_VALUE} from '../src/browser-portfolio-storage.js';
import {blankModel} from '../src/model.js';
test('Unavailable active IndexedDB never silently writes an old localStorage portfolio',async()=>{
 const values=new Map([[MODE_KEY,MODE_VALUE],['foliolab-open-v1','{"version":3,"providers":[]}']]);
 let writes=0;
 const fake={getItem:k=>values.get(k)||null,setItem:(k,v)=>{writes++;values.set(k,v);},removeItem:k=>values.delete(k)};
 const controller=new PortfolioStorage(fake);
 await assert.rejects(()=>controller.initialize(),/IndexedDB/i);
 assert.equal(controller.isIndexedDB,true,'IDB remains the required canonical store');
 await assert.rejects(()=>controller.save(blankModel()),/IndexedDB/i);
 assert.equal(writes,0,'No legacy write or silent fallback is permitted');
 assert.equal(values.get(MODE_KEY),MODE_VALUE);
});

test('New installation requires IndexedDB; unavailable startup never writes a local portfolio',async()=>{
 const values=new Map(),writes=[];
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{writes.push(k);values.set(k,v);},removeItem:k=>values.delete(k)};
 const controller=new PortfolioStorage(storage);
 await assert.rejects(()=>controller.initialize(),/IndexedDB/);
 assert.equal(controller.isIndexedDB,true);
 await assert.rejects(()=>controller.save(blankModel()),/IndexedDB/);
 assert.deepEqual(writes,[]);assert.equal(values.size,0);
});
test('Unknown storage markers fail closed without normalizing or rewriting legacy bytes',async()=>{
 const raw=JSON.stringify(blankModel()),values=new Map([[MODE_KEY,'future-version'],['foliolab-open-v1',raw]]);
 const storage={getItem:k=>values.get(k)??null,setItem:()=>assert.fail('unexpected write'),removeItem:()=>assert.fail('unexpected removal')};
 await assert.rejects(()=>new PortfolioStorage(storage).initialize(),/Unbekannter Speichermodus/);
 assert.equal(values.get('foliolab-open-v1'),raw);assert.equal(values.get(MODE_KEY),'future-version');
});
