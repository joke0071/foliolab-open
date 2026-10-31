import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.RECOVERY_BASE||'http://127.0.0.1:4173/';
const report={base,engines:[]};
await mkdir('artifacts/gates/recovery-limits-v251-production',{recursive:true});
for(const name of (process.env.RECOVERY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[name].launch({headless:true,args:name==='chromium'?['--no-sandbox','--ignore-certificate-errors']:[],proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base);
  await page.locator('#mobileNav [data-page="more"]').click();
  await page.locator('#addProvider').click();await page.locator('#providerName').fill('SYNTHETIC Recovery ä 😀 漢字');
  await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}});
  const original=await read();
  const result=await page.evaluate(async()=>{
   const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('./src/backup-vault.js');
   const {encryptBackup,decryptBackup}=await import('./src/crypto-backup.js');
   const password='Synthetic recovery password 2026!';await configureBackupPassword(password,password);
   const plain='{"synthetic":"ä 😀 漢字"}',saved=JSON.parse(await encryptWithBackupPassword(plain)),messages=[];
   for(const [format,run] of [['v1',()=>encryptBackup('€'.repeat(1500000),password)],['v2',()=>encryptWithBackupPassword('😀'.repeat(3000000))]]){
    try{await run();throw Error(format+' unexpectedly accepted');}catch(e){messages.push(e.message);}
   }
   const {preflightBackup}=await import('./src/backup-limits.js');
   const header='😀'.repeat(6000000);
   try{preflightBackup(plain,'v2',header.length,new TextEncoder().encode(header).byteLength);throw Error('Unicode envelope unexpectedly accepted');}catch(e){messages.push(e.message);}
   return {messages,v2:await decryptPasswordBackup(saved,password),v1:await decryptBackup(JSON.parse(await encryptBackup(plain,password)),password),plain};
  });
  assert.ok(result.messages.every(s=>/sichere Wiederherstellung.*unverändert/.test(s)),JSON.stringify(result));
  assert.equal(result.v1,result.plain);assert.equal(result.v2,result.plain);assert.equal(await read(),original);
  // The actual download button still produces a valid encrypted complete backup after a rejected export.
  await page.reload();await page.locator('#mobileNav [data-page="more"]').click();
  await page.waitForFunction(()=>!document.getElementById('exportEncryptedBackup').disabled);
  await page.locator('#backupPasswordSetup').evaluate(el=>el.open=true);
  const download=page.waitForEvent('download');await page.locator('#exportEncryptedBackup').click();
  const envelope=JSON.parse(await readFile(await(await download).path(),'utf8'));
  assert.equal(envelope.format,'foliolab-open-encrypted-v2');
  const decoded=await page.evaluate(async envelope=>{const {decryptPasswordBackup}=await import('./src/backup-vault.js');return JSON.parse(await decryptPasswordBackup(envelope,'Synthetic recovery password 2026!'));},envelope);
  assert.equal(decoded.data.providers[0].name,'SYNTHETIC Recovery ä 😀 漢字');
  assert.equal(await read(),original,'exports must not write portfolio bytes or revision');
  // Reject oversized restore before JSON parsing or any confirmation/persistence.
  let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.dismiss();});
  await page.locator('#backupFile').setInputFiles({name:'synthetic-too-large.json',mimeType:'application/json',buffer:Buffer.alloc(20000001,32)});
  await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('max. 20 MB'));
  assert.equal(dialogs,0);assert.equal(await read(),original);
  await page.evaluate(await readFile('node_modules/axe-core/axe.min.js','utf8'));
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow '+width);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const violations=await page.evaluate(async()=>(await axe.run('#morePage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));
   assert.deepEqual(violations,[],name+' axe '+width);
   if([320,1440].includes(width))await page.screenshot({path:'artifacts/gates/recovery-limits-v251-production/'+name+'-'+width+'.png',fullPage:true});
  }
  await page.reload();assert.equal(await read(),original);assert.deepEqual(errors,[]);
  report.engines.push({name,result:'PASS',viewports:[320,360,390,412,430,768,1440],unchangedPortfolio:true});
  console.log(name+': RECOVERY backup size/plaintext+envelope Unicode preflight, v1+v2 exact, real encrypted download, oversized restore, unchanged IDB/revision, reload, 7 widths/Axe PASS');
 }finally{await context.close();await browser.close();}
}
await writeFile('artifacts/gates/recovery-limits-v251-production/report-'+(process.env.RECOVERY_ENGINES||'chromium').replaceAll(',','-')+'.json',JSON.stringify(report,null,2));
