import {linkBridgeFixture} from './kraken-link-bridge-fixture.mjs';
import {solanaBridgeFixture} from './kraken-solana-bridge-fixture.mjs';
import {ethereumBridgeFixture} from './kraken-ethereum-bridge-fixture.mjs';
import {bridgeFixture} from './kraken-bitcoin-bridge-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {source as distinctAssetSource,sameAssetSource,crossReferenceSource,fixture} from './kraken-import-fixture.mjs';
import {ledgerModel,ledgerEvidence} from './ledger-live-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {clickDisclosed} from './browser-disclosures.mjs';
const base=process.env.UH03_BASE||process.env.BASE_URL||'http://127.0.0.1:4173/';
for(const scenario of [
 {name:'link-bridge',bridge:true,link:true,source:()=>linkBridgeFixture().text,seed:linkBridgeFixture().text,quantities:['0']},
 {name:'solana-bridge',bridge:true,solana:true,source:()=>solanaBridgeFixture().text,seed:solanaBridgeFixture().text,quantities:['0']},
 {name:'ethereum-bridge',bridge:true,ethereum:true,source:()=>ethereumBridgeFixture().text,seed:ethereumBridgeFixture().text,quantities:['0']},
 {name:'bitcoin-bridge',bridge:true,source:()=>bridgeFixture().text,seed:bridgeFixture().text,quantities:['0']},
 {name:'distinct-fee',source:distinctAssetSource,seed:distinctAssetSource(),quantities:['100','3','0.00000083']},
 {name:'cross-reference',source:()=>{const [header,...rows]=crossReferenceSource().split('\n');return [header,...rows.reverse()].join('\n');},seed:crossReferenceSource(),quantities:['50','5'],groups:2},
 {name:'same-asset-fee',source:()=>{const [header,...rows]=sameAssetSource().split('\n');return [header,...rows.reverse()].join('\n');},seed:sameAssetSource(),quantities:['100','2.99']}
].filter(s=>!process.env.UH03_SCENARIOS||process.env.UH03_SCENARIOS.split(',').includes(s.name))){
const source=scenario.source;
const bridge=scenario.link?linkBridgeFixture({accepted:false}):scenario.solana?solanaBridgeFixture():scenario.ethereum?ethereumBridgeFixture():scenario.bridge?bridgeFixture():null;
const {m,assignments}=bridge||fixture(scenario.seed);
const protectedModel=ledgerEvidence(ledgerModel()),input={receipts:protectedModel.purchaseEvidence.receipts,operations:[]};
const protectedSeed=confirmUnifiedBitcoin(protectedModel,input,'wallet',{confirmed:true,externalFunding:true,baseline:previewUnifiedBitcoin(protectedModel,input,'wallet').baseline});
const seed=scenario.bridge?m:protectedSeed;
if(!scenario.bridge){seed.providers.push(...m.providers);seed.accounts.push(...m.accounts);seed.positions.push(...m.positions);seed.openingPositions.push(...m.openingPositions);}seed.settings.autoRefresh=false;
for(const engine of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,timeout:20000});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[],linkExternal=[];page.on('pageerror',e=>errors.push(e.message));if(scenario.link)await context.route('https://**/*',r=>{if(r.request().url().startsWith(base))return r.fallback();linkExternal.push(new URL(r.request().url()).hostname);return r.abort();});
  await context.route('**/__uh03-fixture.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><title>Synthetic UH03 fixture</title><body></body></html>'}));
  await page.goto(base+'__uh03-fixture.html');
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  if(bridge&&!scenario.ethereum&&!scenario.solana&&!scenario.link)await context.route('https://blockstream.info/api/tx/*',r=>{assert.equal(r.request().url(),'https://blockstream.info/api/tx/'+bridge.proofInput.txid);return r.fulfill({contentType:'application/json',body:JSON.stringify(bridge.transaction)});});
  if(scenario.ethereum)await context.route('https://ethereum-rpc.publicnode.com',r=>{const {method,params}=r.request().postDataJSON();const result=method==='eth_chainId'?'0x1':method==='eth_getTransactionByHash'?bridge.transaction:method==='eth_getTransactionReceipt'?bridge.receipt:params[0]==='finalized'?bridge.finalized:bridge.block;return r.fulfill({contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result})});});
  if(scenario.solana)await context.route('https://solana-rpc.publicnode.com',r=>{const {method}=r.request().postDataJSON();const result=method==='getGenesisHash'?bridge.genesis:method==='getTransaction'?bridge.transaction:method==='getBlock'?bridge.block:bridge.finalizedSlot;return r.fulfill({contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result})});});
  const proof=async()=>{
   if(!bridge)return;
   await page.locator('[data-kraken="operation"]').selectOption(scenario.link?'link-bridge':scenario.solana?'solana-bridge':scenario.ethereum?'ethereum-bridge':'bridge');
   await page.locator('[data-kraken="bridge-wallet"]').selectOption(scenario.link?'own-link':scenario.solana?'own-sol':scenario.ethereum?'own-eth':'own-btc');
   await page.locator('[data-kraken="bridge-reference"]').fill(bridge.proofInput.reference);
   await page.locator('[data-kraken="bridge-txid"]').fill(bridge.proofInput.txid);
   await page.locator('[data-kraken="bridge-address"]').fill(bridge.proofInput.destination);
   await page.locator('[data-kraken="bridge-ledger"]').setInputFiles({name:'synthetic-ledger.csv',mimeType:'text/csv',buffer:Buffer.from(bridge.ledger)});
   if(scenario.link)await page.locator('[data-kraken="bridge-link-evidence"]').setInputFiles({name:'synthetic-link.json',mimeType:'application/json',buffer:Buffer.from(bridge.evidenceJSON)});
   await page.locator('[data-kraken="bridge-consent"]').check();
   await page.locator('[data-kraken="bridge-lookup"]').click();
   await page.locator('[data-kraken="bridge-status"]').filter({hasText:scenario.link?'Exakter eigener LINK-Eingang belegt':scenario.solana?'Exakter eigener Solana-Eingang belegt':scenario.ethereum?'Exakter eigener Ethereum-Eingang belegt':'Exakter eigener Bitcoin-Output belegt'}).waitFor();
  };
  const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{readPortfolioRecord}=await import('/src/atomic-storage.js');const s=new PortfolioStorage(),model=await s.initialize(),revision=(await readPortfolioRecord(s.db)).revision;s.close();return {model,revision};});
  if(scenario.link){
   const initial=await read();await page.goto(base+'?page=positions');await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="own-link"]'));const history=page.locator('#walletHistoryDialog');
   await history.locator('[data-history="link-local"]').evaluate(e=>e.open=true);await history.locator('[data-history="link-file"]').setInputFiles({name:'synthetic-link.json',mimeType:'application/json',buffer:Buffer.from(bridge.evidenceJSON)});await history.locator('[data-history="link-consent"]').check();await history.locator('[data-history="link-read"]').click();await history.locator('[data-history="status"]').filter({hasText:'Einzelner finalisierter LINK-Eingang geprüft'}).waitFor();assert.deepEqual(await read(),initial);
   await context.route('**/__uh03-link-axe.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));await page.addScriptTag({url:base+'__uh03-link-axe.js'});
   for(const width of [320,360,390,412,430]){await page.setViewportSize({width,height:900});assert.equal(await history.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'LINK history overflow '+width);assert.deepEqual(await page.evaluate(async()=>(await axe.run('#walletHistoryDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);if(width===320){await fs.mkdir('artifacts/gates/kraken-link',{recursive:true});await history.locator('[data-history="link-local"]').scrollIntoViewIfNeeded();await history.screenshot({path:'artifacts/gates/kraken-link/'+engine+'-history-320.png'});}}
   for(const mode of ['quota','abort']){await page.evaluate(mode=>{window.__linkPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(mode==='quota')throw new DOMException('Synthetic LINK history quota','QuotaExceededError');const r=window.__linkPut.apply(this,args);this.transaction.abort();return r;};},mode);try{await history.locator('[data-history="accept"]').click();await history.locator('[data-history="status"]').filter({hasText:'Nicht gespeichert'}).waitFor();assert.deepEqual(await read(),initial);}finally{await page.evaluate(()=>{IDBObjectStore.prototype.put=window.__linkPut;delete window.__linkPut;});}}
   await history.locator('[data-history="accept"]').click();await history.locator('[data-history="status"]').filter({hasText:'Historie dauerhaft gespeichert'}).waitFor();const accepted=await read();assert.equal(accepted.revision,initial.revision+1);assert.deepEqual(accepted.model.positions,initial.model.positions);assert.equal(accepted.model.bookings.length,0);assert.equal(accepted.model.walletHistory.sessions[0].streams[0].opening,null);assert.notEqual(accepted.model.walletHistory.sessions[0].streams[0].coverage.status,'verified');bridge.m=accepted.model;await history.locator('[data-history="close"]').click();
  }
  const before=await read();
  const file={name:'synthetic-kraken.csv',mimeType:'text/csv',buffer:Buffer.from(source())};
  const open=async()=>{await page.goto(base+'?page=bookings');await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(file);await page.locator('#csvKrakenEconomic').waitFor();};
  await open();assert.deepEqual(await read(),before);
  assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.equal(await page.locator('[data-kraken="more-bindings"]').isHidden(),true);assert.equal(await page.locator('[data-kraken="more"]').isHidden(),true);
  await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  await page.locator('[data-kraken="status"]').filter({hasText:'gesperrt'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);
  for(const [stream,id] of Object.entries(assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
  await page.locator('[data-kraken="opening"]').check();await proof();await page.locator('[data-kraken="simulate"]').click();
  await page.locator('[data-kraken="status"]').filter({hasText:(scenario.groups||1)+' neue Gruppen'}).waitFor();assert.equal(await page.locator('[data-kraken="approve"]').isDisabled(),false);
  assert.deepEqual(await read(),before);
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'overflow '+width);}
  await context.route('**/__uh03-axe.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));
  await page.addScriptTag({url:base+'__uh03-axe.js'});
  assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
  if(scenario.link)for(const width of [320,360,390,412,430]){await page.setViewportSize({width,height:900});assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);await fs.mkdir('artifacts/gates/kraken-link',{recursive:true});await page.locator('[data-kraken="status"]').scrollIntoViewIfNeeded();await page.locator('#editDialog').screenshot({path:'artifacts/gates/kraken-link/'+engine+'-preview-'+width+'.png'});}
  await page.setViewportSize({width:390,height:900});await fs.mkdir('artifacts/gates/kraken-import',{recursive:true});await page.locator('#editDialog').screenshot({path:'artifacts/gates/kraken-import/'+engine+'-'+scenario.name+'-390.png'});
  await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  let saved=await read();assert.equal(saved.revision,before.revision+1);assert.equal(saved.model.version,5);assert.equal(saved.model.bookings.length,before.model.bookings.length+2);
  assert.deepEqual(saved.model.positions.filter(p=>p.providerId==='kraken').map(p=>p.quantityExact),scenario.quantities);
  assert.deepEqual(saved.model.externalCashFlows,before.model.externalCashFlows);if(bridge){assert.deepEqual(saved.model.positions.at(-1),before.model.positions.at(-1));if(scenario.link){assert.equal(saved.model.journalEntries[0].krakenEthereumBridge.kind,'link-explorer-beacon');assert.deepEqual(saved.model.walletHistory,before.model.walletHistory);}else if(scenario.solana){assert.equal(saved.model.journalEntries[0].krakenSolanaBridge.networkFeeSOL,'0.000005');assert.equal(saved.model.journalEntries[0].krakenSolanaBridge.instructionIndex,2);assert.deepEqual(saved.model.walletHistory,before.model.walletHistory);assert.equal(saved.model.walletHistory.sessions[0].streams[0].coverage.status,'partial');}else if(scenario.ethereum){assert.equal(saved.model.journalEntries[0].krakenEthereumBridge.networkFeeETH,'0.000000000000042');assert.deepEqual(saved.model.walletHistory,before.model.walletHistory);assert.equal(saved.model.walletHistory.sessions[0].streams[0].coverage.status,'partial');}else assert.equal(saved.model.journalEntries[0].krakenBitcoinBridge.transactionFeeBTC,'0.000004');}
  await page.locator('#undoCSVImport').click();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});await page.locator('#toast').filter({hasText:'CSV-Import rückgängig gemacht.'}).waitFor();
  const undone=await read();assert.deepEqual(undone.model,before.model);assert.equal(undone.revision,saved.revision+1);
  await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  for(const [stream,id] of Object.entries(assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
  await page.locator('[data-kraken="opening"]').check();await proof();await page.locator('[data-kraken="simulate"]').click();await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});saved=await read();
  if(scenario.link){
   const envelope=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup}=await import('/src/model.js'),{createCompleteBackup}=await import('/src/complete-backup.js'),{configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');const st=new PortfolioStorage(),model=await st.initialize();st.close();await configureBackupPassword('Synthetic LINK restore 2026!','Synthetic LINK restore 2026!');return encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(backup(model)),null,model.walletHistory)));});
   const fresh=await browser.newContext({viewport:{width:320,height:900}}),fp=await fresh.newPage();try{fp.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic LINK restore 2026!':undefined));await fp.goto(base);await fp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await fp.locator('#backupFile').setInputFiles({name:'synthetic-link-v5.json',mimeType:'application/json',buffer:Buffer.from(envelope)});await fp.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));const restored=await fp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const st=new PortfolioStorage(),model=await st.initialize();st.close();return model;});assert.deepEqual(restored.bookings,saved.model.bookings);assert.deepEqual(restored.journalEntries,saved.model.journalEntries);assert.deepEqual(restored.positions,saved.model.positions);assert.deepEqual(restored.walletHistory,saved.model.walletHistory);}finally{await fresh.close();}
  }
  await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  await page.locator('[data-kraken="status"]').filter({hasText:(scenario.groups||1)+' bereits vorhanden'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.deepEqual(await read(),saved);
  await page.locator('#cancelDialog').click();
  // Persistent selective economic rollback through the same actual dialog/CAS boundary.
  const sourceGroups=prepareKrakenSourcePlan([source()]).groups,removedGroup=(scenario.groups?sourceGroups.find(g=>g.rows.some(r=>r.values.refid==='SYN-CROSS-FIRST')):sourceGroups[0]).id;
  await open();await clickDisclosed(page.locator('[data-kraken="operation"]'));
  await page.locator('[data-kraken="operation"]').selectOption('withdraw');assert.equal(await page.locator('[data-kraken="opening"]').isHidden(),true);
  for(const box of await page.locator('[data-kraken-group]').all())if(await box.getAttribute('data-kraken-group')!==removedGroup)await box.uncheck();
  await page.locator('[data-kraken="simulate"]').click();await page.locator('[data-kraken="status"]').filter({hasText:'1 Gruppe rücknehmbar'}).waitFor();
  assert.deepEqual(await read(),saved);
  if(scenario.groups)await page.locator('[data-kraken="partial"]').check();
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'withdrawal overflow '+width);}
  await page.addScriptTag({url:base+'__uh03-axe.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  await page.setViewportSize({width:390,height:900});await page.locator('[data-kraken="status"]').scrollIntoViewIfNeeded();await page.locator('#editDialog').screenshot({path:'artifacts/gates/kraken-import/'+engine+'-'+scenario.name+'-withdrawal-390.png'});
  await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const withdrawn=await read();assert.equal(withdrawn.revision,saved.revision+1);assert.equal(withdrawn.model.version,5);
  assert.deepEqual(withdrawn.model.positions.filter(p=>p.providerId==='kraken').map(p=>p.quantityExact),scenario.groups?['100','3']:m.positions.filter(p=>p.providerId==='kraken').map(p=>p.quantityExact));
  assert.deepEqual(withdrawn.model.externalCashFlows,before.model.externalCashFlows);
  assert.deepEqual(withdrawn.model.bookings.filter(b=>b.importSource?.sourceId==='unified-bitcoin-v1'),before.model.bookings);
  assert.equal(withdrawn.model.journalEntries.filter(j=>j.type==='uh03-undo').length,1);
  await page.reload();await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));await page.locator('[data-kraken="status"]').filter({hasText:'1 gesperrt'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.deepEqual(await read(),withdrawn);await page.locator('#cancelDialog').click();
  const restored=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup,safeImport}=await import('/src/model.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');const s=new PortfolioStorage(),m=await s.initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),r=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data);await s.save(r);s.close();return {version:r.version,bookings:r.bookings.length};});assert.deepEqual(restored,{version:5,bookings:withdrawn.model.bookings.length});
  // Exact quota rollback and stale-CAS behavior use the real existing storage boundary.
  const failures=await page.evaluate(async seed=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{previewKrakenWithdrawal,confirmKrakenWithdrawal}=await import('/src/kraken-import.js');const a=new PortfolioStorage(),b=new PortfolioStorage();await a.initialize();await a.save(seed.model);await b.initialize();const options={selectedGroups:[seed.group],openingConfirmed:true,partialConfirmed:true},p=previewKrakenWithdrawal(seed.model,[seed.text],seed.assignments,options),draft=confirmKrakenWithdrawal(seed.model,[seed.text],seed.assignments,{...options,baseline:p.baseline,confirmed:true}),before=JSON.stringify(await a.reload()),put=IDBObjectStore.prototype.put;let quota=false;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};try{await a.save(draft);}catch(e){quota=e.name==='QuotaExceededError';}finally{IDBObjectStore.prototype.put=put;}const unchanged=JSON.stringify(await a.reload())===before;await a.save(draft);let stale=false;try{await b.save(draft);}catch(e){stale=/anderen Tab/.test(e.message);}a.close();b.close();return {quota,unchanged,stale};},{model:saved.model,text:source(),assignments,group:removedGroup});assert.deepEqual(failures,{quota:true,unchanged:true,stale:true});
  if(scenario.ethereum||scenario.solana||scenario.link){
   const atomic=await page.evaluate(async seed=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{readPortfolioRecord}=await import('/src/atomic-storage.js'),{prepareKrakenSourcePlan}=await import('/src/kraken-source-plan.js'),{prepareKrakenLinkBridge}=await import('/src/kraken-link-bridge.js'),{prepareKrakenEthereumBridge}=await import('/src/kraken-ethereum-bridge.js'),{prepareKrakenSolanaBridge}=await import('/src/kraken-solana-bridge.js'),{previewKrakenImport,confirmKrakenImport}=await import('/src/kraken-import.js');
    const a=new PortfolioStorage();await a.initialize();await a.save(seed.m);const sol=seed.proofInput.genesis!==undefined,bridge=(seed.proofInput.evidenceJSON?prepareKrakenLinkBridge:sol?prepareKrakenSolanaBridge:prepareKrakenEthereumBridge)(seed.m,prepareKrakenSourcePlan([seed.text]).groups[0],seed.proofInput),options={[sol?'solanaBridge':'ethereumBridge']:bridge,openingConfirmed:true},p=previewKrakenImport(seed.m,[seed.text],seed.assignments,options),draft=confirmKrakenImport(seed.m,[seed.text],seed.assignments,{...options,confirmed:true,baseline:p.baseline}),before=JSON.stringify(await readPortfolioRecord(a.db)),put=IDBObjectStore.prototype.put,checks=[];
    for(const mode of ['quota','abort']){let error,queued=false;IDBObjectStore.prototype.put=function(...args){if(mode==='quota')throw new DOMException('Synthetic ETH quota','QuotaExceededError');const r=put.apply(this,args);queued=true;this.transaction.abort();return r;};try{await a.save(draft);}catch(e){error=mode==='abort'&&(e.name==='AbortError'||e.name==='Error'&&e.message==='Speichertransaktion abgebrochen.')?'transaction-aborted':e.name;}finally{IDBObjectStore.prototype.put=put;}checks.push({mode,error,queued,unchanged:JSON.stringify(await readPortfolioRecord(a.db))===before});}
    a.close();return checks;
   },bridge);
   assert.deepEqual(atomic,[{mode:'quota',error:'QuotaExceededError',queued:false,unchanged:true},{mode:'abort',error:'transaction-aborted',queued:true,unchanged:true}]);
  }
  assert.deepEqual(errors,[]);if(scenario.link)assert.deepEqual(linkExternal,[]);await context.close();
  const offlineContext=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'}),offlinePage=await offlineContext.newPage();offlinePage.setDefaultTimeout(20000);
  await offlinePage.goto(base+'?page=bookings');
  const ready=()=>offlinePage.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>offlinePage.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  await controlledStorageFixture(offlinePage,ready,record);
  await offlinePage.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},withdrawn.model);
  await offlinePage.reload();await ready();await offlineContext.setOffline(true);await offlinePage.reload();await ready();
  await offlinePage.locator('#openCSVImport').click();await offlinePage.locator('#csvFile').setInputFiles(file);await clickDisclosed(offlinePage.locator('[data-kraken="simulate"]'));await offlinePage.locator('[data-kraken="status"]').filter({hasText:'1 gesperrt'}).waitFor();assert.equal(await offlinePage.locator('#saveDialog').isDisabled(),true);
  const offline=JSON.parse((await record()).raw);assert.equal(offline.version,5);assert.equal(offline.bookings.length,withdrawn.model.bookings.length);await offlineContext.close();
  if(scenario.link){await fs.mkdir('artifacts/gates/kraken-link',{recursive:true});await fs.writeFile('artifacts/gates/kraken-link/'+engine+'.json',JSON.stringify({result:'PASS',engine,version:browser.version(),scope:'synthetic local LINK explorer/Beacon evidence; no live provider or private originals',checks:['explicit actual partial history acceptance; no opening/whole coverage/position write','explicit local evidence consent; zero external lookups','actual shared CSV preview/commit and one CAS revision','exact principal and separate source fee; sender gas documentary; recipient/history unchanged','320-430 history/preview layout and Axe; seven preview widths','reload/replay/undo; persistent whole-group rollback/tombstone','quota/postput abort exact no mutation; stale second writer','fresh context encrypted v5 actual UI restore with history','actual offline PWA reload and tombstone replay']},null,2)+'\n');}
  console.log('UH03 Kraken '+engine+' '+scenario.name+': actual shared CSV dialog, exact trade/fee/cash, pure preview, explicit bindings/opening, one CAS revision, protected v5, reload/reimport, seven widths/Axe, exact undo, persistent complete-group withdrawal/reimport tombstone, encrypted restore, withdrawal quota/stale CAS and actual offline PWA reload PASS');
 }finally{await browser.close();}
}
}
