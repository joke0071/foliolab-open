/** Invented sources only: actual shared UI must reject native-role mismatches without a write. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('kraken-fiat-binding'),base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',dir='artifacts/gates/kraken-fiat-binding';mkdirSync(dir,{recursive:true});
const legacy=JSON.parse(readFileSync(new URL('./kraken-fiat-legacy-v297.json',import.meta.url)));
const mixed=krakenCSV([{txid:'SYN-EUR-REWARD',refid:'SYN-VALID',type:'earn',subtype:'reward',asset:'EUR',subclass:'fiat',amount:'1',fee:'0',balance:'2',feecurrency:'EUR'},{txid:'SYN-USD-REWARD',refid:'SYN-INVALID',type:'earn',subtype:'reward',asset:'USD',subclass:'fiat',amount:'0.3',fee:'0',balance:'2.3',feecurrency:'USD'}]);
const reward=subclass=>krakenCSV([{type:'earn',subtype:'reward',asset:'EUR',subclass,amount:'1',fee:'0',balance:'2',feecurrency:'EUR'}]);
const scenarios=[...legacy.cases.map(c=>({name:c.name,text:c.text})),{name:'mixed-no-partial-commit',text:mixed},{name:'cash-without-fiat-role',text:reward('crypto')}];
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const executablePath=process.env[{chromium:'SHARED_CHROMIUM_EXECUTABLE',firefox:'SHARED_FIREFOX_EXECUTABLE',webkit:'SHARED_WEBKIT_EXECUTABLE'}[engine]];
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,...(executablePath?{executablePath}:{}),...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 const checks=[];
 try{for(const scenario of scenarios){
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
  try{
   const f=fixture(scenario.text);f.m.settings.autoRefresh=false;
   const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
   await page.goto(base);await ready();await waitForAppServiceWorker(page);
   await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},f.m);await page.reload();await ready();const before=await read();
   await page.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await page.locator('#openCSVImport').click();await page.locator('#csvSource').selectOption('shared');
   await page.locator('[data-shared=files]').setInputFiles({name:'Synthetic '+scenario.name+'.csv',mimeType:'text/csv',buffer:Buffer.from(scenario.text)});await page.locator('[data-shared=files-status]').filter({hasText:'Dateien erkannt'}).waitFor();
   await page.locator('[data-shared=kraken] details>summary').first().click();
   for(const [stream,id] of Object.entries(f.assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
   await page.locator('[data-kraken=opening]').check();await page.locator('[data-kraken=simulate]').click();
   await page.locator('[data-kraken=status]').filter({hasText:'gesperrt'}).waitFor();
   const reason=await page.locator('[data-kraken=groups]').innerText();assert.match(reason,/native.*Fiat|Fiat.*Cash|Fremdwährungsfiat/i);
   assert.ok(await page.locator('[data-kraken=approve]').isDisabled());assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
   await page.locator('[data-shared=simulate]').click();await page.locator('[data-shared=status]').filter({hasText:'Keine Übernahme'}).waitFor();assert.ok(await page.locator('[data-shared=approve]').isDisabled());assert.ok(await page.locator('[data-shared=backup]').isDisabled());
   // Exercise the submit handler even when a scripted submission bypasses the disabled button.
   await page.locator('#editorForm').dispatchEvent('submit');await page.locator('#dialogError:not(.hidden)').waitFor();assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
   for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}
   await page.setViewportSize({width:390,height:900});await page.locator('[data-kraken=groups]').scrollIntoViewIfNeeded();await page.locator('#editDialog').screenshot({path:dir+'/'+engine+'-'+scenario.name+'.png'});
   await page.locator('#cancelDialog').click();await context.setOffline(true);await page.reload();await ready();assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);
   checks.push({scenario:scenario.name,result:'PASS',visibleReason:reason,disabledApprovals:true,scriptedSubmitRejected:true,canonicalBytesAndRevisionUnchanged:true,offlineReloadUnchanged:true});
  }catch(error){console.error('FIAT_UI_FAILURE',engine,scenario.name,await page.locator('[data-kraken-binding]').evaluateAll(es=>es.map(e=>({stream:e.dataset.krakenBinding,options:[...e.options].map(o=>({value:o.value,text:o.text}))}))));throw error;}finally{await context.close();}
 }}finally{await browser.close();}
 writeFileSync(dir+'/report-'+engine+'.json',JSON.stringify({engine,result:'PASS',base,checks},null,2));console.log('KRAKEN_FIAT_BINDING_PASS',engine);
}
finish();
