import {clickDisclosed} from './browser-disclosures.mjs';
import {legacyContext} from './legacy-browser-fixture.mjs';
import {provider as solanaProvider,transaction as solTransaction,A as SOL,M as SOLMINT} from './solana-history-fixtures.mjs';
import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {provider as bitcoinProvider,tx,A,H as BH} from './bitcoin-history-fixtures.mjs';
import {provider as ethereumProvider,A as ETH,H as EH} from './ethereum-history-fixtures.mjs';
const ethereumCursors={transactions:{block_number:10,index:1,items_count:50,fee:null,value:'900719925474099300000000001',inserted_at:'2023-11-14T22:13:20.123456Z',hash:EH(1)},'token-transfers':{batch_log_index:0,batch_block_hash:EH(10),batch_transaction_hash:EH(1),index_in_batch:'2'}};
for(const engine of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true});
 try{
  const context=await legacyContext(browser,{viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();let slow=false;const second={...tx(2),status:{...tx(2).status,block_height:11,block_hash:BH(11),block_time:1700086400}};const btc=bitcoinProvider([tx(1),second],{override:(p,d)=>p==='/blocks/tip/hash'?BH(11):p==='/block/'+BH(11)?{id:BH(11),height:11}:p==='/block-height/11'?BH(11):d}),sol=solanaProvider({transactions:[solTransaction(1,{tokens:true,version0:true})]});
  let eth=ethereumProvider({cursors:ethereumCursors}),ethNetworkFailure=false;
  await page.context().route('https://blockstream.info/**',async route=>{if(slow)await new Promise(r=>setTimeout(r,700));const r=await btc.fetcher(route.request().url(),{method:'GET'});let data;try{data=await r.json();}catch{}await route.fulfill({headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET, POST, OPTIONS'},status:r.status,contentType:typeof data==='string'?'text/plain':'application/json',body:typeof data==='string'?data:JSON.stringify(data)});});
  for(const host of ['eth.blockscout.com','ethereum-rpc.publicnode.com'])await page.context().route('https://'+host+'/**',async route=>{if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET, POST, OPTIONS'}});return;}if(ethNetworkFailure){await route.abort('failed');return;}const req=route.request(),r=await eth.fetcher(req.url(),{method:req.method(),body:req.postData()});await route.fulfill({headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET, POST, OPTIONS'},status:r.status,contentType:'application/json',body:JSON.stringify(await r.json())});});
  await page.context().route('https://solana-rpc.publicnode.com/**',async route=>{if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS'}});return;}const r=await sol.fetcher(route.request().url(),{body:route.request().postData(),method:'POST'});await route.fulfill({status:r.status,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(await r.json())});});
  await context.route('https://api.coingecko.com/**',async route=>{await new Promise(r=>setTimeout(r,700));await route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify({prices:[[1700000000000,20000],[1700086400000,21000]]})});});
  await page.goto('http://127.0.0.1:4173/tests/');
  await page.evaluate(async({A,ETH,SOL,SOLMINT})=>{
   const {blankModel,createProvider,createAccount,createPosition,STORE_KEY}=await import('/src/model.js');const m=blankModel(),p=createProvider({name:'Wallet',type:'wallet'});m.providers.push(p);const a=createAccount({providerId:p.id,name:'Wallet',type:'wallet'},m);m.accounts.push(a);
   for(const [name,chain,address] of [['History BTC','btc',A],['History ETH','evm',ETH],['History SOL','sol',SOL],['History SPL','spl',SOL]])m.positions.push(createPosition({id:chain,providerId:p.id,accountId:a.id,name,kind:'crypto',quantity:'1',price:'1',wallet:{enabled:true,chain,address,chainId:1,decimals:chain==='spl'?24:chain==='sol'?9:18,...(chain==='spl'?{contract:SOLMINT}:{})}},m));m.priceHistories.btc={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-11-14',total:20000},{date:'2023-11-15',total:21000}]};localStorage.setItem(STORE_KEY,JSON.stringify(m));
  },{A,ETH,SOL,SOLMINT});
  await page.goto('http://127.0.0.1:4173/?page=positions');await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="btc"]'));
  const d=page.locator('#walletHistoryDialog');const loadQuotes=async()=>{await d.locator('[data-history="bind-csv"]').check();await d.locator('[data-history="quotes"]').click();await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="output"]').textContent.includes('0.042 EUR'));const plot=d.locator('.chart-plot');await plot.focus();await plot.press('ArrowLeft');assert.match(await d.locator('.chart-tooltip').innerText(),/2023-11-14/);await plot.press('ArrowRight');assert.match(await d.locator('.chart-tooltip').innerText(),/2023-11-15/);};await d.locator('[data-history="start"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000}).catch(async e=>{console.log('UI FAILURE STATE',await d.innerText());throw e;});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).walletHistory?.sessions?.length??0),0);
  await d.locator('[data-history="quotes"]').click();await d.locator('[data-history="cancel"]').click();await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('abgebrochen'));await page.waitForTimeout(900);assert.equal(await d.locator('[data-history="output"]').innerText().then(t=>t.includes('0.042 EUR')),false);
  await loadQuotes();await page.addScriptTag({url:'http://127.0.0.1:4173/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run(document.getElementById('walletHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);assert.deepEqual(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);

  await d.locator('[data-history="discard"]').click();assert.equal(await d.locator('[data-history="accept"]').isVisible(),false);
  await d.locator('[data-history="start"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000}).catch(async e=>{console.log('UI FAILURE STATE',await d.innerText());throw e;});
  await loadQuotes();for(const width of [320,390,430,768,1440]){await page.setViewportSize({width,height:900});const overflow=await d.evaluate(el=>el.getBoundingClientRect().right>innerWidth+1);assert.equal(overflow,false,'overflow '+width);}
  await d.locator('[data-history="accept"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).walletHistory?.sessions.length===1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).walletHistory.sessions[0].quotes.length),2);const finance=await page.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));return [m.journalEntries.length,m.snapshots.length,m.positions.map(p=>p.quantity)];});assert.deepEqual(finance,[0,0,[1,1,1,1]]);
  await d.locator('[data-history="wallet"]').selectOption('evm');await d.locator('[data-history="start"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000}).catch(async e=>{console.log('UI FAILURE STATE',await d.innerText());throw e;});assert.match(await d.innerText(),/Teilweise|unbekannt/);
  await d.locator('[data-history="accept"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).walletHistory.sessions.length===2);
  // A transient failure can resume; a provider-format failure cannot. Accepted
  // events/financial fields stay byte-equivalent until explicit new acceptance.
  const retained=await page.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));return JSON.stringify({...m,walletHistory:{...m.walletHistory,pending:[]}});});
  ethNetworkFailure=true;await d.locator('[data-history="start"]').click();
  await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Fortsetzen ist möglich'));
  assert.equal(await d.locator('[data-history="resume"]').isEnabled(),true);
  ethNetworkFailure=false;eth=ethereumProvider({cursors:ethereumCursors});
  await d.locator('[data-history="resume"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000});
  await d.locator('[data-history="discard"]').click();
  ethNetworkFailure=true;await d.locator('[data-history="start"]').click();
  await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Fortsetzen ist möglich'));
  ethNetworkFailure=false;eth=ethereumProvider({cursors:{'token-transfers':{index:1,unsupported:'SYNTHETIC_UNTRUSTED_CURSOR'}}});
  await d.locator('[data-history="resume"]').click();
  await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Bitte neu abrufen'));
  assert.equal(await d.locator('[data-history="resume"]').isDisabled(),true);
  assert.equal(await d.locator('[data-history="start"]').innerText(),'Neu abrufen');
  assert.match(await d.locator('[data-history="status"]').innerText(),/Blockscout.*ERC-20.*Seiten/);
  assert.equal(await d.locator('[data-history="accept"]').isVisible(),false);
  assert.equal(await d.locator('[data-history="start"]').evaluate(el=>el===document.activeElement),true);
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await d.evaluate(el=>el.scrollWidth>el.clientWidth+1||el.getBoundingClientRect().right>innerWidth+1),false,'cursor recovery overflow '+width);
   assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.getElementById('walletHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  }
  const afterRestart=await page.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));return {value:JSON.stringify({...m,walletHistory:{...m.walletHistory,pending:[]}}),pending:m.walletHistory.pending.length};});
  assert.equal(afterRestart.value,retained);assert.equal(afterRestart.pending,0);
  eth=ethereumProvider({cursors:ethereumCursors});await d.locator('[data-history="start"]').click();
  await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000});
  assert.ok(eth.calls.some(c=>new URL(c.url).searchParams.get('index_in_batch')==='2'),'official batch-only cursor followed');
  await d.locator('[data-history="discard"]').click();
  // A reload loses in-memory raw pages: persisted metadata must never promise resume.
  ethNetworkFailure=true;await d.locator('[data-history="start"]').click();
  await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Fortsetzen ist möglich'));
  await d.locator('[data-history="close"]').click();await page.reload();
  await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="evm"]'));
  assert.equal(await d.locator('[data-history="resume"]').isDisabled(),true);
  assert.equal(await d.locator('[data-history="start"]').innerText(),'Neu abrufen');
  assert.match(await d.locator('[data-history="status"]').innerText(),/Temporäre Seiten fehlen/);
  ethNetworkFailure=false;
  await d.locator('[data-history="wallet"]').selectOption('spl');await d.locator('[data-history="start"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000});await d.locator('details').first().evaluate(el=>el.open=true);assert.match(await d.innerText(),/geschlossene Tokenkonten/);await d.locator('[data-history="records"]').evaluate(el=>el.open=true);assert.match(await d.innerText(),/0.000000000000000000000007/);await d.locator('[data-history="accept"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).walletHistory.sessions.length===3);
  const roundtrip=await page.evaluate(async()=>{const {backup,safeImport}=await import('/src/model.js');const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');await configureBackupPassword('cross-chain-test-password','cross-chain-test-password');const m=safeImport(JSON.parse(localStorage.getItem('foliolab-open-v1'))),payload=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory);const encrypted=await encryptWithBackupPassword(JSON.stringify(payload));const restored=safeImport(unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(encrypted),'cross-chain-test-password'))).data);return restored.walletHistory.sessions.map(s=>s.chain).sort();});assert.deepEqual(roundtrip,['btc','eth','sol']);
  await d.locator('[data-history="wallet"]').selectOption('btc');slow=true;await d.locator('[data-history="start"]').click();await d.locator('[data-history="cancel"]').click();await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Abgebrochen'));slow=false;
  await d.locator('[data-history="resume"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible',timeout:7000}).catch(async e=>{console.log('UI FAILURE STATE',await d.innerText());throw e;});await d.locator('[data-history="discard"]').click();
  await d.locator('[data-history="close"]').click();await page.reload();await clickDisclosed(page.locator('[data-action="wallet-history"][data-id="btc"]'));await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="output"]').textContent.includes('Gespeicherte Historie'));assert.match(await page.locator('#walletHistoryDialog').innerText(),/Gespeicherte Historie/);
  await d.locator('[data-history="start"]').click();await d.locator('[data-history="accept"]').waitFor({state:'visible'});
  const other=await page.context().newPage();await other.goto('http://127.0.0.1:4173/tests/');await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const store=new PortfolioStorage(),m=await store.initialize();m.providers[0].name='Other tab history';await store.save(m);});
  await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('neu laden'));
  await d.locator('[data-history="accept"]').click();await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Nicht gespeichert'));
  const latest=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));assert.equal(latest.providers[0].name,'Other tab history');assert.equal(latest.walletHistory.sessions.find(s=>s.chain==='btc').quotes.length,2);await other.close();
  // The user's history opt-in must survive reload before automatic Drive/local backups.
  await page.goto('http://127.0.0.1:4173/?page=more');
  const historyOption=page.locator('#fullBackupIncludeHistory');
  await historyOption.evaluate(el=>el.closest('details').open=true);
  assert.equal(await historyOption.isChecked(),false);
  await historyOption.check();await page.reload();
  await historyOption.evaluate(el=>el.closest('details').open=true);
  assert.equal(await historyOption.isChecked(),true,'History backup consent must survive reload');
  await page.locator('#fullBackupIncludeSettings').check();
  const download=page.waitForEvent('download');await page.locator('#exportEncryptedBackup').click();
  const envelope=JSON.parse(await readFile(await (await download).path(),'utf8'));
  const recovered=await page.evaluate(async envelope=>{
   const {decryptPasswordBackup}=await import('/src/backup-vault.js'),{unpackCompleteBackup}=await import('/src/complete-backup.js'),{safeImport}=await import('/src/model.js');
   const full=unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(envelope,'cross-chain-test-password'))),isolated=safeImport(full.data);
   return {chains:isolated.walletHistory.sessions.map(s=>s.chain).sort(),provider:isolated.providers[0].name,settings:!!full.configuration?.settings};
  },envelope);
  assert.deepEqual(recovered,{chains:['btc','eth','sol'],provider:'Other tab history',settings:true});
  await historyOption.uncheck();await page.reload();
  await historyOption.evaluate(el=>el.closest('details').open=true);
  assert.equal(await historyOption.isChecked(),false,'History opt-out must also survive reload');
  await page.evaluate(()=>{window.originalPreferenceWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='foliolab-open-backup-include-history-v1')throw new DOMException('fixture quota','QuotaExceededError');return window.originalPreferenceWrite.call(this,k,v);};});
  await historyOption.click();assert.equal(await historyOption.isChecked(),false,'Failed preference write must restore saved consent');
  assert.match(await page.locator('#toast').innerText(),/Auswahl konnte nicht gespeichert/);
  await page.evaluate(()=>{Storage.prototype.setItem=window.originalPreferenceWrite;delete window.originalPreferenceWrite;});
  console.log('HISTORY UI '+engine+': BTC/ETH/SOL/SPL fetch and encrypted roundtrip, preview/discard/accept, persistence, untouched finances, 320–1440 PASS; backup consent reload/opt-out/quota and actual encrypted UI download restore PASS');
 }finally{await browser.close();}
}
