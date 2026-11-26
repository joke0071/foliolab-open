import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {openApp,reloadApp,readAppState,importPasswordFile} from './flh04-backup-app.mjs';

// Public finalized block 226157919. Independent RPC receipts and the SW340
// rejection are documented in the project’s NEAR precision acceptance record.
const amount='145768498431409676817125837316';
const quantity='145768.498431409676817125837316';
const password='NEAR precision regression backup';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const engines={chromium,firefox,webkit};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch();
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  // Keep the browser's HTTP cache for same-origin product bytes.
  // Only the public RPC response is pinned to the independently verified block.
  await context.addInitScript(amount=>{
   const fetchFromOrigin=window.fetch.bind(window);
   window.fetch=async(input,init)=>{
    const url=new URL(input instanceof Request?input.url:input,location.href);
    if(url.origin===location.origin)return fetchFromOrigin(input,init);
    if(url.href!=='https://rpc.mainnet.fastnear.com/'||init?.method!=='POST')throw TypeError('External request disabled in the NEAR regression test.');
    const {method,params}=JSON.parse(init.body);
    if(method!=='query'||params?.request_type!=='view_account'||params?.account_id!=='aurora'||params?.finality!=='final')
     throw Error('Unexpected request for the archived NEAR balance.');
    return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:{amount,locked:'0',block_height:226157919,
     block_hash:'46T9tEfWAKA38k1NSSeH2G5KBuzMCFTmhfv5M13dCFLH'}}),{headers:{'content-type':'application/json'}});
   };
  },amount);
  const page=await openApp(context,base);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  async function scan(){
   await page.locator('#sidebarNav [data-page=positions]').click();
   await page.locator('#addWallet').click();
   await page.locator('#scanNetwork').selectOption('near');
   await page.locator('#scanAddress').fill('aurora');
   await page.locator('#scanWalletButton').click();
   await page.locator('[data-wallet-asset]').waitFor();
   assert.equal(await page.locator('[data-wallet-asset]').count(),1);
   const label=await page.locator('.wallet-scan-money').innerText();
   assert.match(label,/498431409676817125837316/);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('#saveDialog').click();
   await page.locator('#editDialog').waitFor({state:'hidden'});
  }
  const model=async()=>JSON.parse((await readAppState(page)).portfolio.raw);
  await scan();
  const initial=await model();
  assert.equal(initial.positions[0].quantityExact,quantity);
  assert.equal(initial.positions[0].wallet.decimals,24);
  const before=initial.positions[0].id;
  await scan();await reloadApp(page);
  const rescanned=await model();
  assert.equal(rescanned.positions.length,1);assert.equal(rescanned.positions[0].id,before);
  assert.equal(rescanned.positions[0].quantityExact,quantity);
  assert.equal(rescanned.externalCashFlows.length,0);
  assert.equal(rescanned.bookings.length,0);assert.equal(rescanned.journalEntries.length,0);
  for(const key of ['dashboard','history','positions','bookings','more']){
   await page.locator('#sidebarNav [data-page='+key+']').click();
   await page.locator('#'+key+'Page').waitFor();
  }
  const raw=(await readAppState(page)).portfolio.raw;
  const encrypted=await page.evaluate(async({password,raw})=>{
   const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');
   await configureBackupPassword(password,password);return encryptWithBackupPassword(raw);
  },{password,raw});
  const restored=await openApp(await browser.newContext(),base);
  await importPasswordFile(restored,{name:'near-precision.json',mimeType:'application/json',buffer:Buffer.from(encrypted)},password,{replacement:'accept'});
  const recovered=JSON.parse((await readAppState(restored)).portfolio.raw);
  assert.deepEqual(recovered.positions,rescanned.positions);
  assert.deepEqual(recovered.openingPositions,rescanned.openingPositions);
  assert.deepEqual(errors,[]);
  console.log('NEAR_PRECISION_PASS',engine,amount,'yoctoNEAR, rescan, reopen and fresh encrypted restore');
 }finally{await browser.close();}
}
