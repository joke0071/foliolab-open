import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850},acceptDownloads:true});
page.on('dialog',dialog=>dialog.accept());
const now=Math.floor(Date.now()/1000),today=new Date().toISOString().slice(0,10);
let externalRequests=0;
await page.route('https://api.coingecko.com/**',async route=>{
 externalRequests++;
 const ids=(new URL(route.request().url()).searchParams.get('ids')||'').split(',');
 const data={};
 for(const id of ids)data[id]={eur:id==='bitcoin'?123.5:15,last_updated_at:id==='bitcoin'?now:now-20*86400};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
});
await page.route('https://api.frankfurter.dev/**',async route=>{
 externalRequests++;
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({date:today,rates:{EUR:0.94}})});
});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist,snapshot}=await import('/src/model.js');
  const m=blankModel(),prov=createProvider({name:'Audit Depot',type:'broker'});m.providers.push(prov);
  const acc=createAccount({providerId:prov.id,name:'Audit Account',type:'securities'},m);m.accounts.push(acc);
  const add=(name,kind,currency,coinId)=>{
   const p=createPosition({providerId:prov.id,accountId:acc.id,name,kind,currency,coinId,
    symbol:kind==='etf'?'VWCE':'',quantity:'0.000000000000000001',price:100,
    fxRate:currency==='USD'?0.9:1},m);
   m.positions.push(p);return p;
  };
  add('Bitcoin Altbestand','crypto','EUR','bitcoin').priceExact='95';
  add('Ethereum veralteter Kurs','crypto','EUR','ethereum').priceExact='80';
  add('USD ETF','etf','USD','').fxRateExact='0.8';
  add('Hohe Preispräzision','crypto','EUR','').priceExact='100.000000000000000001';
  snapshot(m,new Date().toISOString().slice(0,10),'Vor dem Audit');
  persist(m);
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 const provider=page.locator('#providerSettings details').first();
 const market=page.locator('#marketSettings');
 const chevron=async()=>page.evaluate(()=>{
  const opts=selector=>{
   const pseudo=getComputedStyle(document.querySelector(selector),'::after');
   return {content:pseudo.content,width:pseudo.width,height:pseudo.height,
    borderRight:pseudo.borderRightWidth,borderBottom:pseudo.borderBottomWidth,transform:pseudo.transform};
  };
  return {provider:opts('#providerSettings summary'),source:opts('#marketSettings>summary')};
 });
 let arrows=await chevron();
 for(const property of ['content','width','height','borderRight','borderBottom','transform'])
  assert.equal(arrows.provider[property],arrows.source[property],'Chevron '+property+' should match');
 assert.equal(arrows.provider.content,'""','Chevron must be shape, not a Unicode glyph');
 await provider.locator('summary').click();
 await market.locator(':scope > summary').click();
 // CSS transitions animate over 150 ms. Assert the final shared shape,
 // not two different intermediate animation frames.
 await page.waitForTimeout(220);
 arrows=await chevron();
 assert.equal(arrows.provider.transform,arrows.source.transform,'Both disclosure arrows rotate identically on open');
 assert.notEqual(arrows.provider.transform,'none');

 const audit=page.locator('#legacyQuoteAudit');
 await audit.locator(':scope > summary').click();
 assert.equal(await audit.locator('#legacyQuoteAuditResults .legacy-quote-item').count(),0);
 const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 const requestsBefore=externalRequests;
 await page.locator('#runLegacyQuoteAudit').click();
 assert.equal(externalRequests,requestsBefore,'Local scan must make no network requests');
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before,'Local scan cannot alter persisted bytes');
 assert.equal(await audit.locator('.legacy-quote-item').count(),3,'Only three true discrepancies, not 18-decimal rounding');
 assert.match(await page.locator('#legacyQuoteAuditStatus').innerText(),/3 Positionen/);

 const btc=audit.locator('.legacy-quote-item').filter({hasText:'Bitcoin Altbestand'});
 const [firstBackup]=await Promise.all([page.waitForEvent('download'),btc.locator('[data-audit-fix="price"]').click()]);
 assert.match(firstBackup.suggestedFilename(),/foliolab-backup/);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.positions?.some(p=>p.name==='Bitcoin Altbestand'&&p.priceExact==='123.5'));
 let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(state.positions.find(x=>x.name==='Bitcoin Altbestand').priceExact,'123.5');
 assert.equal(state.positions.find(x=>x.name==='Bitcoin Altbestand').quoteSource,'CoinGecko');
 assert.equal(state.snapshots.length,1,'Historical snapshots must be unchanged');
 const eth=audit.locator('.legacy-quote-item').filter({hasText:'Ethereum veralteter Kurs'});
 await eth.locator('[data-audit-fix="price"]').click();
 await page.waitForFunction(()=>String(document.getElementById('toast')?.textContent||'').startsWith('Kursprüfung:'));
 assert.match(await page.locator('#toast').innerText(),/Kursprüfung:|datierten Kurs/);
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(state.positions.find(x=>x.name==='Ethereum veralteter Kurs').priceExact,'80',
  'Stale provider quote cannot change portfolio');

 const fx=audit.locator('.legacy-quote-item').filter({hasText:'USD ETF'});
 const [secondBackup]=await Promise.all([page.waitForEvent('download'),fx.locator('[data-audit-fix="fx"]').click()]);
 assert.match(secondBackup.suggestedFilename(),/foliolab-backup/);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.positions?.some(p=>p.name==='USD ETF'&&p.fxRateExact==='0.94'));
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(state.positions.find(x=>x.name==='USD ETF').fxRateExact,'0.94');
 assert.equal(state.positions.find(x=>x.name==='USD ETF').fxSource,'Frankfurter');
 assert.equal(state.positions.find(x=>x.name==='Ethereum veralteter Kurs').priceExact,'80');
 assert.equal(state.snapshots.length,1);
 await page.reload();await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#legacyQuoteAudit > summary').click();
 await page.locator('#runLegacyQuoteAudit').click();
 assert.equal(await page.locator('#legacyQuoteAuditResults .legacy-quote-item').count(),1,
  'Audited repairs survive reload, stale quote remains reviewable');
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:850});
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
  assert.ok(dims.scroll<=dims.inner+1,'Mobile horizontal overflow at '+width+'px: '+JSON.stringify(dims));
 }
 console.log('LEGACY QUOTE / CHEVRONS: one-shape accordions, read-only scan, provider-confirmed repairs, backups, stale rejection, reload PASS');
}finally{await browser.close();}
