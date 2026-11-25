import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {openApp,readAppState,importPasswordFile} from './flh04-backup-app.mjs';

const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const password='Public fractional sale reference';
const cases=[
 {id:'euroapi',currency:'EUR',quantity:'0.609',price:'15.537607',basis:'7.61',date:'2022-07-01',tax:'0.51',
  gross:'9.46',badNet:'8.96',net:'8.95',profit:'1.34',postings:['-9.46','8.95','0.51'],
  note:'EUROAPI · Ausführung 29.06.2022 · https://forum.portfolio-performance.info/t/15433/28'},
 {id:'kenvue',currency:'USD',quantity:'0.0648',price:'21.0032',basis:'1.38',date:'2023-09-01',tax:'0',
  gross:'1.36',quote:'1.089718',badNet:'1.26',net:'1.25',profit:'-0.13',postings:['-1.25','1.25'],
  note:'ING · Stückrestabrechnung · https://github.com/portfolio-performance/portfolio/issues/3711'}
];
function opening(c){
 const model=blankModel();
 model.providers.push(createProvider({id:'broker',name:'Testdepot',type:'broker'}));
 for(const [id,type] of [['depot','securities'],['eur','checking']])
  model.accounts.push(createAccount({id,type,name:id,providerId:'broker'},model));
 model.positions.push(createPosition({id:c.id,name:c.id,kind:'stock',quantity:c.quantity,price:c.price,costBasisExact:c.basis,
  accountId:'depot',providerId:'broker',currency:c.currency},model));
 model.positions.push(createPosition({id:'cash',name:'EUR',kind:'cash',quantity:0,price:1,accountId:'eur',providerId:'broker',currency:'EUR'},model));
 return model;
}
const comma=value=>value.replace('.',',');
const file=raw=>({name:'settlement-test.json',mimeType:'application/json',buffer:Buffer.from(raw)});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch();
 try{
 for(const c of cases){
  const context=await browser.newContext(),page=await openApp(context,base);
  await page.evaluate(async seed=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const storage=new PortfolioStorage();
   try{await storage.initialize();await storage.save(seed);}finally{storage.close();}
  },opening(c));
  await page.reload();
  await page.locator('#sidebarNav [data-page=bookings]').click();
  await page.locator('#addBooking').click();
  await page.locator('#bookingPosition').selectOption(c.id);
  await page.locator('#bookingType').selectOption('sell');
  const field=name=>page.locator('#editorForm [name="'+name+'"]');
  await field('date').fill(c.date);
  await field('quantity').fill(comma(c.quantity));
  await field('unitPrice').fill(comma(c.price));
  await page.locator('#bookingCash').selectOption('cash');
  await page.locator('#bookingAdvanced summary').click();
  await field('taxEUR').fill(comma(c.tax));
  await page.locator('#bookingFraction summary').click();
  await field(c.quote?'fractionGrossUSD':'fractionGrossEUR').fill(comma(c.gross));
  if(c.quote)await field('fractionUSDPerEUR').fill(comma(c.quote));
  await field('fractionNetEUR').fill(comma(c.badNet));
  const previous=(await readAppState(page)).portfolio;
  await page.locator('#saveDialog').click();
  await page.locator('#dialogError:not(.hidden)').waitFor();
  assert.deepEqual((await readAppState(page)).portfolio,previous);
  await field('fractionNetEUR').fill(comma(c.net));
  await page.locator('.booking-notes summary').click();
  await field('notes').fill(c.note);
  await page.locator('#saveDialog').click();
  await page.locator('#editDialog').waitFor({state:'hidden'});
  const accepted=(await readAppState(page)).portfolio;
  assert.equal(accepted.revision,previous.revision+1);
  const m=JSON.parse(accepted.raw);
  assert.deepEqual(m.positions.map(p=>p.quantityExact),['0',c.net]);
  assert.equal(m.positions[0].costBasisExact,'0');
  assert.equal(m.positions[0].realizedPnLExact,c.profit);
  assert.deepEqual(m.journalEntries[0].postings.map(p=>p.amountBookEURExact),c.postings);
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
  if(c.quote){
   assert.equal(recovered.bookings[0].fxRateDate,c.date);
   assert.equal(recovered.bookings[0].fxSource,'Brokerabrechnung USD/EUR 1.089718 · Kurswert 1.36 USD');
   console.log('USD_FRACTIONAL_SETTLEMENT_PASS',engine,'0.0648 shares, 1.36 USD, 1.089718 USD per EUR, 1.25 EUR net, -0.13 realized, fresh restore');
  }else console.log('FRACTIONAL_SETTLEMENT_PASS',engine,'0.609 shares, 9.46 gross, 0.51 tax, 8.95 net, 1.34 realized, fresh restore');
  await context.close();await restored.context().close();
 }
 }finally{await browser.close();}
}
