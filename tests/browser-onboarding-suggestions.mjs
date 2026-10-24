import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 const noApiCalls=[];
 page.on('request',req=>{if(/^https?:\/\/(api\.|eodhd\.com|financialmodelingprep)/.test(req.url()))noApiCalls.push(req.url());});
 await page.locator('#addProvider').click();
 await page.locator('#providerName').fill('f');
 await page.locator('#providerMatches [data-provider-preset="Flatex"]').waitFor();
 await page.locator('#providerMatches [data-provider-preset="Flatex"]').click();
 assert.equal(await page.locator('#providerName').inputValue(),'Flatex');
 assert.equal(await page.locator('#providerType').inputValue(),'broker');
 await page.locator('#saveDialog').click();
 await page.locator('#addAccount').click();
 assert.equal(await page.locator('#accountName').inputValue(),'Wertpapierdepot');
 assert.equal(await page.locator('#accountType').inputValue(),'securities');
 await page.locator('#saveDialog').click();
 await page.locator('#addProvider').click();
 await page.locator('#providerName').fill('n2');
 await page.locator('#providerMatches [data-provider-preset="N26"]').click();
 assert.equal(await page.locator('#providerType').inputValue(),'bank');
 await page.locator('#saveDialog').click();
 await page.locator('#addAccount').click();
 const providerSelect=page.locator('#accountProvider');
 const n26Value=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).providers.find(p=>p.name==='N26').id);
 await providerSelect.selectOption(n26Value);
 assert.equal(await page.locator('#accountName').inputValue(),'Girokonto');
 assert.equal(await page.locator('#accountType').inputValue(),'checking');
 await page.locator('#accountName').fill('Tagesgeldkonto');
 await page.locator('#accountMatches [data-account-preset="Tagesgeldkonto"]').click();
 assert.equal(await page.locator('#accountType').inputValue(),'savings');
 await page.locator('#saveDialog').click();
 assert.equal(noApiCalls.length,0,'Onboarding suggestions are fully offline');
 await page.evaluate(()=>{
  const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));
  m.settings.eodhdKey='test-key';m.settings.autoRefresh=false;
  localStorage.setItem('foliolab-open-v1',JSON.stringify(m));
 });
 await page.route('https://eodhd.com/api/search/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
  {Code:'GLBL',Exchange:'XETRA',Name:'Generic Global ETF',Type:'ETF',Currency:'EUR',ISIN:'IE00A1234567'},
  {Code:'GLBL',Exchange:'LSE',Name:'Generic Global ETF',Type:'ETF',Currency:'GBP',ISIN:'IE00A1234567'}
 ])}));
 await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 const providerId=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).providers.find(p=>p.name==='Flatex').id);
 const accountId=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).accounts.find(a=>a.name==='Wertpapierdepot').id);
 await page.locator('#wizardProvider').selectOption(providerId);
 await page.locator('#wizardAccount').selectOption(accountId);
 assert.equal(await page.locator('#wizardProvider option').filter({hasText:'Flatex'}).count(),1);
 assert.equal(await page.locator('#wizardAccount option').filter({hasText:'Wertpapierdepot'}).count(),1);
 await page.locator('#wizardName').fill('Generic Global ETF');
 await page.locator('#wizardSymbol').fill('GLBL');
 await page.locator('#wizardIsin').fill('IE00A1234567');
 await page.locator('.wizard-manual details').evaluate(el=>el.open=true);
 await page.locator('#wizardExchange').fill('Xetra');
 await page.locator('#wizardMic').fill('XETR');
 await page.locator('#wizardQuantity').fill('7.5');
 await page.locator('#wizardCurrentPrice').fill('100');
 await page.locator('#wizardNext').click();
 await page.locator('#wizardPortfolio').click();
 const model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 const added=model.positions.find(p=>p.name==='Generic Global ETF');
 assert.ok(added);
 assert.equal(added.quantityExact,'7.5');
 assert.equal(added.priceExact,'100');
 assert.equal(model.providers.length,2);
 assert.equal(model.accounts.length,2);
 assert.equal(model.providers.find(p=>p.name==='Flatex').type,'broker');
 assert.equal(model.providers.find(p=>p.name==='N26').type,'bank');
 assert.equal(model.accounts.find(a=>a.name==='Tagesgeldkonto').type,'savings');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'horizontal overflow at '+width+': '+overflow);
 }
 // Existing holdings must stay valid after reopening and filtering selection.
 await page.locator('[data-action="edit-position"]').first().click();
 const previousProvider=await page.locator('#positionProvider').inputValue();
 const previousAccount=await page.locator('#positionAccount').inputValue();
 await page.locator('#positionPickerSearch > summary').click();
 await page.locator('#positionProviderSearch').fill('n2');
 assert.equal(await page.locator('#positionProvider option').count(),1);
 assert.equal(await page.locator('#positionProvider').inputValue(),'','Filter must not select another provider');
 await page.locator('#saveDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'Cannot silently save an unconfirmed match');
 await page.locator('#positionProviderSearch').fill('');
 assert.equal(await page.locator('#positionProvider option').count(),2);
 assert.equal(await page.locator('#positionProvider').inputValue(),previousProvider,'Provider restored after filtering');
 assert.equal(await page.locator('#positionAccount').inputValue(),previousAccount,'Account restored after filtering');
 await page.locator('#positionAccountSearch').fill('not-a-real-account');
 assert.equal(await page.locator('#positionAccount').inputValue(),'','Filtered account must not become implicit selection');
 await page.locator('#positionAccountSearch').fill('');
 assert.equal(await page.locator('#positionAccount').inputValue(),previousAccount,'Account restored when filter clears');
 console.log('ONBOARDING: offline Flatex/broker and N26/bank, account type suggestions, searchable position dropdowns, ETF field autofill and responsive widths PASS');
}finally{await browser.close();}
