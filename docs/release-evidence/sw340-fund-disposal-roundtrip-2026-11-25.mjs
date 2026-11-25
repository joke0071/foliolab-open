import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';

const base=process.env.FOLIOLAB_QA_URL||'http://127.0.0.1:4188/';
const source='https://www.bundesfinanzhof.de/de/entscheidung/entscheidungen-online/detail/STRE202610013/';
const sourceBytes=await readFile(process.argv[2]);
const sourceText=sourceBytes.toString().replaceAll('&nbsp;',' ').replaceAll('\u00a0',' ');
for(const value of ['386','39.303,64','39.819,76','69,90','674,70','37,10','39.038,06','446,22']){
 assert.ok(sourceText.includes(value),'Missing BFH value '+value);
}
const sha=value=>createHash('sha256').update(value).digest('hex');
const qty=386n;
const gross=3981976n,basis=3930364n,fee=6990n,tax=67470n,surcharge=3710n,paid=3903806n;
const euro=cents=>{
 const abs=cents<0n?-cents:cents;
 const fraction=String(abs%100n).padStart(2,'0').replace(/0+$/,'');
 return (cents<0n?'-':'')+String(abs/100n)+(fraction?'.'+fraction:'');
};
assert.equal(gross%qty,0n);
assert.equal(gross-fee-tax-surcharge,paid);
assert.equal(gross-basis-fee,44622n);
const pnl=paid-basis;
const oracle={
 quantity:String(qty),historicalBasis:euro(basis),gross:euro(gross),unitPrice:euro(gross/qty),
 fee:euro(fee),withholding:euro(tax),surcharge:euro(surcharge),paid:euro(paid),
 beforeWithholding:euro(gross-basis-fee),afterWithholding:euro(pnl),
 journal:[['asset','-386',euro(-gross)],['cash',euro(paid),euro(paid)],['fee',null,euro(fee)],['tax',null,euro(tax+surcharge)]]
};
const txDate='2018-12-31'; // The ruling identifies the year only.
const csvText=['date;type;position;quantity;price;fee;tax;cashPosition;id',
 [txDate,'sell','fund',qty,oracle.unitPrice,oracle.fee,euro(tax+surcharge),'cash','bfh-fund-sale'].join(';')].join('\n');
const csv={name:'bfh-transcribed-fund-sale.csv',mimeType:'text/csv',buffer:Buffer.from(csvText)};
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
 try{return await readPortfolioRecord(db);}finally{db.close()}
});
const ready=page=>page.waitForFunction(()=>document.getElementById('appStartup')?.hidden);
const nav=(page,key)=>page.locator('#mobileNav [data-page='+key+']').click();
const closed=page=>page.locator('#editDialog').waitFor({state:'hidden'});
const errors=[];
async function open(){
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 const page=await context.newPage();
 page.on('dialog',dialog=>dialog.accept());
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await ready(page);
 return page;
}
async function restore(page,bytes){
 await nav(page,'more');
 await page.locator('#backupFile').setInputFiles({name:'bfh-test.json',mimeType:'application/json',buffer:bytes});
 await page.waitForFunction(()=>document.getElementById('backupStatus')?.textContent.includes('wiederhergestellt'));
}
async function exportFile(page){
 await nav(page,'more');
 const event=page.waitForEvent('download');
 await page.locator('#exportBackup').click();
 return readFile(await (await event).path());
}
function financialState(record){
 const m=JSON.parse(record.raw);
 return {positions:m.positions.map(p=>[p.id,p.quantityExact,p.costBasisExact,p.realizedPnLExact]),
  postings:m.journalEntries.flatMap(j=>j.postings.map(p=>[p.role,p.quantityDeltaExact,p.amountBookEURExact])),
  flows:m.externalCashFlows,bookings:m.bookings.map(b=>[b.type,b.quantityExact,b.amountExactEUR,b.cashPositionId])};
}
try{
 const page=await open();
 const seed=await page.evaluate(({basis,qty,price})=>{
  return import('/src/model.js').then(({blankModel,createProvider,createAccount,createPosition,backup})=>{
   const m=blankModel();
   const provider=createProvider({id:'bfh-broker',name:'BFH Prüffall',type:'broker'});
   m.providers.push(provider);
   const depot=createAccount({id:'bfh-depot',name:'Depot',providerId:provider.id,type:'brokerage',currency:'EUR'},m);
   const settlement=createAccount({id:'bfh-cash',name:'Verrechnung',providerId:provider.id,type:'checking',currency:'EUR'},m);
   m.accounts.push(depot,settlement);
   m.positions.push(createPosition({id:'fund',providerId:provider.id,accountId:depot.id,kind:'fund',name:'Fondsanteile',quantity:qty,costBasisExact:basis,price,currency:'EUR'},m));
   m.positions.push(createPosition({id:'cash',providerId:provider.id,accountId:settlement.id,kind:'cash',name:'Verrechnung EUR',quantity:'0',price:'1',currency:'EUR'},m));
   return backup(m);
  });
 },{basis:oracle.historicalBasis,qty:oracle.quantity,price:oracle.unitPrice});
 await restore(page,Buffer.from(seed));
 await nav(page,'bookings');
 const before=await read(page);
 assert.deepEqual(financialState(before),{positions:[['fund','386',oracle.historicalBasis,null],['cash','0',null,null]],postings:[],flows:[],bookings:[]});
 async function importSale(){
  const previous=await read(page);
  await page.locator('#openCSVImport').click();
  await page.locator('#csvFile').setInputFiles(csv);
  await page.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('1 bereit'));
  assert.deepEqual(await read(page),previous);
  await page.locator('#saveDialog').click();await closed(page);
  const after=await read(page);
  assert.equal(after.revision,previous.revision+1);
  return after;
 }
 const booked=await importSale();
 const expected={positions:[['fund','0','0',oracle.afterWithholding],['cash',oracle.paid,null,null]],postings:oracle.journal,flows:[],
  bookings:[['sell','386',oracle.gross,'cash']]};
 assert.deepEqual(financialState(booked),expected);
 const b=JSON.parse(booked.raw).bookings[0];
 const manage=action=>page.locator('[data-booking-manage='+action+']');
 await manage('select').click();
 await page.locator('[data-booking-select="'+b.id+'"]').check();
 assert.equal(await manage('remove').isDisabled(),true);
 await page.locator('#bookingBlocked-remove summary').first().click();
 for(const detail of await page.locator("#bookingBlocked-remove details details summary").all())await detail.click();
 const blocked=await page.locator('#bookingBlocked-remove').innerText();
 assert.match(blocked,/beleggebundenen Import-|EUR-Geldbuchungen/);
 assert.deepEqual(await read(page),booked);
 await manage('cancel').click();
 await page.locator('#undoCSVImport').click();
 await page.locator('#cancelDialog').click();await closed(page);
 assert.deepEqual(await read(page),booked);
 await page.locator('#undoCSVImport').click();
 await page.locator('#saveDialog').click();await closed(page);
 const undone=await read(page);
 assert.equal(undone.revision,booked.revision+1);
 assert.equal(undone.raw,before.raw);
 const reapplied=await importSale();
 assert.deepEqual(financialState(reapplied),expected);
 const bytes=await exportFile(page);
 const fresh=await open();
 await restore(fresh,bytes);
 const restored=await read(fresh);
 assert.equal(restored.raw,reapplied.raw);
 await fresh.reload();await ready(fresh);
 assert.equal((await read(fresh)).raw,reapplied.raw);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({
  main:'7adbf028ff407df2c48f5c8e2e788ed10e8573f0',browser:browser.version(),
  source,sourceSha256:sha(sourceBytes),case:'BFH VIII R 22/23, Fund disposition in 2018',transactionDayInFixture:txDate,
  dateQualification:'The public ruling specifies the year only. The date is an explicit test placeholder.',
  accountOpeningQualification:'Zero is the fixture cash opening, to test the independently published cash delta.',
  oracle,observed:financialState(booked),individualRemoval:{allowed:false,reason:blocked.replace(/ \[[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\]/g,''),recordUnchanged:true},
  cancelUndoExact:true,batchUndoExact:true,reimportExact:true,backupSha256:sha(bytes),restoreAndReopenExact:true
 },null,2));
}finally{await browser.close();}
