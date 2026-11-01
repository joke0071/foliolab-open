import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';
import {plainBackupBoundaryFixture} from './plain-backup-fixture.mjs';
import {LOCAL_BACKUP_FILE_BYTES} from '../src/backup-limits.js';
import {manageList} from './browser-management-mode.mjs';
const base=process.env.RECOVERY_BASE||'http://127.0.0.1:4173/';
const fixture=plainBackupBoundaryFixture();
assert.ok(fixture.compactBytes<=LOCAL_BACKUP_FILE_BYTES&&fixture.prettyBytes>LOCAL_BACKUP_FILE_BYTES);
const hash=v=>createHash('sha256').update(v).digest('hex'),report={base,inputBytes:fixture.compactBytes,prettyBytes:fixture.prettyBytes,engines:[]};
mkdirSync('artifacts/gates/plain-backup-limits',{recursive:true});
for(const engine of (process.env.RECOVERY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]}),context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{const r=await readPortfolioRecord(db),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(r.raw));return {revision:r.revision,hash:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')};}finally{db.close();}});
 try{
  await page.goto(base);await ready(page);page.on('dialog',d=>d.accept());
  // This is an actual accepted file, not a forged record or bypass of reader limits.
  await page.locator('#backupFile').setInputFiles({name:'synthetic-legacy-revision.json',mimeType:'application/json',buffer:Buffer.from(fixture.compact)});
  await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
  const before=await read(page);await page.locator('#mobileNav [data-page="more"]').click();
  const download=page.waitForEvent('download');await page.locator('#exportBackup').click();
  const bytes=readFileSync(await(await download).path());
  assert.deepEqual(await read(page),before,'export does not write canonical bytes/revision');
  assert.ok(bytes.length<=LOCAL_BACKUP_FILE_BYTES,'every advertised plain backup fits the unchanged reader');
  const exported=JSON.parse(bytes);assert.equal(exported.snapshots[0].revisions[0].note,fixture.model.snapshots[0].revisions[0].note,'legacy revision data is not shortened');
  const fresh=await browser.newContext({viewport:{width:390,height:844}}),restored=await fresh.newPage();
  try{
   await restored.goto(base);await ready(restored);restored.on('dialog',d=>d.accept());
   await restored.locator('#backupFile').setInputFiles({name:'synthetic-compact-export.json',mimeType:'application/json',buffer:bytes});
   await restored.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   assert.deepEqual(await read(restored),before,'fresh UI restore retains full canonical data and revision');
  }finally{await fresh.close();}
  // A larger UTF-8 representation can be stored locally but cannot be made into
  // a valid portable file. Rejection must not acknowledge a backup or start a download.
  await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{const m=await s.initialize();m.snapshots[0].revisions[0].note='😀'.repeat(5000000);await s.save(m);}finally{s.close();}
  });
  await page.reload();await ready(page);await page.locator('#mobileNav [data-page="more"]').click();
  await page.evaluate(()=>{localStorage.setItem('foliolab-open-last-backup-at','2025-01-01T00:00:00.000Z');localStorage.setItem('foliolab-open-unbacked-changes','7');window.__plainURLs=0;const original=URL.createObjectURL;URL.createObjectURL=function(...args){window.__plainURLs++;return original.apply(this,args);};});
  const oversized=await read(page);await page.locator('#exportBackup').click();
  await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('max. 20 MB'));
  assert.deepEqual(await read(page),oversized);
  assert.deepEqual(await page.evaluate(()=>({urls:window.__plainURLs,last:localStorage.getItem('foliolab-open-last-backup-at'),pending:localStorage.getItem('foliolab-open-unbacked-changes')})),{urls:0,last:'2025-01-01T00:00:00.000Z',pending:'7'});
  await page.reload();await ready(page);assert.deepEqual(await read(page),oversized);
  // A mandatory safety backup cannot acknowledge an unportable file or unlock
  // the subsequent economic/reference mutation, including an explicit submit.
  await page.locator('#mobileNav [data-page="history"]').click();
  if(!await page.locator('#snapshotManager').evaluate(e=>e.open))await page.locator('#snapshotManager>summary').click();
  await manageList(page,'references');await page.locator('[data-reference-select="SYN-LEGACY-REVISION"]').check();
  await page.locator('[data-reference-manage="remove"]').click();
  await page.locator('#referenceRemovalBackup').click();
  await page.waitForFunction(()=>document.getElementById('referenceRemovalBackupStatus')?.textContent.includes('max. 20 MB'));
  await page.locator('[name=confirmReferenceRemoval]').check();await page.locator('#saveDialog').click();
  await page.waitForFunction(()=>document.getElementById('dialogError')?.textContent.includes('Zuerst ein aktuelles Backup'));
  assert.deepEqual(await read(page),oversized,'failed safety export cannot unlock reference deletion');
  assert.deepEqual(errors,[]);report.engines.push({engine,status:'PASS',canonicalHash:before.hash,oversizedCanonicalHash:oversized.hash,downloadBytes:bytes.length,downloadSha256:hash(bytes),checks:['accepted legacy compact input','readable plain UI export preserves all revision bytes','fresh UI restore','UTF8 too large rejected before URL/download/backup acknowledgement','canonical record/revision/reload unchanged','failed mandatory safety export cannot unlock reference deletion']});
  console.log(engine+': PLAIN BACKUP accepted old input/whitespace-only portable export/fresh UI restore/UTF8 rejection/no false success/exact IDB PASS');
 }finally{writeFileSync('artifacts/gates/plain-backup-limits/'+engine+'.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
