import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const base='http://127.0.0.1:4188',deadline=setTimeout(()=>{console.error('Cash terms browser deadline exceeded');process.exit(1);},240000);deadline.unref();
async function stop(server){if(server&&server.exitCode===null){const done=once(server,'exit');server.kill();await done;}return null;}
async function start(){
 const server=spawn('python3',['-m','http.server','4188','--bind','127.0.0.1'],{stdio:'ignore'});
 for(let i=0;i<40;i++){try{if((await fetch(base)).ok)return server;}catch{}await new Promise(r=>setTimeout(r,100));}
 await stop(server);throw Error('Testserver did not start');
}
for(const name of (process.env.TERM_ENGINES||'chromium').split(',')){
 console.log('CASH TERMS '+name+': starting');
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let server;
 try{
  server=await start();await page.addInitScript({content:axe});await page.goto(base);
  await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
  await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
   const m=blankModel(),provider=createProvider({id:'bank',name:'Testbank',type:'bank'});m.providers.push(provider);m.settings.autoRefresh=false;
   for(const [id,currency,quantity] of [['term-one','EUR','100'],['term-two','EUR','250'],['usd','USD','20']]){
    const account=createAccount({id,providerId:'bank',name:id,currency,type:'savings'},m);m.accounts.push(account);
    m.positions.push(createPosition({id:id+'-cash',accountId:id,providerId:'bank',name:id,kind:'cash',quantity,price:1,currency,fxRate:0.9},m));
   }
   persist(m);
  });await page.reload();
  const financial=()=>page.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));return JSON.stringify({positions:m.positions,bookings:m.bookings,journal:m.journalEntries,flows:m.externalCashFlows,snapshots:m.snapshots});});
  const before=await financial();
  await page.locator('#mobileNav [data-page="more"]').click();
  await page.locator('[data-provider-settings="bank"]').evaluate(e=>e.open=true);
  const edit=page.locator('[data-action="edit-account"][data-id="term-one"]');await edit.click();
  assert.equal(await page.locator('#cashTermsDisclosure').getAttribute('open'),null);
  await page.locator('#cashTermsDisclosure').evaluate(e=>e.open=true);await page.locator('#cashTermsEnabled').check();
  await page.locator('#fixedTerm').check();await page.locator('#liquidityStatus').selectOption('bound');
  await page.locator('#termStartDate').fill('2024-02-29');await page.locator('#termMaturityDate').fill('2025-10-25');
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.querySelector('#editDialog').open);
  assert.equal(await financial(),before);
  await page.locator('#mobileNav [data-page="dashboard"]').click();await page.locator('#cashTermsOverview').evaluate(e=>e.open=true);
  const term=page.locator('[data-cash-account="term-one"]');assert.match(await term.innerText(),/Fälligkeit erreicht/);assert.match(await term.innerText(),/Nicht bestätigt/);
  await term.locator('button').click();await page.locator('#cashTermsDisclosure').evaluate(e=>e.open=true);
  await page.locator('#termOutcome').selectOption('renewed');await page.locator('#termOutcomeDate').fill('2025-10-25');
  await page.locator('#termEvidence').fill('Wiederanlage-Testbeleg');await page.locator('#termRenewalMaturityDate').fill('2099-10-25');
  await page.locator('#saveDialog').click();assert.match(await page.locator('#dialogError').innerText(),/ausdrücklich bestätigen/);
  await page.locator('#termEvidenceConfirmed').check();await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.querySelector('#editDialog').open);
  assert.match(await term.innerText(),/Gebunden/);assert.match(await term.innerText(),/25.10.2099/);
  assert.equal(await financial(),before);
  await term.locator('button').click();await page.locator('#cashTermsDisclosure').evaluate(e=>e.open=true);
  await page.locator('#termOutcome').selectOption('paid-out');await page.locator('#termOutcomeDate').fill('2025-10-26');
  await page.locator('#termEvidence').fill('Auszahlung-Testbeleg');await page.locator('#liquidityStatus').selectOption('free');await page.locator('#termEvidenceConfirmed').check();
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' page overflow '+width);
   assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),name+' dialog overflow '+width);
  }
  const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#editDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  assert.deepEqual(violations,[]);
  if(process.env.TERM_SCREENSHOT&&name==='chromium')await page.screenshot({path:process.env.TERM_SCREENSHOT});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.querySelector('#editDialog').open);
  assert.match(await term.innerText(),/Frei verfügbar/);assert.equal(await financial(),before);
  const second=page.locator('[data-cash-account="term-two"]');await second.locator('button').click();
  await page.locator('#cashTermsDisclosure').evaluate(e=>e.open=true);await page.locator('#cashTermsEnabled').check();await page.locator('#liquidityStatus').selectOption('free');
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.querySelector('#editDialog').open);
  assert.match(await second.innerText(),/Frei verfügbar/);
  const usd=page.locator('[data-cash-account="usd"]');assert.match(await usd.innerText(),/20 USD/);assert.doesNotMatch(await usd.innerText(),/EUR/);
  await page.locator('[data-provider-id="bank"]').evaluate(e=>e.open=true);
  for(const width of [320,390,430,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' account cards overflow '+width);}
  await page.setViewportSize({width:390,height:844});
  const overviewViolations=await page.evaluate(async()=>(await axe.run(document.querySelector('#cashTermsOverview'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));assert.deepEqual(overviewViolations,[]);
  // Current complete encrypted backup engine, without copying any test credentials into data.
  await page.evaluate(async()=>{
   const {load,backup,safeImport}=await import('/src/model.js');
   const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');
   const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');
   const m=load(),pkg=createCompleteBackup(JSON.parse(backup(m)));
   await configureBackupPassword('test-password-only','test-password-only');
   const encrypted=await encryptWithBackupPassword(JSON.stringify(pkg));
   const restored=safeImport(unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(encrypted),'test-password-only'))).data);
   if(JSON.stringify(restored.accounts)!==JSON.stringify(m.accounts))throw Error('Metadata lost in encrypted full backup');
  });
  // Real origin outage, then reload the complete cached shell and preserved metadata.
  server=await stop(server);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#mobileNav [data-page="dashboard"]').click();
  await page.locator('#cashTermsOverview').evaluate(e=>e.open=true);assert.match(await term.innerText(),/Frei verfügbar/);assert.equal(await financial(),before);
  await term.locator('button').click();await page.locator('#cashTermsDisclosure').evaluate(e=>e.open=true);await page.locator('#termEvidence').fill('Stale edit must not save');
  const peer=await context.newPage();await peer.goto(base);const peerRaw=await peer.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));m.providers[0].name='Second-tab bank';const raw=JSON.stringify(m);localStorage.setItem('foliolab-open-v1',raw);return raw;});
  await page.waitForFunction(()=>!document.querySelector('#notice').classList.contains('hidden'));
  await page.locator('#termEvidenceConfirmed').check();await page.locator('#saveDialog').click();assert.match(await page.locator('#dialogError').innerText(),/anderen Tab/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),peerRaw);await peer.close();
  // Existing transactional storage must preserve the same optional metadata.
  await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const store=new PortfolioStorage(),m=await store.initialize(),accounts=JSON.stringify(m.accounts);
   await store.migrate(m);await store.save(m);const restored=await store.reload();
   if(JSON.stringify(restored.accounts)!==accounts)throw Error('Metadata lost in transactional storage');
  });
  assert.deepEqual(errors,[]);console.log('CASH TERMS '+name+': maturity/renewal/payout/multi-account/nominalFX/unchanged finances/encrypted backup/offline/stale tab/Axe PASS');
 }finally{await stop(server);await context.close();await browser.close();}
}
