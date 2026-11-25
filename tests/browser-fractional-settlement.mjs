import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {openApp,readAppState,importPasswordFile} from './flh04-backup-app.mjs';

const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const origin='https://forum.portfolio-performance.info/t/15433/28';
const password='Public settlement reference 2022';
const model=blankModel();
model.providers.push(createProvider({id:'broker',name:'Testdepot',type:'broker'}));
for(const [id,type] of [['depot','securities'],['eur','checking']]){
 model.accounts.push(createAccount({id,type,name:id,providerId:'broker'},model));
}
// Only the published fraction enters the isolated fixture. The broker gives
// 12.4990418 EUR per share and 1.85 EUR gain on 9.46 EUR gross, i.e. 7.61 EUR basis.
for(const [id,accountId,kind,quantity,price,costBasisExact] of [
 ['euroapi','depot','stock','0.609','15.537607','7.61'],['cash','eur','cash','0','1',null]]){
 model.positions.push(createPosition({id,name:id,kind,quantity,price,costBasisExact,accountId,providerId:'broker',currency:'EUR'},model));
}
const file=raw=>({name:'euroapi-test.json',mimeType:'application/json',buffer:Buffer.from(raw)});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch();
 try{
  const context=await browser.newContext(),page=await openApp(context,base);
  await page.evaluate(async seed=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const storage=new PortfolioStorage();
   try{await storage.initialize();await storage.save(seed);}finally{storage.close();}
  },model);
  await page.reload();
  await page.locator('#sidebarNav [data-page=bookings]').click();
  await page.locator('#addBooking').click();
  await page.locator('#bookingPosition').selectOption('euroapi');
  await page.locator('#bookingType').selectOption('sell');
  const field=name=>page.locator('#editorForm [name="'+name+'"]');
  await field('date').fill('2022-07-01');
  await field('quantity').fill('0,609');
  await field('unitPrice').fill('15,537607');
  await page.locator('#bookingCash').selectOption('cash');
  await page.locator('#bookingAdvanced summary').click();
  await field('taxEUR').fill('0,51');
  await page.locator('#bookingFraction summary').click();
  await field('fractionGrossEUR').fill('9,46');
  await field('fractionNetEUR').fill('8,96');
  const previous=(await readAppState(page)).portfolio;
  await page.locator('#saveDialog').click();
  await page.locator('#dialogError:not(.hidden)').waitFor();
  assert.deepEqual((await readAppState(page)).portfolio,previous);
  await field('fractionNetEUR').fill('8,95');
  await page.locator('.booking-notes summary').click();
  await field('notes').fill('EUROAPI · Ausführung 29.06.2022 · '+origin);
  await page.locator('#saveDialog').click();
  await page.locator('#editDialog').waitFor({state:'hidden'});
  const accepted=(await readAppState(page)).portfolio;
  assert.equal(accepted.revision,previous.revision+1);
  const m=JSON.parse(accepted.raw);
  assert.deepEqual(m.positions.map(p=>p.quantityExact),['0','8.95']);
  assert.equal(m.positions[0].costBasisExact,'0');
  assert.equal(m.positions[0].realizedPnLExact,'1.34');
  assert.deepEqual(m.journalEntries[0].postings.map(p=>p.amountBookEURExact),['-9.46','8.95','0.51']);
  assert.equal(m.externalCashFlows.length,0);
  const restored=await openApp(await browser.newContext(),base);
  const encrypted=await page.evaluate(async({raw,password})=>{
   const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');
   await configureBackupPassword(password,password);
   return encryptWithBackupPassword(raw);
  },{raw:accepted.raw,password});
  await importPasswordFile(restored,file(encrypted),password,{replacement:'accept'});
  const recovered=JSON.parse((await readAppState(restored)).portfolio.raw);
  assert.deepEqual(recovered.bookings,m.bookings);
  assert.deepEqual(recovered.journalEntries,m.journalEntries);
  assert.deepEqual(recovered.positions,m.positions);
  console.log('FRACTIONAL_SETTLEMENT_PASS',engine,'0.609 shares, 9.46 gross, 0.51 tax, 8.95 net, 1.34 realized, fresh restore');
 }finally{await browser.close();}
}
