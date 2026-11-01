import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {clickDisclosed} from './browser-disclosures.mjs';
const base=process.env.CASH_UX_BASE||'http://127.0.0.1:4173/';
const report={base,synthetic:true,realHardware:false,engines:[]};
mkdirSync('artifacts/gates/cash-account-ux',{recursive:true});
for(const engine of (process.env.CASH_UX_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const nav=async tab=>p.locator((p.viewportSize().width<720?'#mobileNav':'#sidebarNav')+' [data-page="'+tab+'"]').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const state=()=>p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return await s.initialize();}finally{s.close();}});
 const finance=m=>({positions:m.positions,bookings:m.bookings,journalEntries:m.journalEntries,externalCashFlows:m.externalCashFlows,snapshots:m.snapshots,openingPositions:m.openingPositions});
 const scan=async scope=>{
  const result=await p.evaluate(scope=>axe.run(scope,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}),scope);
  assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 };
 try{
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await nav('positions');await p.locator('#addWizard').click();await p.locator('#wizardKind').selectOption('cash');
  await p.locator('#wizardProviderName').fill('SYNTHETIC Cash Bank');await p.locator('#wizardAccountName').fill('SYNTHETIC Tagesgeld');
  assert.equal(await p.locator('#wizardName').count(),0,'one product name');assert.equal(await p.locator('#wizardAccountCurrency').count(),0,'one currency');
  for(const id of ['wizardQuery','wizardMatches','wizardSymbol','wizardIsin','wizardExchange','wizardMic','wizardFmp','wizardEodhd'])assert.equal(await p.locator('#'+id).count(),0,id+' is irrelevant for cash');
  await p.locator('#wizardQuantity').fill('1234.000000000000000001');await scan('#wizardDialog');await p.locator('#wizardNext').click();
  await p.waitForFunction(()=>document.getElementById('wizardTitle')?.textContent==='Konto hinzugefügt');
  let model=await state(),account=model.accounts[0],holding=model.positions[0];
  assert.equal(account.name,'SYNTHETIC Tagesgeld');assert.equal(holding.name,account.name);assert.notEqual(account.id,holding.id);
  assert.equal(holding.quantityExact,'1234.000000000000000001');assert.equal(holding.currency,'EUR');assert.equal(holding.priceExact,'1');
  assert.deepEqual(model.bookings,[]);assert.deepEqual(model.journalEntries,[]);assert.deepEqual(model.externalCashFlows,[]);
  await p.locator('#wizardPortfolio').click();await nav('dashboard');
  const provider=()=>p.locator('[data-provider-id="'+account.providerId+'"]');await provider().locator(':scope > summary').click();
  const card=()=>p.locator('.simple-cash-account[data-position-id="'+holding.id+'"]');
  assert.equal(await card().count(),1);assert.equal(await card().locator('[data-action="view-account"]').count(),0);assert.doesNotMatch(await card().innerText(),/1 Positionen|Positionen →/);
  const beforeRead=await record();await card().locator(':scope > summary').click();
  await card().locator('[data-action="edit-account"]').waitFor({state:'visible'});assert.deepEqual(await record(),beforeRead,'opening details is read-only');
  const financialBefore=finance(await state());
  await card().locator('[data-action="edit-account"]').click();await p.locator('#accountName').fill('SYNTHETIC Festgeld 2028');
  await p.locator('#cashTermsDisclosure > summary').click();await p.locator('#cashTermsEnabled').check();await p.locator('#fixedTerm').check();await p.locator('#liquidityStatus').selectOption('bound');
  await p.locator('#termStartDate').fill('2026-01-01');await p.locator('#termMaturityDate').fill('2028-01-01');
  await p.locator('#interestDisclosure > summary').click();await p.locator('#interestEnabled').check();await p.locator('[name="interestRate"]').fill('2.5');
  await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});
  await p.waitForFunction(id=>document.activeElement?.dataset.action==='edit-account'&&document.activeElement?.dataset.id===id,account.id,{timeout:3000});
  model=await state();assert.deepEqual(finance(model),financialBefore,'contract edit never changes financial records');
  assert.equal(model.accounts[0].name,'SYNTHETIC Festgeld 2028');assert.equal(model.positions[0].name,'SYNTHETIC Tagesgeld','explicit account rename does not rewrite existing holding');
  assert.equal(model.accounts[0].cashTerms.maturityDate,'2028-01-01');assert.equal(model.accounts[0].interestTerms.rates[0].annualRateExact,'2.5');
  assert.match(await card().locator(':scope > summary').innerText(),/2028|01\.01/);
  // A second contract gets its own account and balance, via the same one-name flow.
  await p.setViewportSize({width:390,height:844});await nav('positions');await p.locator('#addWizard').click();await p.locator('#wizardKind').selectOption('cash');
  await p.locator('#wizardProvider').selectOption(account.providerId);await p.locator('#wizardAccount').selectOption('__new__');
  await p.locator('#wizardAccountName').fill('SYNTHETIC Deposit two');await p.locator('#wizardQuantity').fill('50');await p.locator('#wizardNext').click();
  await p.waitForFunction(()=>document.getElementById('wizardTitle')?.textContent==='Konto hinzugefügt');await p.locator('#wizardPortfolio').click();
  model=await state();assert.equal(model.accounts.length,2);assert.equal(model.positions.length,2);assert.equal(model.positions[0].quantityExact,holding.quantityExact);
  // Provider cases: zero accounts, one mixed account, and two independent deposits.
  await p.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{createProvider,createAccount,createPosition}=await import('/src/model.js');
   const s=new PortfolioStorage(),m=await s.initialize();m.settings.autoRefresh=false;
   m.providers.push(createProvider({id:'empty',name:'SYNTHETIC zero accounts'}),createProvider({id:'mixed',name:'SYNTHETIC one mixed account'}));
   m.accounts.push(createAccount({id:'mixed-account',providerId:'mixed',name:'SYNTHETIC mixed depot',type:'securities'},m));
   for(const [id,kind]of [['cash','cash'],['etf','etf']])m.positions.push(createPosition({id:'mixed-'+id,providerId:'mixed',accountId:'mixed-account',name:'SYNTHETIC '+id,kind,symbol:kind==='cash'?'EUR':'SYN',quantity:1,price:1},m));
   await s.save(m);s.close();
  });
  await p.reload();await nav('more');const baseline=await record(),expected=await state();
  const bank=p.locator('[data-provider-settings="'+account.providerId+'"]');await bank.locator(':scope > summary').click();
  assert.equal(await bank.locator('.account-entry').count(),2);assert.equal(await bank.locator('.account-entry:not([open])').count(),2);
  assert.equal(await bank.locator('[data-action="edit-account"]').first().isVisible(),false,'actions belong inside account');
  const first=bank.locator('[data-account-evidence="'+account.id+'"]');await first.locator(':scope > summary').click();
  assert.equal(await first.locator('.account-evidence-body h3').innerText(),'Datenstand');assert.equal(await first.locator('details.account-evidence').count(),0,'no standalone second account evidence disclosure');
  assert.match(await first.innerText(),/Positionen: 1/);assert.doesNotMatch(await first.innerText(),/Datenstand ·/);
  await first.locator('[data-action="edit-account"]').click();await p.keyboard.press('Escape');await p.locator('#editDialog').waitFor({state:'hidden'});
  await p.waitForFunction(id=>document.activeElement?.dataset.action==='edit-account'&&document.activeElement?.dataset.id===id,account.id,{timeout:3000});
  assert.deepEqual(await record(),baseline,'read-only account interactions preserve IDB bytes/revision');
  for(const width of [320,360,390,412,430,768,1440]){
   await p.setViewportSize({width,height:900});await nav('more');
   for(const id of [account.providerId,'empty','mixed']){
    const group=p.locator('[data-provider-settings="'+id+'"]');if(await group.getAttribute('open')===null)await group.locator(':scope > summary').click();
   }
   for(const detail of await p.locator('#providerSettings [data-account-evidence]').all())if(await detail.getAttribute('open')===null)await detail.locator(':scope > summary').click();
   assert.equal(await p.locator('[data-provider-settings="empty"] .account-entry').count(),0);
   assert.equal(await p.locator('[data-provider-settings="mixed"] .account-entry').count(),1);
   for(const btn of await p.locator('#providerSettings .row-btn').all())if(await btn.isVisible())assert.ok(await btn.evaluate(el=>{const b=el.getBoundingClientRect();return b.width>=44&&b.height>=44;}));
   await scan('#providerSettings');await p.screenshot({path:'artifacts/gates/cash-account-ux/'+engine+'-accounts-'+width+'.png',fullPage:true});
   await nav('dashboard');if(await provider().getAttribute('open')===null)await provider().locator(':scope > summary').click();
   assert.equal(await p.locator('.simple-cash-account').count(),2);await scan('#providerOverview');
   await p.screenshot({path:'artifacts/gates/cash-account-ux/'+engine+'-dashboard-'+width+'.png',fullPage:true});
   assert.deepEqual(await record(),baseline);
  }
  await p.setViewportSize({width:390,height:844});await nav('more');
  const dl=p.waitForEvent('download');await p.locator('#exportBackup').click();const text=readFileSync(await (await dl).path(),'utf8');
  assert.deepEqual(await record(),baseline,'export does not rewrite portfolio');
  const restoreContext=await browser.newContext(),rp=await restoreContext.newPage();
  try{
   await rp.goto(base);await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   rp.on('dialog',d=>d.accept());await rp.locator('#backupFile').setInputFiles({name:'synthetic-cash-accounts.json',mimeType:'application/json',buffer:Buffer.from(text)});
   await rp.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return await s.initialize();}finally{s.close();}});
   assert.deepEqual(restored.accounts,expected.accounts);assert.deepEqual(finance(restored),finance(expected));
  }finally{await restoreContext.close();}
  assert.deepEqual(errors,[]);report.engines.push({engine,status:'PASS',newCashAccounts:2,providerAccountCounts:[0,1,2],separateEntities:true,existingNamesPreserved:true,exactCash:true,contractOnlyMutation:true,readOnlyRevision:true,freshUiRestore:true,widths:[320,360,390,412,430,768,1440],axe:true,focus:true});
  console.log(engine+': CASH-UX267/ACCOUNT264 single name/currency, independent balances/contracts, one dashboard card, nested account evidence, 0/1/2 accounts, focus/7 widths/Axe/exact IDB/UI restore PASS');
 }catch(error){console.log('CASH_UX_SYNTHETIC_FAILURE '+JSON.stringify({engine,errors,state:await p.evaluate(()=>({title:document.getElementById('dialogTitle')?.textContent,dialogError:document.getElementById('dialogError')?.textContent,wizardError:document.getElementById('wizardError')?.textContent,storage:document.getElementById('portfolioStorageState')?.textContent})).catch(()=>null)}));throw error;}
 finally{writeFileSync('artifacts/gates/cash-account-ux.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
