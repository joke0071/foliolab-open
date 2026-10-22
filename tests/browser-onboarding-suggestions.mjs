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
 await page.locator('#addPosition').click();
 const providerFilter=page.locator('#positionProviderSearch');
 await providerFilter.fill('f');
 assert.equal(await page.locator('#positionProvider option').count(),1);
 assert.match(await page.locator('#positionProvider option').first().innerText(),/Flatex/);
 await page.locator('#positionAccountSearch').fill('wert');
 assert.equal(await page.locator('#positionAccount option').count(),1);
 assert.match(await page.locator('#positionAccount option').first().innerText(),/Wertpapierdepot/);
 assert.ok(await page.locator('#securityGroup').isVisible(),'Search is available at top of manual asset form');
 const securityPosition=await page.evaluate(()=>{
  const g=document.getElementById('securityGroup'),name=document.querySelector('#editorForm [name=name]');
  return g.compareDocumentPosition(name)&Node.DOCUMENT_POSITION_FOLLOWING;
 });
 assert.ok(securityPosition,'Security search precedes manual identity fields');
 await page.locator('#securityQuery').fill('GLBL');
 await page.locator('#securityResults [data-security]').first().waitFor();
 page.once('dialog',d=>d.accept());
 await page.locator('#securityResults [data-security]').first().click();
 const form=page.locator('#editorForm');
 assert.equal(await form.locator('[name=name]').inputValue(),'Generic Global ETF');
 assert.equal(await form.locator('[name=symbol]').inputValue(),'GLBL');
 assert.equal(await form.locator('[name=isin]').inputValue(),'IE00A1234567');
 assert.equal(await form.locator('[name=exchange]').inputValue(),'Xetra');
 assert.equal(await form.locator('[name=mic]').inputValue(),'XETR');
 assert.equal(await form.locator('[name=price]').inputValue(),'0');
 assert.equal(await form.locator('[name=quantity]').inputValue(),'0');
 await form.locator('[name=quantity]').fill('7.5');
 await form.locator('[name=price]').fill('100');
 await page.locator('#saveDialog').click();
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
 await page.locator('#positionProviderSearch').fill('n2');
 assert.equal(await page.locator('#positionProvider option').count(),1);
 await page.locator('#positionProviderSearch').fill('');
 assert.equal(await page.locator('#positionProvider option').count(),2);
 console.log('ONBOARDING: offline Flatex/broker and N26/bank, account type suggestions, searchable position dropdowns, ETF field autofill and responsive widths PASS');
}finally{await browser.close();}
