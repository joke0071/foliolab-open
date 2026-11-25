import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';

const base=process.env.FOLIOLAB_QA_URL||'http://127.0.0.1:4188/';
const files=process.argv.slice(2);
assert.equal(files.length,2,'Pass the two pinned NEAR RPC response paths');
const sha=value=>createHash('sha256').update(value).digest('hex');
const texts=await Promise.all(files.map(file=>readFile(file,'utf8')));
const [pinned,independent]=texts.map(text=>JSON.parse(text).result);
assert.deepEqual(pinned,independent);
assert.equal(pinned.block_hash,'46T9tEfWAKA38k1NSSeH2G5KBuzMCFTmhfv5M13dCFLH');
assert.equal(pinned.amount,'145768498431409676817125837316');
const scale=10n**24n;
function decimal(raw){
 const value=BigInt(raw);
 const fraction=String(value%scale).padStart(24,'0').replace(/0+$/,'');
 return String(value/scale)+(fraction?'.'+fraction:'');
}
function yocto(value){
 const [whole,fraction='']=value.split('.');
 assert.ok(fraction.length<=24);
 return String(BigInt(whole)*scale+BigInt(fraction.padEnd(24,'0')));
}
const representable={amount:'2500000000000000000000000',locked:'1250000000000000000000000'};
const expected=[decimal(representable.amount),decimal(representable.locked)];
const engine=process.env.FOLIOLAB_QA_ENGINE||'chromium';
const browserType={chromium,firefox,webkit}[engine];
assert.ok(browserType,'Unknown test browser');
const executablePath=process.env.FOLIOLAB_QA_BROWSER_EXECUTABLE;
const browser=await browserType.launch({
 headless:true,
 ...(engine==='chromium'?{args:['--no-sandbox']}:{}),
 ...(executablePath?{executablePath}:{})
});
const read=page=>page.evaluate(async()=>{
 const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
 const db=await openPortfolioDB();
 try{return await readPortfolioRecord(db);}finally{db.close();}
});
const ready=page=>page.waitForFunction(()=>document.getElementById('appStartup')?.hidden);
const nav=(page,key)=>page.locator('#mobileNav [data-page='+key+']').click();
const requests=[];
const errors=[];
async function open(){
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin)return route.continue();
  if(url.origin==='https://rpc.mainnet.fastnear.com'){
   const {params}=route.request().postDataJSON();
   assert.deepEqual(params,{request_type:'view_account',account_id:params.account_id,finality:'final'});
   requests.push(params.account_id);
   const result=params.account_id==='aurora'?pinned:representable;
   return route.fulfill({json:{jsonrpc:'2.0',id:1,result},headers:{'access-control-allow-origin':'*'}});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('dialog',dialog=>dialog.accept());
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await ready(page);
 return page;
}
function checkPositions(model){
 const positions=model.positions.map(({wallet,quantityExact})=>[wallet.chain,quantityExact,yocto(quantityExact)]);
 assert.deepEqual(positions,[['near',expected[0],representable.amount],['near-locked',expected[1],representable.locked]]);
 return positions;
}
try{
 const page=await open();
 await nav(page,'positions');
 async function scan(account){
  await page.locator('#scanNetwork').selectOption('near');
  await page.locator('#scanAddress').fill(account);
  await page.locator('#scanWalletButton').click();
 }
 await page.locator('#addWallet').click();
 await scan('fixture.near');
 await page.locator('#walletScanResults [data-wallet-asset]').last().waitFor();
 const preview=await page.locator('#walletScanResults .wallet-scan-row').allInnerTexts();
 assert.equal(preview.length,2);
 assert.match(preview[0],/2,5/);
 assert.match(preview[1],/1,25/);
 await page.locator('#saveDialog').click();
 await page.locator('#editDialog').waitFor({state:'hidden'});
 const saved=await read(page);
 const savedPositions=checkPositions(JSON.parse(saved.raw));
 await page.reload();await ready(page);
 assert.deepEqual(await read(page),saved);
 await nav(page,'positions');
 await page.locator('#addWallet').click();
 await scan('aurora');
 const failure=page.locator('#scanWalletStatus');
 await failure.filter({hasText:'Mehr als 18 Nachkommastellen'}).waitFor();
 const rejection=await failure.innerText();
 assert.equal(await page.locator('#walletScanResults [data-wallet-asset]').count(),0);
 assert.equal(await page.locator('#saveDialog').isDisabled(),true);
 assert.deepEqual(await read(page),saved);
 await page.locator('#cancelDialog').click();
 await page.locator('#editDialog').waitFor({state:'hidden'});
 await nav(page,'more');
 const download=page.waitForEvent('download');
 await page.locator('#exportBackup').click();
 const bytes=await readFile(await (await download).path());
 assert.deepEqual(checkPositions(JSON.parse(bytes)),savedPositions);
 const restored=await open();
 await nav(restored,'more');
 await restored.locator('#backupFile').setInputFiles({name:'near.json',mimeType:'application/json',buffer:bytes});
 await restored.waitForFunction(()=>document.getElementById('backupStatus')?.textContent.includes('wiederhergestellt'));
 assert.equal((await read(restored)).raw,saved.raw);
 await restored.reload();await ready(restored);
 assert.equal((await read(restored)).raw,saved.raw);
 const contract=await page.evaluate(async ({exact,raw})=>{
  const {atomicDecimal,units}=await import('/src/decimal.js');
  const {safeImport,createPosition}=await import('/src/model.js');
  const {ledgerQuantityAudit}=await import('/src/transactions.js');
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  const m=JSON.parse((await readPortfolioRecord(db)).raw);
  db.close();
  const attempts={
   atomicDecimal:()=>atomicDecimal(raw,24),
   units:()=>units(exact),
   createPosition:()=>createPosition({...m.positions[0],quantityExact:exact},m),
   openingRestore:()=>safeImport({...m,openingPositions:[{positionId:m.positions[0].id,source:'observed-opening',asOf:null,quantityExact:exact}]}),
   journalQuantityAudit:()=>ledgerQuantityAudit({...m,openingPositions:[{positionId:m.positions[0].id,quantityExact:exact}]}),
   backupRestore:()=>safeImport({...m,positions:[{...m.positions[0],quantityExact:exact},m.positions[1]]})
  };
  return Object.fromEntries(Object.entries(attempts).map(([name,attempt])=>{
   try{attempt();return [name,null];}catch(error){return [name,error.message];}
  }));
 },{exact:decimal(pinned.amount),raw:pinned.amount});
 for(const result of Object.values(contract))assert.match(result,/18 Nachkommastellen/);
 assert.deepEqual(requests,['fixture.near','aurora']);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({
  main:'7adbf028ff407df2c48f5c8e2e788ed10e8573f0',browser:browser.version(),
  rpc:{block:pinned.block_hash,height:pinned.block_height,responseSHA256:texts.map(sha),amount:pinned.amount,locked:pinned.locked,expected:decimal(pinned.amount),yoctoRemainderAtScale18:String(BigInt(pinned.amount)%1_000_000n)},
  supported:{preview,savedPositions,reopenExact:true,backupSHA256:sha(bytes),freshRestoreExact:true},
  pinned:{rejection,resultRows:0,saveEnabled:false,recordUnchanged:true},contract
 },null,2));
}finally{await browser.close();}
