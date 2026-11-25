import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';
import {replayVerifiedFixtureAssets,verifiedFixtureRelease} from './verified-fx-release.mjs';
import {clickDisclosed} from './browser-disclosures.mjs';
import {importPasswordFile,openApp,openBackupControls,readAppState,saveTargetBackup} from './flh04-backup-app.mjs';

const origin=process.env.COSMOS_HISTORY_BASE||process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const published=verifiedFixtureRelease(origin);
const address='cosmos1nx3yrqs5v5wz9yygplleswu5tn9e4r8zcgncar';
const password='Cosmos public reference test backup';
const csv={name:'already-scanned-reward.csv',mimeType:'text/csv',buffer:Buffer.from(
 'date;type;position;quantity;id\n2026-11-25;reward;Cosmos Hub;0.536836;F0F894B8B64F022FAFCBED0C0CC87F9F8E7EBABDB79DF4CBEBF4553F02B9569D'
)};
const holdings=[
 ['cosmosvaloper1fsg635n5vgc7jazz9sx5725wnc3xqgr7awxaag','507155712'],
 ['cosmosvaloper1wrx0x9m9ykdhw9sg04v7uljme53wuj03aa5d4f','684791623']
];
const entries=holdings.map(([validator_address,amount])=>({delegation:{validator_address},balance:{denom:'uatom',amount}}));

for(const engine of (process.env.HISTORY_ENGINES||process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true});
 const directory=await mkdtemp(join(tmpdir(),'foliolab-cosmos-'));
 const file=join(directory,'backup.json');
 async function isolated({restore=false}={}){
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===new URL(origin).origin)return route.continue();
   if(url.hostname!=='rest.cosmos.directory')return route.abort();
   const json=url.pathname.includes('/bank/')?{balance:{denom:'uatom',amount:'811172'}}:
    url.pathname.endsWith('/delegations/'+address)?{delegation_responses:entries,pagination:{next_key:null}}:
    {unbonding_responses:[],pagination:{next_key:null}};
   return route.fulfill({json,headers:{'access-control-allow-origin':'*'}});
  });
  if(restore&&published)await replayVerifiedFixtureAssets(context,origin,published);
  return openApp(context,origin);
 }
 const record=async page=>(await readAppState(page)).portfolio;
 const nav=(page,id)=>page.locator('#sidebarNav [data-page='+id+']').click();
 async function scan(page){
  await nav(page,'positions');
  await page.locator('#addWallet').click();
  await page.locator('#scanNetwork').selectOption('cosmos');
  await page.locator('#scanAddress').fill(address);
  await page.locator('#scanWalletButton').click();
  await page.locator('input[data-wallet-asset]').nth(2).waitFor();
  await page.locator('#saveDialog').click();
  await page.locator('#editDialog').waitFor({state:'hidden'});
 }
 async function history(page,id){
  await nav(page,'positions');
  await clickDisclosed(page.locator('[data-action=wallet-history][data-id="'+id+'"]'));
  return page.locator('#walletHistoryDialog');
 }
 async function confirm(dialog){
  await dialog.locator('[data-history=start]').click();
  await dialog.getByRole('heading',{name:'Reward-Vorschau'}).waitFor();
  assert.equal(await dialog.getByText('Ausgezahlter Staking-Reward',{exact:true}).count(),1);
  await dialog.locator('[data-history=accept]').click();
  await dialog.getByRole('heading',{name:'Gespeicherte Historie'}).waitFor();
 }
 try{
  const page=await isolated();
  await scan(page);
  const before=await record(page),model=JSON.parse(before.raw),liquid=model.positions.find(p=>p.wallet.chain==='cosmos');
  assert.equal(liquid.quantityExact,'0.811172');
  assert.equal(model.positions.filter(p=>p.wallet.chain==='cosmos-stake').length,2);
  assert.equal(await page.locator('[data-action=wallet-history]').count(),1,'only the proved liquid position supports this history');
  const dialog=await history(page,liquid.id);
  await confirm(dialog);
  const accepted=await record(page),withHistory=JSON.parse(accepted.raw);
  const {walletHistory,...finance}=withHistory;
  assert.deepEqual(finance,model);
  assert.equal(accepted.revision,before.revision+1);
  assert.deepEqual(walletHistory.sessions[0].events.map(e=>[e.type,e.quantityBaseUnits,e.blockHeight]),
   [['fee','-6823','34044337'],['staking_reward','536836','34044337']]);
  await confirm(dialog);
  assert.deepEqual(await record(page),accepted,'reimport does not write a second revision');
  await dialog.locator('[data-history=close]').click();
  await scan(page);
  const rescanned=await record(page);
  assert.deepEqual(JSON.parse(rescanned.raw).walletHistory,walletHistory);
  assert.equal(JSON.parse(rescanned.raw).positions.find(p=>p.id===liquid.id).quantityExact,'0.811172');
  await page.reload();
  await (await history(page,liquid.id)).getByRole('heading',{name:'Gespeicherte Historie'}).waitFor();
  await dialog.locator('[data-history=close]').click();

  await nav(page,'bookings');
  await page.locator('#openCSVImport').click();
  await page.locator('#csvFile').setInputFiles(csv);
  await page.locator('#csvReview').getByText(/Automatisch gescannte Wallet-Bestände sind nicht manuell buchbar/).first().waitFor();
  assert.equal(await page.locator('#saveDialog').isDisabled(),true);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#cancelDialog').click();
  await page.locator('#editDialog').waitFor({state:'hidden'});
  assert.deepEqual(await record(page),rescanned);

  await openBackupControls(page);
  await page.locator('#backupPassword').fill(password);
  await page.locator('#backupPasswordConfirm').fill(password);
  await page.locator('#saveBackupPassword').click();
  await page.locator('#backupPasswordForm').waitFor({state:'hidden'});
  await saveTargetBackup(page,file);
  const recovered=await isolated({restore:true});
  await nav(recovered,'more');
  await importPasswordFile(recovered,file,password,{replacement:'accept'});
  await recovered.reload();
  const saved=JSON.parse((await record(recovered)).raw);
  assert.deepEqual(saved,JSON.parse(rescanned.raw));
  const recoveredDialog=await history(recovered,liquid.id);
  await recoveredDialog.getByRole('heading',{name:'Gespeicherte Historie'}).waitFor();
  assert.equal(await recoveredDialog.getByText('Ausgezahlter Staking-Reward',{exact:true}).count(),1);
  console.log('COSMOS_REWARD_PASS '+engine+' 34044337 0.811172 ATOM, one reward, idempotent import, rescan, CSV rejection, reopen, encrypted fresh restore');
 }finally{
  await browser.close();
  await rm(directory,{recursive:true,force:true});
 }
}
