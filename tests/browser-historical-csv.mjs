import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const day=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10);
const getModel=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
async function chooseCSV(csv,accept=true){
 const button=page.locator('[data-action="import-price-history"]');
 if(!await button.isVisible())await page.locator('[data-position-id="etf-csv"] .position-chart-options>summary').click();
 const chooser=page.waitForEvent('filechooser');
 await button.click();
 const picker=await chooser;
 page.once('dialog',dialog=>accept?dialog.accept():dialog.dismiss());
 await picker.setFiles({name:'prices.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')});
}
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(()=>import('/src/model.js').then(({blankModel,createProvider,createAccount,createPosition,persist})=>{
  const m=blankModel(),provider=createProvider({name:'Bank'});m.providers.push(provider);
  const account=createAccount({name:'Depot',providerId:provider.id},m);m.accounts.push(account);
  m.positions.push(createPosition({id:'etf-csv',kind:'etf',symbol:'5MVL',isin:'IE00BG0SKF03',name:'EM Value',
    currency:'EUR',quantity:'10',price:'86.19',providerId:provider.id,accountId:account.id},m));
  persist(m);
 }));
 await page.reload();
 await page.locator('#providerOverview .provider-accordion>summary').click();
 await page.locator('[data-position-id="etf-csv"]>summary').click();
 assert.match(await page.locator('.position-history-unavailable').innerText(),/Kein nativer Kursverlauf/);
 const csv='Datum;Schlusskurs;ISIN;Währung\n'+day(5)+';82,2;IE00BG0SKF03;EUR\n'+day(2)+';85,1;IE00BG0SKF03;EUR\n'+day(1)+';86,2;IE00BG0SKF03;EUR';
 const before=await getModel();
 await chooseCSV(csv);
 await page.locator('.position-history-chart .chart-plot').waitFor();
 const after=await getModel();
 assert.equal(after.priceHistories['etf-csv'].points.length,3);
 assert.equal(after.positions[0].quantityExact,before.positions[0].quantityExact);
 assert.equal(after.positions[0].price,before.positions[0].price);
 assert.match(await page.locator('[data-position-id="etf-csv"]').innerText(),/nicht unabhängig verifiziert/);
 await page.locator('.position-history-chart .chart-plot').focus();
 await page.keyboard.press('End');
 assert.match(await page.locator('.position-history-chart .chart-tooltip').innerText(),/86,20/);
 await page.locator('[data-position-range="7"]').click();
 await page.locator('.position-history-chart .chart-plot').waitFor();
 // Cancel replacement: current chart and saved prices stay unchanged.
 await chooseCSV('Date,Close\n'+day(4)+',100\n'+day(1)+',101',false);
 assert.equal((await getModel()).priceHistories['etf-csv'].points.at(-1).total,86.2);
 await page.locator('#mobileNav [data-page="history"]').click();
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 const row=page.locator('[data-position-id="etf-csv"]');
 assert.equal(await row.getAttribute('open'),'');
 await row.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await row.innerText(),/CSV-Daten/);
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'CSV import details overflow at '+width);
 }
 await row.locator('.position-chart-options>summary').click();
 page.once('dialog',d=>d.accept());
 await page.locator('[data-action="remove-price-history"]').click();
 assert.equal((await getModel()).priceHistories['etf-csv'],undefined);
 await page.locator('.position-history-unavailable').waitFor();
 console.log('CSV PRICE HISTORY: private offline import, chart, cancellation, deletion, mobile widths and unchanged holdings PASS');
}finally{await browser.close();}
