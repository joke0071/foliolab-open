// Run from repository root. Isolated synthetic portfolio, real published code.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {provider,A,H} from '../../tests/ethereum-history-fixtures.mjs';
const browser=await chromium.launch({headless:true,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
let eth=provider({cursors:{transactions:{block_number:10,index:1,fee:null,value:'900719925474099300000000001',inserted_at:'2023-11-14T22:13:20.123456Z',hash:H(1)},'token-transfers':{batch_log_index:0,batch_block_hash:H(10),batch_transaction_hash:H(1),index_in_batch:'2'}}}),networkFail=false;
try{
 const context=await browser.newContext({ignoreHTTPSErrors:!!process.env.HTTPS_PROXY,serviceWorkers:'block',viewport:{width:390,height:844}});
 // Existing test-harness instrumentation, installed before document policy.
 // Do not relax or bypass the published application's CSP.
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const page=await context.newPage();
 for(const host of ['eth.blockscout.com','ethereum-rpc.publicnode.com'])await context.route('https://'+host+'/**',async route=>{
  if(networkFail)return route.abort('failed');
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET, POST, OPTIONS'}});
  const q=route.request(),r=await eth.fetcher(q.url(),{method:q.method(),body:q.postData()});
  return route.fulfill({status:r.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(await r.json())});
 });
 await page.goto('https://foliolab.unperfekt.at/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await page.evaluate(async address=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.providers.push(createProvider({id:'p',name:'SYNTHETIC wallets',type:'wallet'}));
  m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC wallet',type:'wallet'},m));
  m.positions.push(createPosition({id:'eth',providerId:'p',accountId:'a',name:'SYNTHETIC ETH',kind:'crypto',quantity:'1',price:'1',wallet:{enabled:true,chain:'evm',address,chainId:1,decimals:18}},m));
  m.settings.autoRefresh=false;const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
 },A);
 await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
 const action=page.locator('[data-action="wallet-history"][data-id="eth"]');
 for(const details of await action.locator('xpath=ancestor::details').all())await details.evaluate(el=>el.open=true);
 await action.click();const dialog=page.locator('#walletHistoryDialog');
 await dialog.locator('[data-history="start"]').click();await dialog.locator('[data-history="accept"]').waitFor({state:'visible',timeout:15000});
 await dialog.locator('[data-history="accept"]').click();
 await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('dauerhaft gespeichert'));
 const record=()=>page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js'),db=await openPortfolioDB();
  try{return JSON.parse((await readPortfolioRecord(db)).raw);}finally{db.close();}
 });
 const baseline=await record();assert.equal(baseline.walletHistory.sessions.length,1);
 networkFail=true;await dialog.locator('[data-history="start"]').click();
 await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Fortsetzen ist möglich'));
 assert.equal(await dialog.locator('[data-history="resume"]').isEnabled(),true);
 networkFail=false;eth=provider({cursors:{'token-transfers':{index:1,untrusted:'SYNTHETIC_UNSUPPORTED'}}});
 await dialog.locator('[data-history="resume"]').click();
 await page.waitForFunction(()=>document.querySelector('#walletHistoryDialog [data-history="status"]').textContent.includes('Bitte neu abrufen'));
 assert.equal(await dialog.locator('[data-history="resume"]').isDisabled(),true);
 assert.equal(await dialog.locator('[data-history="accept"]').isVisible(),false);
 assert.equal(await dialog.locator('[data-history="start"]').evaluate(el=>el===document.activeElement),true);
 for(const width of [320,360,390,412,430,768,1440]){
  await page.setViewportSize({width,height:900});
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth+1||el.getBoundingClientRect().right>innerWidth+1),false);
  assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.querySelector('#walletHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>x.id)),[]);
 }
 const after=await record(),clean=m=>JSON.stringify({...m,walletHistory:{...m.walletHistory,pending:[]}});
 assert.equal(clean(after),clean(baseline));assert.equal(after.walletHistory.pending.length,0);
 console.log(JSON.stringify({test:'v260 real production ETH dialog with synthetic provider responses',engine:'chromium',officialCursorPagination:true,acceptedSyntheticSessionRetained:true,financialFieldsUnchanged:true,transientResume:true,unsupportedCursorRestartOnly:true,restartFocused:true,widths:7,axeScans:7,originalPortfolioAccessed:false,tlsProxyException:!!process.env.HTTPS_PROXY}));
}finally{await browser.close();}
