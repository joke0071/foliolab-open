import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,snapshot,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Random community broker'});m.providers.push(p);
  const a=createAccount({name:'Investment account',providerId:p.id,type:'securities'},m);m.accounts.push(a);
  m.settings.autoRefresh=false;m.settings.eodhdKey='test-key';
  m.positions.push(createPosition({id:'etf-new',kind:'etf',symbol:'GLBL',name:'Global Dividend ETF',
    quantity:'123.456789',price:99,currency:'EUR',quoteSource:'Historic backup',quoteAsOf:'2026-10-20',
    providerId:p.id,accountId:a.id},m));
  m.positions.push(createPosition({id:'etf-other',kind:'etf',symbol:'QQQ',name:'Other ETF',
    isin:'US0000000001',quantity:1,price:200,currency:'USD',providerId:p.id,accountId:a.id},m));
  snapshot(m,'2026-10-21','Reference total',{manualTotalEUR:'9999'});
  persist(m);
 });
 await page.route('https://eodhd.com/api/search/**',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify([
   {Code:'GLBL',Exchange:'XETRA',Name:'Global Dividend ETF UCITS',Type:'ETF',Currency:'EUR',ISIN:'IE00A1234567'},
   {Code:'GLBL',Exchange:'LSE',Name:'Global Dividend ETF UCITS',Type:'ETF',Currency:'GBP',ISIN:'IE00A1234567'},
   {Code:'GLBL',Exchange:'XETRA',Name:'Not the same fund',Type:'ETF',Currency:'EUR',ISIN:'IE00B1234567'}
  ])
 }));
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 const review=page.locator('#resolveListings');
 await review.waitFor({state:'visible'});
 assert.match(await review.innerText(),/Zuordnungen prüfen \(2\)/);
 await review.click();
 await page.locator('#securityResults [data-security]').first().waitFor();
 const choices=page.locator('#securityResults [data-security]');
 assert.equal(await choices.count(),3);
 assert.equal(await choices.nth(1).isDisabled(),true,'GBP listing cannot silently alter EUR quoted holdings');
 assert.match(await choices.first().innerText(),/XETR/);
 page.once('dialog',dialog=>{assert.match(dialog.message(),/IE00A1234567/);return dialog.accept();});
 await choices.first().click();
 assert.equal(await page.locator('#editorForm [name="symbol"]').inputValue(),'GLBL');
 assert.equal(await page.locator('#editorForm [name="isin"]').inputValue(),'IE00A1234567');
 assert.equal(await page.locator('#editorForm [name="eodhdSymbol"]').inputValue(),'GLBL.XETRA');
 assert.equal(await page.locator('#editorForm [name="tradingViewSymbol"]').inputValue(),'XETR:GLBL');
 await page.locator('#saveDialog').click();
 const m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.positions.find(p=>p.id==='etf-new').quantityExact,'123.456789');
 assert.equal(m.positions.find(p=>p.id==='etf-new').priceExact,'99');
 assert.equal(m.positions.find(p=>p.id==='etf-new').isin,'IE00A1234567');
 assert.equal(m.positions.find(p=>p.id==='etf-new').quoteSource,null);
 assert.match(m.positions.find(p=>p.id==='etf-new').priceStatus,/Kurs prüfen/);
 assert.equal(m.snapshots.some(s=>s.date==='2026-10-21'&&s.totalEURExact==='9999'),true);
 assert.match(await review.innerText(),/Zuordnungen prüfen \(1\)/);
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'Horizontal overflow at '+width);
 }
 console.log('UNIVERSAL SECURITY LOOKUP: arbitrary ETF, ISIN + venue selection, currency safety, quote status, snapshots and 7 responsive widths PASS');
}finally{await browser.close();}
