import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';
import {manageList} from './browser-management-mode.mjs';

const base=process.env.FOLIOLAB_FUND_QA_URL||'http://127.0.0.1:4173/';
const oracle={
 source:'https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/',
 fixture:{date:'2018-12-31',openingCash:'0',independentDeposit:'25.51'},
 quantity:'386',basis:'39303.64',gross:'39819.76',fee:'69.9',tax:'711.8',cash:'39038.06',result:'-265.58',
 postings:[['asset','-386','-39819.76'],['cash','39038.06','39038.06'],['fee',null,'69.9'],['tax',null,'711.8']]
};
const csv={name:'bfh-transcribed-fund-sale.csv',mimeType:'text/csv',buffer:Buffer.from(
 'date;type;position;quantity;price;fee;tax;cashPosition;id\n'+
 [oracle.fixture.date,'sell','fund',oracle.quantity,'103.16',oracle.fee,oracle.tax,'cash','bfh-fund-sale'].join(';')
)};
const read=page=>page.evaluate(async()=>{
 const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
 const db=await openPortfolioDB();
 try{return await readPortfolioRecord(db);}finally{db.close();}
});
const ready=page=>page.waitForFunction(()=>document.getElementById('appStartup')?.hidden);
const nav=(page,key)=>page.locator('#mobileNav [data-page='+key+']').click();
const closed=page=>page.locator('#editDialog').waitFor({state:'hidden'});
const tool=(page,key)=>page.locator('[data-booking-manage='+key+']');
const amounts=(model,id)=>{
 const p=model.positions.find(p=>p.id===id);
 return [p.quantityExact,p.costBasisExact,p.realizedPnLExact];
};
async function restore(page,buffer){
 await nav(page,'more');
 await page.locator('#backupFile').setInputFiles({name:'bfh-test.json',mimeType:'application/json',buffer});
 await page.waitForFunction(()=>document.getElementById('backupStatus')?.textContent.includes('wiederhergestellt'));
}
async function selectCSV(page){
 await nav(page,'bookings');
 await page.locator('#openCSVImport').click();
 await page.locator('#csvFile').setInputFiles(csv);
}
async function removePreview(page,id){
 await manageList(page,'bookings');
 await page.locator('[data-booking-row-action=edit][data-id="'+id+'"]').click();
 assert.equal(await page.locator('[name=quantity]').isDisabled(),true);
 await page.locator('#deleteBooking').click();
 await page.locator('[name=reason]').fill('BFH VIII R 22/23');
 await page.locator('#saveDialog').click();
 await page.locator('[name=confirmBookingChange]').waitFor();
 const preview=await page.locator('#dialogFields').innerText();
 for(const text of ['0 → 386','39303.64','39038.06 → 0','69.9 → 0','711.8 → 0'])assert.ok(preview.includes(text),preview);
}
async function checkReimport(page){
 const previous=await read(page);
 await selectCSV(page);
 await page.locator('#csvReview').getByText(/ausdrücklich gelöschte Importbuchung/).first().waitFor();
 assert.equal(await page.locator('#saveDialog').isDisabled(),true);
 await page.locator('#cancelDialog').click();
 await closed(page);
 assert.deepEqual(await read(page),previous);
}
const results=[];
for(const engine of (process.env.BOOKING_MANAGEMENT_ENGINES||'chromium').split(',')){
 const executablePath=process.env['FOLIOLAB_FUND_QA_'+engine.toUpperCase()];
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,executablePath});
 const errors=[];
 const context=()=>browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
 async function open(ctx){
  const page=await ctx.newPage();
  page.on('dialog',dialog=>dialog.accept());
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await ready(page);
  return page;
 }
 async function book(ctx,withCheckpoint){
  const page=await open(ctx);
  const buffer=await page.evaluate(async({oracle,withCheckpoint})=>{
   const {blankModel,createProvider,createAccount,createPosition,backup}=await import('/src/model.js');
   const {executeTransaction}=await import('/src/transactions.js');
   const model=blankModel();
   model.settings.autoRefresh=false;
   const provider=createProvider({id:'bfh-broker',name:'BFH Prüffall',type:'broker'});
   model.providers.push(provider);
   for(const [id,name,type,currency] of [
    ['depot','Depot','securities','EUR'],['settlement','Verrechnung','checking','EUR'],
    ['separate','Unabhängiges Konto','checking','EUR'],['usd','Separates USD-Konto','checking','USD']
   ])model.accounts.push(createAccount({id,name,type,currency,providerId:provider.id},model));
   for(const [id,name,accountId,kind,quantity,price,costBasisExact,currency] of [
    ['fund','Fondsanteile','depot','fund',oracle.quantity,'103.16',oracle.basis,'EUR'],
    ['cash','Verrechnung EUR','settlement','cash',oracle.fixture.openingCash,'1',null,'EUR'],
    ['other-cash','Unabhängiges Guthaben','separate','cash','100','1',null,'EUR'],
    ...(!withCheckpoint?[['unknown-fx','USD ohne EUR-Kurs','usd','cash','1','1',null,'USD']]:[])
   ])model.positions.push(createPosition({id,name,accountId,kind,quantity,price,costBasisExact,currency,providerId:provider.id},model));
   executeTransaction(model,{id:'independent-deposit',positionId:'other-cash',type:'deposit',quantity:oracle.fixture.independentDeposit,date:'2019-01-02',unitPrice:'1'});
   return backup(model);
  },{oracle,withCheckpoint});
  await restore(page,Buffer.from(buffer));
  const before=await read(page);
  await selectCSV(page);
  await page.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('1 bereit'));
  assert.deepEqual(await read(page),before);
  await page.locator('#saveDialog').click();
  await closed(page);
  const booked=await read(page),model=JSON.parse(booked.raw);
  const sale=model.bookings.find(b=>b.type==='sell');
  const journal=model.journalEntries.find(j=>j.id===sale.journalEntryId);
  assert.equal(booked.revision,before.revision+1);
  assert.deepEqual(amounts(model,'fund'),['0','0',oracle.result]);
  assert.deepEqual(amounts(model,'cash'),[oracle.cash,null,null]);
  assert.deepEqual(journal.postings.map(p=>[p.role,p.quantityDeltaExact,p.amountBookEURExact]),oracle.postings);
  assert.equal(model.snapshots.length,withCheckpoint?1:0);
  assert.deepEqual(model.externalCashFlows,JSON.parse(before.raw).externalCashFlows);
  return {page,before,booked,model,sale,journal};
 }
 try{
  const protectedContext=await context();
  const protectedCase=await book(protectedContext,true);
  const protectedPage=protectedCase.page;
  await manageList(protectedPage,'bookings');
  await protectedPage.locator('[data-booking-row-action=edit][data-id="'+protectedCase.sale.id+'"]').click();
  assert.equal(await protectedPage.locator('#deleteBooking').isDisabled(),true);
  assert.match(await protectedPage.locator('#dialogFields').textContent(),/Spätere Kontrollpunkte/);
  await protectedPage.locator('#cancelDialog').click();
  await closed(protectedPage);
  await protectedPage.locator('[data-booking-select="'+protectedCase.sale.id+'"]').check();
  assert.equal(await tool(protectedPage,'remove').isDisabled(),true);
  // The write entry point also rechecks the original checkpoint.
  await tool(protectedPage,'remove').dispatchEvent('click');
  await protectedPage.locator('[name=reason]').fill('BFH Gegenprobe');
  await protectedPage.locator('#saveDialog').click();
  await protectedPage.waitForFunction(()=>document.getElementById('dialogTitle')?.textContent==='Buchungsänderung prüfen');
  assert.equal(await protectedPage.locator('#saveDialog').isVisible(),false);
  await protectedPage.locator('#editorForm').evaluate(e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await protectedPage.locator('#dialogError:not(.hidden)').waitFor();
  assert.deepEqual(await read(protectedPage),protectedCase.booked);
  await protectedContext.close();

  const ctx=await context(),{page,before,booked,model,sale,journal}=await book(ctx,false);
  await removePreview(page,sale.id);
  await page.locator('#cancelDialog').click();
  await closed(page);
  assert.deepEqual(await read(page),booked,'cancel preserves bytes and revision');

  await removePreview(page,sale.id);
  await page.locator('[name=confirmBookingChange]').check();
  const peer=await open(ctx);
  await nav(peer,'bookings');
  await manageList(peer,'bookings');
  await peer.locator('[data-booking-row-action=edit][data-id=independent-deposit]').click();
  await peer.locator('[name=reason]').fill('Parallele unabhängige Änderung');
  await peer.locator('[name=notes]').fill('Parallel bestätigt');
  await peer.locator('#saveDialog').click();
  await peer.locator('[name=confirmBookingChange]').check();
  await peer.locator('#saveDialog').click();
  await closed(peer);
  const winner=await read(page);
  assert.equal(winner.revision,booked.revision+1);
  await page.locator('#saveDialog').click();
  await page.locator('#dialogError:not(.hidden)').waitFor();
  assert.deepEqual(await read(page),winner,'stale submission must preserve the winning bytes and revision');
  await peer.close();

  await page.reload();
  await ready(page);
  await nav(page,'bookings');
  await removePreview(page,sale.id);
  await page.locator('[name=confirmBookingChange]').check();
  await page.locator('#saveDialog').click();
  await closed(page);
  const committed=await read(page),after=JSON.parse(committed.raw),winnerModel=JSON.parse(winner.raw);
  assert.equal(committed.revision,winner.revision+1);
  assert.deepEqual(amounts(after,'fund'),[oracle.quantity,oracle.basis,null]);
  assert.deepEqual(amounts(after,'cash'),[oracle.fixture.openingCash,null,null]);
  assert.deepEqual(after.positions.filter(p=>!['fund','cash'].includes(p.id)),model.positions.filter(p=>!['fund','cash'].includes(p.id)));
  assert.deepEqual(after.bookings,winnerModel.bookings.filter(b=>b.id!==sale.id));
  assert.deepEqual(after.externalCashFlows,JSON.parse(before.raw).externalCashFlows);
  assert.deepEqual(after.openingPositions,winnerModel.openingPositions);
  const audit=after.journalEntries.at(-1);
  assert.deepEqual(after.journalEntries.slice(0,-1),winnerModel.journalEntries.filter(j=>j.id!==journal.id));
  assert.deepEqual(audit.managementAudit.originals,[{booking:sale,journal,flows:[]}]);
  assert.deepEqual(audit.managementAudit.afterBookings,[null]);
  assert.deepEqual(audit.postings.map(p=>[p.role,p.quantityDeltaExact,p.amountBookEURExact]),[['documentation',null,'0']]);
  await checkReimport(page);
  await nav(page,'more');
  const download=page.waitForEvent('download');
  await page.locator('#exportBackup').click();
  const bytes=await readFile(await (await download).path());
  const freshContext=await context(),fresh=await open(freshContext);
  await restore(fresh,bytes);
  assert.equal((await read(fresh)).raw,committed.raw);
  await fresh.reload();
  await ready(fresh);
  assert.equal((await read(fresh)).raw,committed.raw);
  await checkReimport(fresh);
  assert.deepEqual(errors,[]);
  results.push({
   engine,browser:browser.version(),status:'PASS',fund:amounts(after,'fund'),settlement:amounts(after,'cash'),
   removedPostings:oracle.postings,remainingExternalFlows:after.externalCashFlows,
   checkpointProtected:true,abortedUnchanged:true,staleUnchanged:true,requestedSaleOnly:true,
   removedRevision:committed.revision,previousRevision:winner.revision,reimportBlocked:true,
   restoreExact:true,reopenExact:true,reimportBlockedAfterRestore:true,
   backupSha256:createHash('sha256').update(bytes).digest('hex')
  });
  await freshContext.close();
  await ctx.close();
  console.log(engine+': fund-sale management, independent cash flow, checkpoint, cancel, stale CAS, reimport and restore PASS');
 }finally{await browser.close();}
}
await mkdir('artifacts/gates',{recursive:true});
await writeFile('artifacts/gates/fund-sale-removal.json',JSON.stringify({oracle,results},null,2));
