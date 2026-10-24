import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:740}});
try{
 await page.goto('http://127.0.0.1:4173/');
 const ids=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),prov=createProvider({name:'DeFi Testanbieter',type:'wallet'});
  m.providers.push(prov);
  const account=createAccount({providerId:prov.id,name:'DeFi Wallet',type:'wallet'},m);m.accounts.push(account);
  const make=(id,name,symbol,extra={})=>createPosition({id,providerId:prov.id,accountId:account.id,
   kind:'crypto',name,symbol,quantity:1,price:100,currency:'EUR',...extra},m);
  const eth=make('de-eth','ETH','ETH');
  const st=make('de-steth','stETH','STETH');
  const other=make('de-wrapped','Wrapped backing','WRAP',{economicRole:'wrapped',valuationMode:'excluded',representedByPositionId:eth.id});
  m.positions.push(eth,st,other);persist(m);
  return {eth:eth.id,st:st.id,other:other.id};
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('[data-action="edit-position"][data-id="'+ids.st+'"]').click();
 await page.locator('#defiPosition > summary').click();
 const role=page.locator('#defiRole'),mode=page.locator('#defiValuation'),target=page.locator('#defiRepresented'),hint=page.locator('#defiGuidance');
 assert.equal(await target.isRequired?.(),undefined);
 assert.equal(await target.getAttribute('required'),null);
 await role.selectOption('liquid-staking');
 await mode.selectOption('excluded');
 assert.equal(await target.getAttribute('required'),'','Excluded reference is mandatory');
 assert.equal(await target.getAttribute('aria-required'),'true');
 assert.match(await hint.innerText(),/bereits angerechnete Position/);
 assert.equal(await target.evaluate(el=>el.checkValidity()),false);
 await target.selectOption(ids.other);
 assert.match(await hint.innerText(),/nicht positiv angerechnet/,'Excluded target warns');
 await target.selectOption(ids.eth);
 assert.match(await hint.innerText(),/nicht zum Gesamtvermögen addiert/);
 assert.equal(await target.evaluate(el=>el.checkValidity()),true);
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 await page.locator('#editDialog').waitFor({state:'hidden'});
 let m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.positions.find(p=>p.id===ids.st).valuationMode,'excluded');
 assert.equal(m.positions.find(p=>p.id===ids.st).representedByPositionId,ids.eth);
 // A mismatched liability role must never silently rewrite the model or persist.
 await page.locator('[data-action="edit-position"][data-id="'+ids.st+'"]').click();
 await page.locator('#defiPosition > summary').click();
 await page.locator('#defiValuation').selectOption('liability');
 assert.equal(await page.locator('#defiRole').getAttribute('aria-invalid'),'true');
 assert.match(await page.locator('#defiGuidance').innerText(),/Geliehene Assets/);
 const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 assert.equal(await page.locator('#editDialog').isVisible(),true);
 assert.match(await page.locator('#dialogError').innerText(),/Schuldposition erfordert/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before);
 await page.locator('#defiRole').selectOption('borrowed');
 assert.equal(await page.locator('#defiRole').getAttribute('aria-invalid'),'false');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 await page.locator('#editDialog').waitFor({state:'hidden'});
 m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.positions.find(p=>p.id===ids.st).valuationMode,'liability');
 assert.equal(m.positions.find(p=>p.id===ids.st).economicRole,'borrowed');

 await page.locator('#addWizard').click();
 await page.locator('#wizardAdvanced > summary').click();
 await page.locator('#wizardEconomic > summary').click();
 await page.locator('#wizardEconomicRole').selectOption('wrapped');
 await page.locator('#wizardValuationMode').selectOption('excluded');
 assert.equal(await page.locator('#wizardRepresented').getAttribute('required'),'');
 assert.match(await page.locator('#wizardEconomicGuidance').innerText(),/bereits angerechnete Position/);
 await page.locator('#wizardName').fill('Ungezählte DeFi-Einheit');
 await page.locator('#wizardSymbol').fill('DEFI_TEST');
 await page.locator('#wizardQuantity').fill('1');
 await page.locator('#wizardNext').click();
 assert.equal(await page.locator('#wizardRepresented').getAttribute('aria-invalid'),'true','Wizard focuses economic reference');
 assert.match(await page.locator('#wizardError').innerText(),/bereits angerechnete Position/);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardRepresented');
 const old=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 await page.locator('#wizardRepresented').selectOption(ids.eth);
 page.once('dialog',d=>d.dismiss());
 await page.locator('#wizardPrev').click();
 assert.equal(await page.locator('#wizardDialog').isVisible(),true,'Unsaved economic role and reference retained');
 assert.equal(await page.locator('#wizardRepresented').inputValue(),ids.eth);
 page.once('dialog',d=>d.accept());
 await page.locator('#wizardPrev').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),old,'Abandoned DeFi draft cannot mutate assets');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:820});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="positions"]').click();
  await page.locator('[data-action="edit-position"][data-id="'+ids.st+'"]').click();
  await page.locator('#defiPosition > summary').click();
  const rect=await page.locator('#editDialog').evaluate(el=>{const x=el.getBoundingClientRect();return {left:x.left,right:x.right};});
  assert.ok(rect.left>=-1&&rect.right<=width+1,'DeFi dialog viewport '+width);
  await page.locator('#cancelDialog').click();
 }
 console.log('DEFI DIALOG GUIDANCE: economic roles, target required, no unintended mutation, wizard validation and 4 viewports PASS');
}finally{await browser.close();}
