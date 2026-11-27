import {returnFromSection} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {fixture} from './restore-position-fixture.mjs';
import {backup} from '../src/model.js';

const base=process.env.TRUST_BASE_URL||'http://127.0.0.1:4173/';
const out=process.env.TRUST_EVIDENCE_DIR||'trust-evidence';
const sourcePassword='SYNTHETIC_SOURCE_PASSWORD',devicePassword='SYNTHETIC_DEVICE_PASSWORD';
const report={base,synthetic:true,transport:'Mocked Google OAuth and Drive HTTP; real delivered UI, crypto and IndexedDB',fault:'One post-commit status text assignment throws; no added dialog, no storage fault',phases:[],stage:'starting'};
const hash=s=>createHash('sha256').update(s).digest('hex');
await mkdir(out,{recursive:true});
const checkpoint=async stage=>{report.stage=stage;await writeFile(out+'/report.json',JSON.stringify(report,null,2));};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
report.browser=browser.version();
let baselineCode=process.env.TRUST_BASELINE_DRIVE?await readFile(process.env.TRUST_BASELINE_DRIVE,'utf8'):null;
const contexts=[];
const json=async(route,value)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
async function makePage(label,bytes=null){
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 contexts.push(context);
 const evidence={label,dialogs:[],pageErrors:[],blockedExternal:[],driveRequests:[]};
 report.phases.push(evidence);
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin){
   if(baselineCode&&label==='v315'&&url.pathname==='/src/drive-backup.js')
    return route.fulfill({status:200,contentType:'text/javascript',body:baselineCode});
   return route.continue();
  }
  if(url.href==='https://accounts.google.com/gsi/client')return route.fulfill({status:200,contentType:'text/javascript',body:"window.google={accounts:{oauth2:{initTokenClient(){return {callback:null,error_callback:null,requestAccessToken(){this.callback({access_token:'SYNTHETIC_TOKEN',expires_in:3600});}}}}}};"});
  if(url.hostname==='www.googleapis.com'){
   evidence.driveRequests.push({method:route.request().method(),path:url.pathname,media:url.searchParams.get('alt')==='media'});
   assert.equal(route.request().method(),'GET','No remote mutation in this restore test');
   if(url.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:bytes});
   const q=url.searchParams.get('q')||'';
   if(q.includes('mimeType'))return json(route,{files:[{id:'syntheticFolder123',name:'FolioLab Backups'}]});
   if(q.includes('in parents'))return json(route,{files:[{id:'syntheticBackup123',name:'FolioLab-2026-11-15T00-00-00-000Z.encrypted.json',createdTime:'2026-11-15T00:00:00Z'}]});
   return json(route,{files:[]});
  }
  evidence.blockedExternal.push(url.origin+url.pathname);
  return route.abort();
 });
 const p=await context.newPage();
 p.on('pageerror',e=>evidence.pageErrors.push(e.message));
 p.on('dialog',async d=>{evidence.dialogs.push({type:d.type(),message:d.message()});await d.accept(d.type()==='prompt'?sourcePassword:undefined);});
 await p.goto(base);
 await p.waitForFunction(()=>document.getElementById('appStartup')?.hidden===true);
 await p.locator('#sidebarNav [data-page="more"]').click();
 return {p,evidence};
}
async function password(p,value){
 await p.locator('#backupPasswordSetup > summary').click();
 await p.locator('#backupPassword').fill(value);
 await p.locator('#backupPasswordConfirm').fill(value);
 await p.locator('#saveBackupPassword').click();
 await p.waitForFunction(()=>document.getElementById('backupPasswordStatus').textContent==='Backup-Passwort eingerichtet');
}
async function download(p,selector){
 const event=p.waitForEvent('download');await p.locator(selector).click();
 return readFile(await(await event).path(),'utf8');
}
async function record(p){
 return p.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db)}finally{db.close()}
 });
}
async function vault(p){
 return p.evaluate(async()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('foliolab-open-backup-password-v1');
  r.onerror=()=>reject(r.error);r.onsuccess=()=>{
   const db=r.result,tx=db.transaction('vault'),req=tx.objectStore('vault').get('active');
   req.onsuccess=()=>{const v=req.result;resolve({keyId:v.keyId,wrap:v.wrap,extractable:v.key.extractable});db.close()};
   req.onerror=()=>reject(req.error);
  };
 }));
}
try{
 await checkpoint('source setup');
 const {p:source,evidence:sourceEvidence}=await makePage('source');
 sourceEvidence.emptyOnboarding=await source.locator('#onboarding').innerText();
 assert.match(sourceEvidence.emptyOnboarding,/Willkommen bei FolioLab/);
 assert.equal(await source.locator('#downloadRaw').count(),0);
 sourceEvidence.plainHint=await source.locator('#plainBackupHint').innerText();
 await source.locator('#backupFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(backup(fixture()))});
 await source.waitForFunction(()=>document.getElementById('toast').textContent.startsWith('Backup wiederhergestellt.'));
 const plain=await download(source,'#exportBackup');
 assert.equal(JSON.parse(plain).positions[0].name,'Synthetic ETF');
 assert.equal(JSON.parse(plain).walletHistory,undefined);
 await password(source,sourcePassword);
 await source.locator('#fullBackupIncludeHistory').check();
 await source.locator('#fullBackupIncludeSettings').check();
 sourceEvidence.exportCopy=await source.locator('#backupPasswordSetup').innerText();
 await source.screenshot({path:out+'/export-source.png',fullPage:true});
 const bytes=await download(source,'#exportEncryptedBackup');
 sourceEvidence.encryptedSHA256=hash(bytes);
 const payload=await source.evaluate(async({bytes,password})=>{
  const {decryptPasswordBackup}=await import('/src/backup-vault.js');
  return JSON.parse(await decryptPasswordBackup(JSON.parse(bytes),password));
 },{bytes,password:sourcePassword});
 assert.equal(payload.data.positions[0].name,'Synthetic ETF');
 assert.ok(payload.configuration.settings);
 sourceEvidence.exportIncludesConfiguration=Boolean(payload.configuration);
 sourceEvidence.sourceRecord=await record(source);
 await checkpoint('source backed up');
 for(const label of baselineCode?['v315','candidate']:['candidate']){
  await checkpoint(label+' setup');
  const {p,evidence}=await makePage(label,bytes);
  await password(p,devicePassword);
  evidence.vaultBefore=await vault(p);evidence.before=await record(p);
  if(await p.locator('#sectionBack').isVisible())await returnFromSection(p);
  await p.locator('#googleDriveBackupSetup > summary').click();
  await p.locator('#driveClientId').fill('synthetic-123.apps.googleusercontent.com');
  await p.locator('#driveClientId').blur();
  await p.locator('#driveConnect').click();
  await p.waitForFunction(()=>document.getElementById('driveConnectionBadge').textContent==='Verbunden'&&document.getElementById('driveConnect').disabled===false);
  await p.locator('#driveRestoreSection > summary').click();
  await p.locator('#driveBackupSelect').selectOption('syntheticBackup123');
  await p.locator('#driveRecoveryInput').fill(sourcePassword);
  // Controlled display fault at the first success text, AFTER actual commit
  // and actual adoptBackupPassword(false). No storage or crypto substitution.
  await p.evaluate(()=>{
   const el=document.getElementById('driveBackupStatus');
   const native=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
   let fired=false;window.__trustDisplayFault=0;
   Object.defineProperty(el,'textContent',{configurable:true,get(){return native.get.call(this)},set(value){
    if(!fired&&String(value).startsWith('Drive-Backup wiederhergestellt.')){
     fired=true;window.__trustDisplayFault++;throw Error('SYNTHETIC_POST_COMMIT_DISPLAY_FAILURE');
    }
    native.set.call(this,value);
   }});
  });
  await p.locator('#driveRestore').click();
  await p.waitForFunction(()=>document.getElementById('driveBackupStatus').textContent.includes('SYNTHETIC_POST_COMMIT_DISPLAY_FAILURE'));
  evidence.status=await p.locator('#driveBackupStatus').innerText();
  evidence.faultCount=await p.evaluate(()=>window.__trustDisplayFault);
  assert.equal(evidence.faultCount,1);
  assert.match(evidence.status,/Abschlussanzeige fehlgeschlagen.*nicht erneut importieren/);
  if(label==='v315')assert.match(evidence.status,/Portfolio und Backup-Passwort übernommen/);
  else{assert.match(evidence.status,/Portfolio wiederhergestellt/);assert.doesNotMatch(evidence.status,/Backup-Passwort übernommen/);}
  evidence.after=await record(p);evidence.vaultAfter=await vault(p);
  assert.equal(evidence.after.revision,evidence.before.revision+1);
  assert.deepEqual(JSON.parse(evidence.after.raw).positions,JSON.parse(sourceEvidence.sourceRecord.raw).positions);
  assert.deepEqual(evidence.vaultAfter,evidence.vaultBefore);
  assert.notEqual(JSON.parse(bytes).keyId,evidence.vaultAfter.keyId);
  assert.equal(await p.locator('#driveRecoveryInput').inputValue(),'');
  await p.screenshot({path:out+'/'+label+'-restore-status.png',fullPage:true});
  await checkpoint(label+' committed and observed');
  // Normal UI export verifies the surviving device password protects NEW files.
  const next=await download(p,'#exportEncryptedBackup');
  evidence.newExportKeyId=JSON.parse(next).keyId;
  assert.equal(evidence.newExportKeyId,evidence.vaultBefore.keyId);
  evidence.passwordCheck=await p.evaluate(async({bytes,local,remote})=>{
   const {decryptPasswordBackup}=await import('/src/backup-vault.js');
   const data=JSON.parse(bytes);await decryptPasswordBackup(data,local);
   try{await decryptPasswordBackup(data,remote);return {local:true,remote:true}}catch{return {local:true,remote:false}}
  },{bytes:next,local:devicePassword,remote:sourcePassword});
  assert.deepEqual(evidence.passwordCheck,{local:true,remote:false});
  await p.reload();await p.waitForFunction(()=>document.getElementById('appStartup')?.hidden===true);
  evidence.reopened=await record(p);assert.deepEqual(evidence.reopened,evidence.after);
  assert.deepEqual(await vault(p),evidence.vaultBefore);
  assert.deepEqual(evidence.pageErrors,[]);
  await checkpoint(label+' PASS');
 }
 report.result='PASS';await checkpoint('completed');
}catch(error){report.result='FAIL';report.error=String(error.stack||error);await checkpoint('failed');throw error}
finally{for(const context of contexts)try{await context.close()}catch{}await browser.close()}
console.log('K6-TRUST native UI copy regression PASS');
