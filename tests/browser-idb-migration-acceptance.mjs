import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
for(const engine of (process.env.IDB_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 for(const encrypted of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
   const expected=await page.evaluate(async()=>{
    const {blankModel,createProvider,createAccount,createPosition,addBooking,snapshot,persist,backup,STORE_KEY}=await import('/src/model.js');
    const {acceptHistory,historyPreview,checkpointHistory}=await import('/src/wallet-history-state.js');
    const {replayWalletHistory}=await import('/src/wallet-history-core.js');
    const {event,stream,NOW}=await import('/tests/wallet-history-fixtures.mjs');
    let m=blankModel();m.settings.autoRefresh=false;m.settings.alphaVantageKey='SYNTHETIC_MIGRATION_KEY';
    m.settings.solanaRpc='https://example.test/api/SYNTHETIC_PRIVATE_RPC';
    const provider=createProvider({name:'Migration Bank',type:'bank'});m.providers.push(provider);
    const a=createAccount({providerId:provider.id,name:'Savings one',type:'savings'},m),b=createAccount({providerId:provider.id,name:'Fixed two',type:'savings',currency:'USD',cashTerms:{version:1,fixedTerm:true,status:'bound',outcome:'unconfirmed',startDate:'2026-01-01',maturityDate:'2027-01-01'}},m);m.accounts.push(a,b);
    const p=createPosition({providerId:provider.id,accountId:a.id,name:'Manual ETF',kind:'etf',quantity:4,price:100},m);m.positions.push(p);
    addBooking(m,{positionId:p.id,date:'2026-10-20',type:'buy',quantity:2,unitPrice:110,feeEUR:2});snapshot(m,'2026-10-20','Confirmed',{manualTotalEUR:'612.34'});
    m=acceptHistory(m,historyPreview({replay:replayWalletHistory({events:[event()],streams:[stream()]}),issues:[]},{id:'migration-history',chain:'eth',walletKey:'public-wallet',acceptedAt:NOW}));
    m=checkpointHistory(m,{id:'migration-pending',chain:'eth',walletKey:'public-wallet',provider:'rpc.test',filter:'all',tip:'10',updatedAt:NOW});
    persist(m);
    return {raw:localStorage.getItem(STORE_KEY),portable:JSON.parse(backup(m,{includeHistory:true})),settings:m.settings};
   });
   await page.goto('http://127.0.0.1:4173/');
   await page.locator('#mobileNav [data-page="more"]').click();
   await page.locator('#storageMigrationSetup').evaluate(el=>el.open=true);
   // First confirmation cancelled: no download, marker, or DB record.
   page.once('dialog',d=>d.dismiss());await page.locator('#migrateToIDB').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-storage-mode')),null);
   const empty=await page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});assert.equal(empty,null);
   if(encrypted){
    await page.locator('#fullBackupIncludeSettings').locator('xpath=ancestor::details').evaluateAll(els=>els.forEach(el=>el.open=true));
    await page.locator('#fullBackupIncludeSettings').check();
    page.once('dialog',d=>d.accept());await page.locator('#migrateToIDB').click();
    await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Backup-Passwort'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-storage-mode')),null,'failed encryption cannot cut over');
    await page.evaluate(async()=>{const {configureBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('migration-test-password','migration-test-password');});
    await page.locator('#fullBackupIncludeSettings').check();
   }
   // Download succeeds, second confirmation cancelled: legacy remains canonical.
   let count=0;const decline=async d=>{count++;await (count===1?d.accept():d.dismiss());};page.on('dialog',decline);
   const [cancelDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#migrateToIDB').click()]);
   await cancelDownload.path();page.off('dialog',decline);
   await page.waitForFunction(()=>!document.getElementById('migrateToIDB').disabled);
   assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-storage-mode')),null);
   assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),expected.raw);
   page.on('dialog',async d=>d.type()==='prompt'?d.accept('migration-test-password'):d.accept());
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#migrateToIDB').click()]);
   const bytes=await readFile(await download.path(),'utf8');
   await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   let decoded=JSON.parse(bytes);
   if(encrypted){
    assert.ok(!bytes.includes('SYNTHETIC_MIGRATION_KEY'));
    decoded=await page.evaluate(async envelope=>{const {decryptPasswordBackup}=await import('/src/backup-vault.js');return JSON.parse(await decryptPasswordBackup(envelope,'migration-test-password'));},decoded);
    assert.equal(decoded.configuration.settings.alphaVantageKey,expected.settings.alphaVantageKey);
    assert.deepEqual(decoded.data.walletHistory,expected.portable.walletHistory);
    assert.deepEqual(decoded.data,expected.portable);
   }else{
    assert.ok(!bytes.includes('SYNTHETIC_MIGRATION_KEY'));assert.ok(!bytes.includes('SYNTHETIC_PRIVATE_RPC'));
    assert.deepEqual(decoded,expected.portable);
   }
   const actual=await page.evaluate(async()=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    const {backup}=await import('/src/model.js');
    const s=new PortfolioStorage(),m=await s.initialize();const r={raw:localStorage.getItem('foliolab-open-v1'),portable:JSON.parse(backup(m,{includeHistory:true})),settings:m.settings};s.close();return r;
   });
   assert.deepEqual(actual,expected,'all financial data, history, optional metadata and credentials preserved');
   // Restore the exact downloaded artifact through the real backup UI into IDB.
   await page.locator('#backupFile').setInputFiles({name:'migration.json',mimeType:'application/json',buffer:Buffer.from(bytes)});
   await page.waitForFunction(()=>document.getElementById('toast').textContent.startsWith('Backup wiederhergestellt.'));
   const roundtrip=await page.evaluate(async()=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {backup}=await import('/src/model.js');
    const s=new PortfolioStorage(),m=await s.initialize();try{return {portable:JSON.parse(backup(m,{includeHistory:true})),settings:m.settings,legacy:localStorage.getItem('foliolab-open-v1')};}finally{s.close();}
   });
   assert.deepEqual(roundtrip,{portable:expected.portable,settings:expected.settings,legacy:expected.raw},'downloaded migration artifact restores without financial changes');
   for(const width of [320,390,430,768,1440]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
   }
   await page.addScriptTag({url:'http://127.0.0.1:4173/node_modules/axe-core/axe.min.js'});
   assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.getElementById('backupStatus').closest('.panel'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
   assert.equal(await page.locator('#storageMigrationSetup').isVisible(),false);
   assert.equal(await page.locator('#revertFromIDB').count(),0);
   console.log(engine+': migration '+(encrypted?'encrypted opt-in':'plain secret-free')+' download/cancel/content/financial/history/settings/mobile/A11y PASS');
  }finally{await context.close();}
 }
 await browser.close();
}
