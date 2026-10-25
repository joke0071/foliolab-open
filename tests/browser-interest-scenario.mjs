import {legacyContext} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const base='http://127.0.0.1:4189',deadline=setTimeout(()=>{console.error('Interest scenario browser deadline exceeded');process.exit(1);},300000);deadline.unref();
async function stop(server){if(server&&server.exitCode===null){const done=once(server,'exit');server.kill();await done;}return null;}
async function start(){
 const server=spawn('python3',['-m','http.server','4189','--bind','127.0.0.1'],{stdio:'ignore'});
 for(let i=0;i<40;i++){try{if((await fetch(base)).ok)return server;}catch{}await new Promise(r=>setTimeout(r,100));}
 await stop(server);throw Error('Interest test server did not start');
}
for(const name of (process.env.INTEREST_ENGINES||'chromium').split(',')){
 console.log('INTEREST SCENARIO '+name+': starting');
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 const context=await legacyContext(browser,{viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];let server,dialogs=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs++;await d.accept(d.type()==='prompt'?'test-password-only':undefined);});
 try{
  server=await start();await page.addInitScript({content:axe});await page.goto(base);
  await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
  const dates=await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,persist}=await import('./src/model.js');
   const {executeTransaction}=await import('./src/transactions.js');
   const {localToday}=await import('./src/cash-terms.js');const {interestDateAfter}=await import('./src/interest-scenario.js');
   const today=localToday(),m=blankModel();m.providers.push(createProvider({id:'bank',name:'Testbank',type:'bank'}));m.settings.autoRefresh=false;
   for(const [id,currency,amount] of [['one','EUR','10000'],['two','EUR','2500'],['usd','USD','10000'],['fixed','EUR','100']]){
    const cashTerms={version:1,status:id==='fixed'?'bound':'free',fixedTerm:id==='fixed',startDate:id==='fixed'?'2024-01-01':null,maturityDate:id==='fixed'?'2099-01-01':null,outcome:'unconfirmed',outcomeDate:null,evidence:null,renewalMaturityDate:null};
    m.accounts.push(createAccount({id,providerId:'bank',name:id,type:'savings',currency,cashTerms},m));
    m.positions.push(createPosition({id:id+'-cash',providerId:'bank',accountId:id,name:id,kind:'cash',quantity:amount,price:1,currency,fxRate:1},m));
   }
   // Existing model requires numeric FX; source/date absent means no reliable FX evidence.
   if(m.positions[2].fxSource!==null||m.positions[2].fxRateDate!==null)throw Error('Unexpected FX evidence in fixture');
   executeTransaction(m,{type:'interest',positionId:'one-cash',date:today,quantity:'5',unitPrice:'1'});
   persist(m);return {today,end:interestDateAfter(today,365),change:interestDateAfter(today,15),knownEnd:interestDateAfter(today,364),yesterday:interestDateAfter(today,-1)};
  });await page.reload();
  const financial=()=>page.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));return JSON.stringify({positions:m.positions,bookings:m.bookings,journal:m.journalEntries,flows:m.externalCashFlows,snapshots:m.snapshots,cashTerms:m.accounts.map(a=>a.cashTerms)});});
  const before=await financial();
  const open=async id=>{
   await page.setViewportSize({width:390,height:844});await page.locator('#mobileNav [data-page="more"]').click();
   await page.locator('[data-provider-settings="bank"]').evaluate(e=>e.open=true);await page.locator('#providerSettings [data-action="edit-account"][data-id="'+id+'"]').click();
   assert.equal(await page.locator('#interestDisclosure').getAttribute('open'),null);
   await page.locator('#interestDisclosure').evaluate(e=>e.open=true);
  };
  const preview=async()=>{await page.locator('[data-interest-preview]').evaluate(e=>e.open=true);await page.locator('#interestCalculate').click();await page.waitForFunction(()=>!document.querySelector('#interestCalculate').disabled);};
  const closeSaved=async()=>{await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.querySelector('#editDialog').open);};
  await open('one');assert.equal(await page.locator('#interestEnabled').isChecked(),false);
  await page.locator('#interestEnabled').check();await page.locator('[name="interestRate"]').fill('2,5');
  await preview();assert.match(await page.locator('#interestResult').innerText(),/Zinsmethode/);
  await page.locator('#interestMethod').selectOption('ACT/365F');assert.equal(await page.locator('#interestResult').innerText(),'');
  await preview();assert.match(await page.locator('#interestResult').innerText(),/Szenario/);
  await page.locator('#interestAllowScenario').check();await preview();assert.match(await page.locator('#interestResult').innerText(),/250,13 EUR/);
  assert.equal(await financial(),before);await page.locator('#interestStart').fill(dates.yesterday);await preview();assert.match(await page.locator('#interestResult').innerText(),/Start/);
  await page.locator('#interestStart').fill(dates.today);
  await page.locator('#interestAddRate').click();const second=page.locator('.interest-rate-row').nth(1);
  await second.locator('[name="interestFrom"]').fill(dates.change);await second.locator('[name="interestRate"]').fill('2');await second.locator('[name="interestThrough"]').fill(dates.knownEnd);
  await preview();assert.match(await page.locator('#interestResult').innerText(),/202,16 EUR/);assert.equal(await page.locator('#interestResult tbody tr').count(),3);
  // Duplicate condition cannot be committed, then remove only the new duplicate.
  const original=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
  await page.locator('#interestAddRate').click();const duplicate=page.locator('.interest-rate-row').nth(2);
  await duplicate.locator('[name="interestFrom"]').fill(dates.change);await duplicate.locator('[name="interestRate"]').fill('9');
  await page.locator('#saveDialog').click();assert.match(await page.locator('#dialogError').innerText(),/doppelt/);assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),original);
  await duplicate.locator('button').click();assert.equal(await page.locator('#dialogError').isVisible(),false,'changed conditions clear obsolete duplicate feedback');await preview();
  for(const width of [320,390,430,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' page overflow '+width);assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),name+' dialog overflow '+width);}
  const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#editDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));assert.deepEqual(violations,[]);
  if(process.env.INTEREST_SCREENSHOT&&name==='chromium')await page.screenshot({path:process.env.INTEREST_SCREENSHOT});
  await closeSaved();assert.equal(await financial(),before);
  await open('one');assert.equal(await page.locator('.interest-rate-row').count(),2);assert.match(await page.locator('#interestCurrentRate').innerText(),/2\.5/);
  const unchanged=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),priorDialogs=dialogs;
  await page.locator('[data-interest-preview]').evaluate(e=>e.open=true);await page.locator('#interestAllowScenario').check();await preview();
  await page.evaluate(end=>{document.querySelector('#interestCalculate').click();const input=document.querySelector('#interestEnd');input.value=end;input.dispatchEvent(new Event('input',{bubbles:true}));},dates.change);
  await page.waitForFunction(()=>!document.querySelector('#interestCalculate').disabled);assert.equal(await page.locator('#interestResult').innerText(),'','an edit during the async freshness read invalidates the old request');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#editDialog').open);assert.equal(dialogs,priorDialogs,'only preview controls do not dirty account metadata');
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),unchanged);
  await open('two');await page.locator('#interestEnabled').check();await page.locator('#interestMethod').selectOption('ACT/360');await page.locator('[name="interestRate"]').fill('2');
  await page.locator('#interestAllowScenario').evaluate(e=>e.checked=true);await preview();assert.match(await page.locator('#interestResult').innerText(),/50,69 EUR/);await closeSaved();
  await open('usd');await page.locator('#interestEnabled').check();await page.locator('#interestMethod').selectOption('ACT/365F');await page.locator('[name="interestRate"]').fill('3');
  await page.locator('#interestAllowScenario').evaluate(e=>e.checked=true);await preview();assert.match(await page.locator('#interestResult').innerText(),/300,00 USD/);assert.doesNotMatch(await page.locator('#interestResult').innerText(),/EUR/);assert.deepEqual(await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('foliolab-open-v1')).positions.find(p=>p.id==='usd-cash');return [p.fxSource,p.fxRateDate];}),[null,null]);await closeSaved();
  await open('fixed');await page.locator('#interestEnabled').check();await page.locator('#interestMethod').selectOption('ACT/365F');await page.locator('[name="interestRate"]').fill('3');
  await preview();assert.match(await page.locator('#interestResult').innerText(),/Festgeld/);await page.locator('#cancelDialog').click();
  assert.equal(await financial(),before);
  // Existing AT03-A path with new interest metadata stays read-only.
  await page.locator('#mobileNav [data-page="positions"]').click();const check=page.locator('[data-action="check-cash-balance"][data-id="one-cash"]');
  for(const d of await check.locator('xpath=ancestor::details').all())await d.evaluate(e=>e.open=true);
  await check.click();await page.locator('#cashReference').fill('10005');await page.locator('#cashReferenceCurrent').check();await page.locator('#saveDialog').click();assert.match(await page.locator('#cashComparisonResult').innerText(),/stimmen rechnerisch/);await page.locator('#cancelDialog').click();
  // Current password-vault encrypted full backup, then real UI restore of old/new data.
  const pkg=await page.evaluate(async()=>{
   const {load,backup}=await import('./src/model.js');const {createCompleteBackup}=await import('./src/complete-backup.js');
   const {configureBackupPassword,encryptWithBackupPassword}=await import('./src/backup-vault.js');
   const m=load(),old=JSON.parse(backup(m));old.accounts.forEach(a=>delete a.interestTerms);
   await configureBackupPassword('test-password-only','test-password-only');
   return {encrypted:await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(backup(m))))),old:JSON.stringify(old),accounts:JSON.stringify(m.accounts)};
  });
  const restore=async(name,content)=>{await page.locator('#mobileNav [data-page="more"]').click();await page.locator('#backupFile').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});await page.waitForFunction(()=>document.getElementById('toast')?.textContent?.includes('Backup wiederhergestellt'));await page.reload();};
  await restore('old-portfolio.json',pkg.old);assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).accounts.every(a=>!a.interestTerms)));
  await restore('encrypted-portfolio.json',pkg.encrypted);assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('foliolab-open-v1')).accounts)),pkg.accounts);assert.equal(await financial(),before);
  // Stop the actual origin, reload installed PWA and recalculate from cached modules.
  server=await stop(server);await page.reload({waitUntil:'domcontentloaded'});await open('one');await page.locator('#interestAllowScenario').evaluate(e=>e.checked=true);await preview();assert.match(await page.locator('#interestResult').innerText(),/202,16 EUR/);assert.equal(await financial(),before);
  // Genuine second-tab conflict invalidates forecast and blocks both calculate/save.
  const peer=await context.newPage();await peer.goto(base);const raw=await peer.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));m.providers[0].name='Updated Testbank';const raw=JSON.stringify(m);localStorage.setItem('foliolab-open-v1',raw);return raw;});
  await page.waitForFunction(()=>document.querySelector('#interestResult').textContent.includes('Datenstand'));await preview();assert.match(await page.locator('#interestResult').innerText(),/neu laden/);
  await page.locator('[name="interestRate"]').first().fill('9');await page.locator('#saveDialog').click();assert.match(await page.locator('#dialogError').innerText(),/anderen Tab/);assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),raw);await peer.close();
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');const store=new PortfolioStorage(),m=await store.initialize(),accounts=JSON.stringify(m.accounts);await store.migrate(m);await store.save(m);if(JSON.stringify((await store.reload()).accounts)!==accounts)throw Error('Interest metadata lost in IndexedDB');});
  // IDB writes do not emit the legacy storage event: a read-only forecast must
  // verify the committed revision without adopting it for later stale writes.
  await page.reload();await open('one');await page.locator('#interestAllowScenario').evaluate(e=>e.checked=true);await preview();assert.match(await page.locator('#interestResult').innerText(),/202,16 EUR/);
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();window.__interestObserver=s;window.__interestObservedRevision=s.revision;});
  const idbPeer=await context.newPage();await idbPeer.goto(base);
  const idbRaw=await idbPeer.evaluate(async()=>{const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.accounts.find(a=>a.id==='one').interestTerms.rates[0].annualRateExact='4';await s.save(m);const {readPortfolioRecord}=await import('./src/atomic-storage.js');return (await readPortfolioRecord(s.db)).raw;});
  await preview();assert.match(await page.locator('#interestResult').innerText(),/anderen Tab|nicht aktuell/,'IDB peer commit blocks read-only forecast');
  assert.equal(await page.evaluate(async()=>{let blocked=false;try{await window.__interestObserver.assertCurrent();}catch{blocked=true;}return blocked&&window.__interestObserver.revision===window.__interestObservedRevision;}),true,'read guard rejects without adopting peer revision');
  await page.locator('[name="interestRate"]').first().fill('8');await page.locator('#saveDialog').click();await page.locator('#dialogError').waitFor({state:'visible'});assert.match(await page.locator('#dialogError').innerText(),/Revision|Konflikt|geändert/);
  assert.equal(await idbPeer.evaluate(async()=>{const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');const {readPortfolioRecord}=await import('./src/atomic-storage.js');const s=new PortfolioStorage();await s.initialize();return (await readPortfolioRecord(s.db)).raw;}),idbRaw,'read check cannot rebase a stale writer');await idbPeer.close();
  assert.deepEqual(errors,[]);console.log('INTEREST SCENARIO '+name+': exact/method/future-gates/two accounts/FX/isolation/A+B/AT03/backup UI/old restore/IDB/offline/local+IDB-multitab/mobile/Axe PASS');
 }finally{await stop(server);await context.close();await browser.close();}
}
