import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.env.ENGINE||'chromium';
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const browsers={chromium,firefox,webkit};
if(!Object.hasOwn(browsers,engine)||!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base))
 throw Error('FLH04 locked anchor restart requires a supported browser and a local synthetic origin.');

const profile=await mkdtemp(join(tmpdir(),'foliolab-locked-anchor-'));
const openBrowser=()=>browsers[engine].launchPersistentContext(profile,{headless:true});
async function openProbe(browser){
 const page=browser.pages()[0]||await browser.newPage();
 await page.goto(base+'/tests/storage-origin.html');
 await page.evaluate(async()=>{
  const storage=await import('/src/atomic-storage.js');
  const db=await storage.openPortfolioDB();
  async function readKeys(){
   return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readonly');
    const request=tx.objectStore('records').get('sync-local-anchor-v1');
    tx.oncomplete=()=>resolve(request.result);
    tx.onabort=()=>reject(tx.error);
   });
  }
  // Test-only derivation with a dedicated context. The sync protocol stays locked.
  const deriveTestKey=key=>crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),
   info:new TextEncoder().encode('FolioLab test locked anchor restart')},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  window.anchorRestartProbe={storage,db,readKeys,deriveTestKey};
 });
 return page;
}

let browser;
try{
 browser=await openBrowser();
 const first=await openProbe(browser);
 const original=await first.evaluate(async()=>{
  const {blankModel,backup}=await import('/src/model.js');
  const {prepareLocalSyncAnchor}=await import('/experimental/sync/sync-local-anchor.js');
  const {storage,db,readKeys,deriveTestKey}=window.anchorRestartProbe;
  const model=blankModel();
  const portfolio=await storage.adoptPortfolioRecord(db,{expectedPortfolio:null,raw:backup(model,{includeHistory:true}),settings:model.settings});
  const prepared=await prepareLocalSyncAnchor(db);
  const anchor=await readKeys();
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const message=crypto.getRandomValues(new Uint8Array(32));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await deriveTestKey(anchor.epochKey),message);
  const writerSPKI=await crypto.subtle.exportKey('spki',anchor.writerPublicKey);
  db.close();
  return {portfolio,prepared,iv:[...iv],message:[...message],ciphertext:[...new Uint8Array(ciphertext)],writerSPKI:[...new Uint8Array(writerSPKI)]};
 });
 assert.equal(original.portfolio.syncEnrollmentRequired,true);
 assert.equal(original.prepared.enrollmentAuthorized,false);
 await browser.close();
 browser=await openBrowser();
 const page=await openProbe(browser);
 const challenge=crypto.getRandomValues(new Uint8Array(32));
 const reopened=await page.evaluate(async({iv,ciphertext,challenge})=>{
  const {storage,db,readKeys,deriveTestKey}=window.anchorRestartProbe;
  const anchor=await readKeys();
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(iv)},await deriveTestKey(anchor.epochKey),new Uint8Array(ciphertext));
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},anchor.writerPrivateKey,new Uint8Array(challenge));
  const preimage=await storage.readPortfolioSyncAnchorPreimage(db);
  db.close();
  return {preimage,status:anchor.status,lineId:anchor.lineId,epochExtractable:anchor.epochKey.extractable,
   writerExtractable:anchor.writerPrivateKey.extractable,plaintext:[...new Uint8Array(plaintext)],signature:[...new Uint8Array(signature)]};
 },{iv:original.iv,ciphertext:original.ciphertext,challenge:[...challenge]});
 const writer=await crypto.subtle.importKey('spki',new Uint8Array(original.writerSPKI),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 assert.equal(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},writer,new Uint8Array(reopened.signature),challenge),true);
 assert.deepEqual(reopened.plaintext,original.message);
 assert.deepEqual(reopened.preimage,{portfolio:original.portfolio,syncPresent:false,anchorPresent:true});
 assert.equal(reopened.lineId,original.prepared.lineId);
 assert.equal(reopened.status,'prepared-locked');
 assert.equal(reopened.epochExtractable,false);
 assert.equal(reopened.writerExtractable,false);
 console.log(`FLH04 LOCKED ANCHOR ${engine}: browser process restart preserved both keys, exact portfolio and locked enrollment.`);
}finally{
 try{await browser?.close();}finally{await rm(profile,{recursive:true,force:true});}
}
