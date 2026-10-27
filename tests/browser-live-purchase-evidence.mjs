import {clickDisclosed} from './browser-disclosures.mjs';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BASE_URL||'https://joke0071.github.io/foliolab-open/';const require=createRequire(import.meta.url);const axeSource=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');const useProxy=Boolean(process.env.HTTPS_PROXY);
for(const engine of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,timeout:20000,args:useProxy?['--ignore-certificate-errors']:[],...(useProxy?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block',ignoreHTTPSErrors:useProxy}),page=await context.newPage();
  await context.addInitScript({content:axeSource});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());page.setDefaultTimeout(20000);page.on('pageerror',e=>console.error('PAGE',e.message));await page.goto(base);
  await page.evaluate(async()=>{
   const {blankModel,createProvider,createPosition}=await import(new URL('src/model.js',location.href).href),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',location.href).href),{validateHistorySession}=await import(new URL('src/wallet-history-state.js',location.href).href);
   const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic wallet',type:'wallet'}));
   m.positions.push(createPosition({id:'btc',providerId:'provider',name:'Synthetic BTC',kind:'crypto',coinId:'bitcoin',quantity:'0.0124',price:40000,wallet:{enabled:true,chain:'btc',address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT'}},m));
   const accountId=m.positions[0].accountId,at='2025-01-01T12:00:00.000Z';
   const event={network:'bitcoin',chainId:'mainnet',accountId,walletId:accountId,assetId:'bitcoin',contract:null,mint:null,decimals:8,txid:'a'.repeat(64),locator:{kind:'vout',index:'0',subindex:'0'},blockHeight:'10',blockHash:'b'.repeat(64),txIndex:null,timestamp:at,quantityBaseUnits:'1240000',type:'incoming',source:'synthetic',status:'confirmed',finality:'confirmed',observedAt:at,coverage:'verified',qualityCode:'synthetic'};
   m.walletHistory={schema:1,pending:[],sessions:[validateHistorySession({id:'wallet-history:btc',walletKey:'btc',chain:'btc',acceptedAt:at,events:[event],streams:[{network:'bitcoin',chainId:'mainnet',accountId,assetId:'bitcoin',contract:null,mint:null,decimals:8,throughBlock:'10',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic'},coverage:{status:'verified',fromBlock:'0',toBlock:'10',tipHash:'b'.repeat(64),source:'synthetic'}}],quotes:[],issues:[]})]};
   const store=new PortfolioStorage();await store.initialize();await store.save(m);
  });
  const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',location.href).href);return await new PortfolioStorage().initialize();});
  const original=await read();
  await page.goto(base+'?page=positions');await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="btc"]'));
  const d=page.locator('#walletHistoryDialog');await d.locator('[data-history="start"]').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-history="start"]').disabled);
  const disclosure=d.locator('details').filter({has:page.locator('[data-evidence="file"]')});assert.equal(await disclosure.evaluate(e=>e.open),false);await disclosure.locator('summary').first().click();
  const tx='a'.repeat(64),csv='Currency,Fiat Amount,Bittr Fee,Bitcoin Purchased,Mining Fee,Bitcoin Amount,Bitcoin Transaction ID,Timestamp,IBAN,From\nEUR,500.00,9.00,0.01250000,0.00010000,0.01240000,'+tx+',2025-01-01 12:00:00Z,PRIVATE-IBAN,<img src=x onerror=alert(1)>';
  await d.locator('[data-evidence="file"]').setInputFiles({name:'synthetic.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await d.locator('[data-evidence="save"]').waitFor({state:'visible'});assert.equal((await read()).purchaseEvidence,undefined);assert.ok(!(await d.innerText()).includes('PRIVATE-IBAN'));assert.equal(await d.locator('img').count(),0);
  const group=d.locator('[data-evidence="preview"] details').first();await group.locator('summary').click();await group.locator('[data-link]').click();
  await page.waitForFunction(()=>document.querySelector('[data-evidence="status"]').textContent.includes('Gespeichert'));
  const linked=await read();assert.equal(linked.purchaseEvidence.receipts.length,1);assert.equal(linked.purchaseEvidence.decisions.length,1);const {purchaseEvidence,...finance}=linked;assert.deepEqual(finance,original);
  for(const width of [320,390,430,768,1024,1440]){await page.setViewportSize({width,height:900});assert.equal(await d.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'dialog overflow '+width);}
  assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.getElementById('walletHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  await d.locator('[data-history="close"]').click();await page.reload();await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="btc"]'));await page.waitForFunction(()=>!document.querySelector('[data-history="start"]').disabled);
  await d.locator('details').filter({has:page.locator('[data-evidence="file"]')}).locator('summary').first().click();await d.locator('[data-evidence="preview"] details summary').first().click();await d.locator('[data-unlink]').click();await page.waitForFunction(()=>document.querySelector('[data-evidence="status"]').textContent.includes('Gespeichert'));assert.equal((await read()).purchaseEvidence.decisions.at(-1).action,'unlink');
  const restored=await page.evaluate(async()=>{const {backup,safeImport}=await import(new URL('src/model.js',location.href).href),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',location.href).href),{createCompleteBackup,unpackCompleteBackup}=await import(new URL('src/complete-backup.js',location.href).href),{encryptBackup,decryptBackup}=await import(new URL('src/crypto-backup.js',location.href).href);const m=await new PortfolioStorage().initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory);return safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data).purchaseEvidence;});assert.deepEqual(restored,(await read()).purchaseEvidence);
  await d.locator('[data-evidence="file"]').setInputFiles({name:'synthetic.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  const other=await context.newPage();await other.goto(base);await other.evaluate(async()=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',location.href).href);const s=new PortfolioStorage(),m=await s.initialize();m.providers[0].name='Synthetic other tab';await s.save(m);});assert.equal((await read()).providers[0].name,'Synthetic other tab');
  await d.locator('[data-evidence="save"]').click();await page.waitForFunction(()=>document.querySelector('[data-evidence="status"]').textContent.includes('Nicht gespeichert'));assert.equal((await read()).providers[0].name,'Synthetic other tab');await other.close();
  console.log('PURCHASE EVIDENCE '+engine+': preview/confirm/undo/reload, IDB, encrypted complete restore, six widths, axe, private-field/XSS exclusion, multitab PASS');
 }finally{await browser.close();}
}
