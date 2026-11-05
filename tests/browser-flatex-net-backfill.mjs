/** Synthetic actual UI source-order contract. Existing provider engines and storage only. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {fixture} from './flatex-net-fixture.mjs';
import {contextFixture} from './flatex-context-fixture.mjs';
import {fixture as pandaFixture,source} from './bitpanda-import-fixture.mjs';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('flatex-net-backfill'),base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const dir='artifacts/gates/flatex-net-backfill',report={scope:'Controlled independent openings/closing balances, actual provider UI; no real historic balance acceptance',engines:[]};mkdirSync(dir,{recursive:true});
const economic=m=>({positions:m.positions.map(p=>[p.id,p.quantityExact,p.costBasisExact,p.realizedPnLExact]).sort(),bookings:m.bookings.map(b=>[b.importSource?.sourceId,b.importSource?.externalId,b.type,b.quantityExact,b.feeEUR,b.taxEUR,b.amountExactEUR]).sort(),postings:m.journalEntries.map(j=>[j.date,j.postings.map(p=>[p.role,p.positionId,p.quantityDeltaExact,p.amountBookEURExact])]).sort(),flows:m.externalCashFlows});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const results=[];
 try{for(const [dialect,make]of [['native',fixture],['context',contextFixture]]){
  const states=[];
  for(const reverse of [false,true]){
   const f=make(),bp=pandaFixture();for(const [id,q]of [['etf','2'],['cash','78.25']])Object.assign(f.model.positions.find(p=>p.id===id),{quantityExact:q,quantity:Number(q)});
   for(const k of ['providers','accounts','positions','openingPositions'])f.model[k].push(...structuredClone(bp.m[k]));f.model.settings.autoRefresh=false;
   const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic shared restore 2026!':undefined));
   const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
   const disclose=async id=>{if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+'>summary').click();};
   const open=async()=>{await page.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await page.locator('#openCSVImport').click();};
   const commit=async()=>{await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});};
   const panda=async()=>{
    const before=await read();await open();await page.locator('#csvFile').setInputFiles({name:'synthetic-bitpanda.csv',mimeType:'text/csv',buffer:Buffer.from(source())});await page.locator('#csvBitpandaEconomic details>summary').click();
    for(const [key,id]of Object.entries(bp.assignments)){await page.locator('[data-bitpanda-binding="'+key+'"]').selectOption(id);await page.locator('[data-bitpanda-closing="'+key+'"]').fill(bp.options.expectedClosing[id]);}
    for(const [id,mode]of Object.entries(bp.options.feeModes))await page.locator('[data-bitpanda-fee="'+id+'"]').selectOption(mode);
    await page.locator('[data-bitpanda=net]').check();await page.locator('[data-bitpanda=opening]').check();await page.locator('[data-bitpanda=simulate]').click();await page.locator('[data-bitpanda=approve]').check();await commit();assert.equal((await read()).revision,before.revision+1);
   };
   const netOpen=async(mode='net-backfill')=>{
    await open();await page.locator('#csvSource').selectOption('flatex-native');const quote=v=>'"'+v.replaceAll('"','""')+'"',texts=f.documents.map(d=>[d.columns.map(c=>quote(c.header)).join(';'),...d.rows.map(r=>r.fields.map(quote).join(';'))].join('\n'));
    for(const [i,id]of [[0,'csvFlatexDepot'],[1,'csvFlatexAccount']])await page.locator('#'+id).setInputFiles({name:'synthetic-'+i+'.csv',mimeType:'text/csv',buffer:Buffer.from(texts[i],dialect==='context'?'latin1':'utf8')});
    await disclose('flatexNativeBindings');
    if(dialect==='context')for(const [i,scope]of [[0,'SYN-DECLARED-DEPOT'],[1,'SYN-DECLARED-CASH']]){await page.locator('#flatexScope-'+i).fill(scope);await page.locator('#flatexScopeConfirm-'+i).check();await page.locator('[data-flatex-scope="'+i+'"]').click();}
    for(const [i,id]of [[0,'d'],[1,'c']]){await page.locator('#flatexBindingAccount-'+i).selectOption(id);await page.waitForFunction(i=>!document.getElementById('flatexBindingConfirm-'+i).disabled,i);await page.locator('#flatexBindingConfirm-'+i).check();}
    await disclose('flatexNativeSimulation');await page.locator('#flatexSimulationMode').selectOption(mode);await page.locator('[data-flatex-net]').check();
   };
   const controls=async()=>{
    await page.locator('#flatexNetOpeningDate').fill('1999-01-01');await page.locator('#flatexNetOpeningDate').dispatchEvent('change');await page.locator('#flatexNetOpeningConfirmed').check();
    for(const [id,start,end]of [['etf','0','2'],['cash','100','78.25']])for(const [attr,value]of [['start',start],['end',end]]){await page.locator('[data-flatex-'+attr+'="'+id+'"]').fill(value);await page.locator('[data-flatex-'+attr+'="'+id+'"]').dispatchEvent('change');}
    await page.locator('#flatexNetClosingConfirmed').check();
   };
   const simulate=async()=>{await page.locator('#flatexSimulationRun').click();await page.locator('#flatexNativeBackup').waitFor().catch(async e=>{throw Error(e.message+' '+await page.locator('#flatexSimulationResult').innerText());});};
   const approve=async()=>{const download=page.waitForEvent('download');await page.locator('#flatexNativeBackup').click();await download;await page.locator('#flatexNativeAccept').check();};
   try{
    await page.goto(base);await ready();await waitForAppServiceWorker(page);await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},f.model);await page.reload();await ready();
    context.on('request',r=>{if(!r.url().startsWith('blob:')&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});
    if(reverse)await panda();
    const before=await read();await netOpen();await controls();await simulate();
    if(reverse){
     await approve();await page.locator('[data-flatex-end="cash"]').fill('78.24');await page.locator('[data-flatex-end="cash"]').dispatchEvent('change');assert.equal(await page.locator('#flatexNativeAccept').count(),0);assert.ok(await page.locator('#saveDialog').isDisabled());await page.locator('#flatexNetClosingConfirmed').check();await page.locator('#flatexSimulationRun').click();assert.match(await page.locator('#flatexSimulationResult').innerText(),/Endbestand/);assert.deepEqual(await read(),before);await controls();await simulate();
     for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}await page.setViewportSize({width:390,height:900});await page.screenshot({path:dir+'/'+engine+'-'+dialect+'-390.png'});
     await approve();await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){if(this.name==='records'&&a[1]==='portfolio')throw new DOMException('Synthetic quota','QuotaExceededError');return window.originalPut.apply(this,a);};});await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);await page.evaluate(()=>IDBObjectStore.prototype.put=window.originalPut);await simulate();await approve();
     await page.evaluate(()=>{IDBObjectStore.prototype.put=function(...a){const r=window.originalPut.apply(this,a);if(this.name==='records'&&a[1]==='portfolio')r.addEventListener('success',()=>this.transaction.abort(),{once:true});return r;};});await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);await page.evaluate(()=>IDBObjectStore.prototype.put=window.originalPut);await simulate();
    }
    await approve();await commit();let saved=await read();assert.equal(saved.revision,before.revision+1);assert.deepEqual(JSON.parse(saved.raw).positions,JSON.parse(before.raw).positions);
    await page.locator('#undoCSVImport').click();await commit();assert.equal((await read()).raw,before.raw);await netOpen();await controls();await simulate();await approve();await commit();
    if(!reverse)await panda();saved=await read();const m=JSON.parse(saved.raw);assert.equal(m.bookings.length,3);assert.deepEqual(m.positions.map(p=>p.quantityExact),['2','78.25','3.1','99']);assert.equal(m.externalCashFlows.length,0);states.push(economic(m));
    await context.setOffline(true);await page.reload();await ready();assert.equal((await read()).raw,saved.raw);await netOpen();await page.locator('#flatexSimulationRun').click();assert.match(await page.locator('#flatexSimulationResult').innerText(),/0 neue Buchungen · 1 bereits vorhanden/);assert.ok(await page.locator('#saveDialog').isDisabled());await page.locator('#cancelDialog').click();
    const envelope=await page.evaluate(async raw=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('Synthetic shared restore 2026!','Synthetic shared restore 2026!');return encryptWithBackupPassword(raw);},saved.raw);
    const rc=await browser.newContext({viewport:{width:390,height:900}}),rp=await rc.newPage();try{rp.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic shared restore 2026!':undefined));await rp.goto(base);await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await rp.locator('#backupFile').setInputFiles({name:'synthetic-shared-v5.json',mimeType:'application/json',buffer:Buffer.from(envelope)});await rp.locator('#toast').filter({hasText:'Backup wiederhergestellt'}).waitFor();const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});assert.deepEqual(economic(restored),economic(m));}finally{await rc.close();}
    await netOpen('net-remove');await simulate();await approve();await commit();const removed=JSON.parse((await read()).raw);assert.equal(removed.bookings.length,2);assert.deepEqual(removed.positions.map(p=>p.quantityExact),['0','100','3.1','99']);await page.reload();await ready();await netOpen();await controls();await page.locator('#flatexSimulationRun').click();assert.match(await page.locator('#flatexSimulationResult').innerText(),/Wiederimport gesperrt/);await page.locator('#cancelDialog').click();
    // Actual second tab writes while the approved first tab is paused at save.
    await context.setOffline(false);await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},f.model);await page.reload();await ready();await netOpen();await controls();await simulate();await approve();
    await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),save=PortfolioStorage.prototype.save;PortfolioStorage.prototype.save=function(m){return new Promise((resolve,reject)=>window.releaseBackfill=()=>save.call(this,m).then(resolve,reject));};});await page.locator('#saveDialog').click();await page.waitForFunction(()=>Boolean(window.releaseBackfill));const other=await context.newPage();await other.goto(base);await other.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.showSmall=!m.settings.showSmall;await s.save(m);s.close();});await other.close();const concurrent=await read();await page.evaluate(()=>window.releaseBackfill());await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),concurrent);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   }finally{await context.close();}
  }
  assert.deepEqual(states[0],states[1]);results.push({dialect,result:'PASS',checks:['actual Bitpanda/Flatex UI in both orders','exact independent openings/end balances; no doubled holdings/cash','undo/recommit/repeat/zero cost invention','control edit invalidates consent; quota/post-put rollback','offline reload/encrypted v5 restore in fresh context','persistent group withdrawal/tombstone','real second-tab CAS','seven widths/Axe']});
 }
 report.engines.push({engine,version:browser.version(),result:'PASS',results});console.log(engine+': NET BACKFILL SOURCE ORDER UI PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));finish();
