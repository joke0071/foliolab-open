import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.env.ENGINE||'chromium';
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const browsers={chromium,firefox,webkit};
if(!Object.hasOwn(browsers,engine)||!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base))
 throw Error('FLH04 locked anchor requires a supported browser and a local synthetic origin.');
const browser=await browsers[engine].launch({headless:true});
const context=await browser.newContext();

async function openPage(){
 const page=await context.newPage();
 await page.goto(base+'/tests/storage-origin.html');
 await page.evaluate(async()=>{
  const storage=await import('/src/atomic-storage.js');
  const {prepareLocalSyncAnchor}=await import('/experimental/sync/sync-local-anchor.js');
  const db=await storage.openPortfolioDB();
  window.anchorProbe={
   db,storage,
   prepare:()=>prepareLocalSyncAnchor(db),
   preimage:()=>storage.readPortfolioSyncAnchorPreimage(db)
  };
 });
 return page;
}

try{
 const owner=await openPage(),peer=await openPage();
 const fenced=await owner.evaluate(async()=>{
  const {blankModel,backup}=await import('/src/model.js');
  const {storage,db}=window.anchorProbe;
  const model=blankModel();
  return storage.adoptPortfolioRecord(db,{
   expectedPortfolio:null,raw:backup(model,{includeHistory:true}),settings:model.settings
  });
 });
 assert.equal(fenced.syncEnrollmentRequired,true);

 for(const fault of ['quota','abort']){
  const result=await owner.evaluate(async fault=>{
   const put=IDBObjectStore.prototype.put;
   let reached=false;
   IDBObjectStore.prototype.put=function(value,key){
    if(key!=='sync-local-anchor-v1')return put.call(this,value,key);
    reached=true;
    if(fault==='quota')throw new DOMException('synthetic-quota','QuotaExceededError');
    const request=put.call(this,value,key);
    this.transaction.abort();
    return request;
   };
   try{
    await window.anchorProbe.prepare();
    return {reached,error:null};
   }catch(error){
    return {reached,error:fault==='quota'?error.name:error.message};
   }finally{IDBObjectStore.prototype.put=put;}
  },fault);
  assert.equal(result.reached,true);
  assert.match(result.error??'',fault==='quota'?/^QuotaExceededError$/:/aborted|abort/i);
  assert.deepEqual(await peer.evaluate(()=>window.anchorProbe.preimage()),
   {portfolio:fenced,syncPresent:false,anchorPresent:false});
 }

 // Hold one contender after its read and real WebCrypto digest. A second tab
 // commits while the first still holds its original preimage.
 await owner.evaluate(()=>{
  const digest=crypto.subtle.digest;
  crypto.subtle.digest=async function(...args){
   try{
    const result=await digest.apply(this,args);
    await new Promise(resolve=>{window.anchorProbe.resume=resolve;});
    return result;
   }finally{crypto.subtle.digest=digest;}
  };
 });
 const contender=assert.rejects(()=>owner.evaluate(()=>window.anchorProbe.prepare()),/existing-anchor/);
 await owner.waitForFunction(()=>typeof window.anchorProbe.resume==='function');
 let winner;
 try{winner=await peer.evaluate(()=>window.anchorProbe.prepare());}
 finally{await owner.evaluate(()=>window.anchorProbe.resume());}
 await contender;
 assert.equal(winner.status,'prepared-locked');
 assert.equal(winner.enrollmentAuthorized,false);
 assert.equal(winner.localRevision,fenced.revision);
 await owner.close();await peer.close();

 const reopened=await openPage();
 const proof=await reopened.evaluate(async()=>{
  const {db,preimage}=window.anchorProbe;
  const anchor=await new Promise((resolve,reject)=>{
   const tx=db.transaction('records','readonly');
   const read=tx.objectStore('records').get('sync-local-anchor-v1');
   tx.oncomplete=()=>resolve(read.result);
   tx.onabort=()=>reject(tx.error);
  });
  const challenge=crypto.getRandomValues(new Uint8Array(32));
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},anchor.writerPrivateKey,challenge);
  const signatureValid=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},anchor.writerPublicKey,signature,challenge);
  return {
   preimage:await preimage(),lineId:anchor.lineId,status:anchor.status,signatureValid,
   privateKeyExtractable:anchor.writerPrivateKey.extractable,epochKeyExtractable:anchor.epochKey.extractable
  };
 });
 assert.deepEqual(proof,{
  preimage:{portfolio:fenced,syncPresent:false,anchorPresent:true},
  lineId:winner.lineId,status:'prepared-locked',signatureValid:true,
  privateKeyExtractable:false,epochKeyExtractable:false
 });
 console.log('FLH04 LOCKED ANCHOR '+engine+': quota, post-put abort, simultaneous tab preimages and winning locked key pair after reopen PASS.');
}finally{await context.close();await browser.close();}
