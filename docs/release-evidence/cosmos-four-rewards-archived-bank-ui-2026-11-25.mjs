import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [checkout,archive,base,engine,pw]=process.argv.slice(2);
const proof=JSON.parse(await readFile(archive));
const available=proof.archiveBalanceQueries.filter(r=>r.code===0&&r.requestedHeight===proof.height);
assert(new Set(available.map(r=>r.endpoint)).size>=2);
assert(available.every(r=>String(r.freeMicroATOM)===proof.bankAtHeight.freeMicroATOM));
const {openApp,readAppState}=await import(pathToFileURL(resolve(checkout,'tests/flh04-backup-app.mjs')));
const playwright=await import(pathToFileURL(resolve(pw)));
const browser=await playwright[engine].launch();
try{
 const ctx=await browser.newContext({serviceWorkers:'block'});
 let bankReads=0;
 await ctx.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin)return route.continue();
  if(url.hostname==='rest.cosmos.directory'&&url.pathname==='/cosmoshub/cosmos/bank/v1beta1/balances/'+proof.publicWallet+'/by_denom'&&url.searchParams.get('denom')==='uatom'){
   bankReads++;return route.fulfill({json:{balance:{denom:'uatom',amount:proof.bankAtHeight.freeMicroATOM}},headers:{'access-control-allow-origin':'*'}});
  }
  return route.abort();
 });
 const page=await openApp(ctx,base);
 await page.locator('#sidebarNav [data-page=positions]').click();await page.locator('#addWallet').click();
 await page.locator('#scanNetwork').selectOption('cosmos');await page.locator('#scanAddress').fill(proof.publicWallet);await page.locator('#scanWalletButton').click();
 const item=page.locator('input[data-wallet-asset]');await item.first().waitFor();assert.equal(await item.count(),1);assert.equal(await item.isChecked(),true);
 await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
 const get=async()=>JSON.parse((await readAppState(page)).portfolio.raw);
 const model=await get(),p=model.positions.find(p=>p.wallet?.address===proof.publicWallet);
 assert.equal(p.quantityExact,'4.972381');assert.equal(p.wallet.chain,'cosmos');assert.equal(p.symbol,'ATOM');assert(p.accountId);
 assert.equal((model.walletHistory?.sessions??[]).length,0);
 assert.equal(await page.locator('[data-action=wallet-history][data-id="'+p.id+'"]').count(),0);
 await page.reload();await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const after=await get();assert.deepEqual(after.positions.find(x=>x.id===p.id),p);assert.equal(bankReads,1);
 console.log(JSON.stringify({engine,browser:browser.version(),height:proof.height,archivedFreeATOM:p.quantityExact,bankReads,regularScan:true,explicitSave:true,reopen:true,associatedWithLocalAccount:true,historyActionAvailable:false,historicalProductPositionInPreexistingPortfolio:false,fullWalletScanned:false,method:'The local replay adapts an independently archived ABCI bank result to the LCD bank response. Other endpoints are blocked. This case cannot establish ownership or the original state of a project portfolio.'}));
}finally{await browser.close();}
