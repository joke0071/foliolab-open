import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
/** Existing UI-quality caller runs this contract in PR/Main and actual production. */
export async function positionValueFilterBrowserContract({p,nav,record,scan,engine,scans}){
  // A separate synthetic canonical setup; all subsequent filter actions are read-only.
  await p.context().setOffline(false);
  await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'r4-provider',name:'Synthetic display filter'}));m.accounts.push(createAccount({id:'r4-account',providerId:'r4-provider',name:'Synthetic account',type:'securities'},m));
   const add=(id,name,price,extra={})=>m.positions.push(createPosition({id,name,providerId:'r4-provider',accountId:'r4-account',kind:'etf',quantity:1,quantityExact:'1',price:Number(price),priceExact:price,quoteSource:'Synthetic quote',...extra},m));
   add('r4-small','A small','0.999999999999999999');add('r4-equal','B equal','1');add('r4-above','C above','1.000000000000000001');add('r4-unknown','D unknown FX','0.01',{currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'});add('r4-missing','E missing quote','0',{quoteSource:''});add('r4-zero','F true zero','0');add('r4-archived','G archived small','0.01',{archived:true});
   for(let i=0;i<105;i++)add('r4-large-'+i,'Z large '+String(i).padStart(3,'0'),'2');
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });
  await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const filterBefore=await record();await p.locator('#mobileNav [data-page=positions]:visible,#sidebarNav [data-page=positions]:visible').click();
  await p.locator('#positionSort').selectOption('name');assert.equal(await p.locator('#positionValueFilter').inputValue(),'');assert.equal(await p.locator('.position-entry').count(),100);
  await p.locator('#positionListHead button').click();await p.locator('[data-position-select="r4-small"]').check();await p.locator('[data-position-select="r4-unknown"]').check();
  await p.locator('#positionValueFilter').fill('1');assert.equal(await p.locator('#positionList [data-position-id="r4-small"]').count(),0);assert.equal(await p.locator('#positionList [data-position-id="r4-zero"]').count(),0);
  for(const id of ['r4-equal','r4-above','r4-unknown','r4-missing'])assert.equal(await p.locator('#positionList [data-position-id="'+id+'"]').count(),1);
  assert.match(await p.locator('#positionSelectionStatus').innerText(),/2 ausgewählt, davon 1 im aktuellen Filter · 1 ausgeblendet/);
  assert.equal(await p.locator('[data-position-select="r4-unknown"]').isChecked(),true);assert.match(await p.locator('#positionValueFilterHint').innerText(),/2 von 111 Treffern ausgeblendet/);
  await p.locator('#positionValueFilter').fill('-1');assert.equal(await p.locator('#positionValueFilter').getAttribute('aria-invalid'),'true');assert.equal(await p.locator('#positionValueFilter').inputValue(),'-1');assert.equal(await p.locator('#positionList [data-position-id="r4-small"]').count(),0);
  await p.locator('#positionValueFilter').fill('1,000000000000000001');assert.equal(await p.locator('#positionList [data-position-id="r4-equal"]').count(),0);assert.equal(await p.locator('#positionList [data-position-id="r4-above"]').count(),1);
  await p.locator('#positionSearch').fill('A small');assert.equal(await p.locator('.position-entry').count(),0);assert.match(await p.locator('#positionList').innerText(),/Leere die Grenze/);await p.locator('#positionSearch').fill('');
  await p.locator('#positionArchiveFilter').selectOption('archived');assert.equal(await p.locator('.position-entry').count(),0);await p.locator('#positionValueFilter').fill('');assert.equal(await p.locator('#positionList [data-position-id="r4-archived"]').count(),1);
  await p.locator('#positionArchiveFilter').selectOption('active');assert.equal(await p.locator('[data-position-select="r4-small"]').isChecked(),true);await p.locator('#positionValueFilter').fill('1');
  await p.locator('#mobileNav [data-page=more]:visible,#sidebarNav [data-page=more]:visible').click();await p.locator('#mobileNav [data-page=positions]:visible,#sidebarNav [data-page=positions]:visible').click();assert.equal(await p.locator('#positionValueFilter').inputValue(),'1');
  mkdirSync('artifacts/gates/position-value-filter',{recursive:true});
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:900});await p.locator('#positionValueFilter').scrollIntoViewIfNeeded();await p.locator('#positionValueFilter').focus();
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok((await p.locator('#positionValueFilter').boundingBox()).height>=44);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#positionsPage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
   await p.screenshot({path:'artifacts/gates/position-value-filter/'+engine+'-'+width+'.png'});
  }
  await p.setViewportSize({width:320,height:360});
  await p.locator('#positionValueFilter').fill('999999999999.123456789012345678');
  await p.locator('.position-value-filter').evaluate(root=>{for(const el of root.querySelectorAll('span,input,p'))el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*2)+'px';});
  await p.locator('#positionValueFilter').scrollIntoViewIfNeeded();await p.locator('#positionValueFilter').focus();
  assert.equal(await p.locator('#positionValueFilter').inputValue(),'999999999999.123456789012345678');
  assert.equal(await p.locator('#positionValueFilter').getAttribute('aria-invalid'),'false');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await p.locator('#positionValueFilter').evaluate(el=>{const r=el.getBoundingClientRect(),nav=document.getElementById('mobileNav').getBoundingClientRect(),header=document.querySelector('header')?.getBoundingClientRect();return document.activeElement===el&&r.top>=Math.max(0,header?.bottom||0)&&r.bottom<=nav.top&&r.height>=44;}),'short computed200percent view keeps focused field clear of navigation/header');
  assert.deepEqual(await p.evaluate(async()=>(await axe.run('#positionsPage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
  await p.screenshot({path:'artifacts/gates/position-value-filter/'+engine+'-320x360-text200.png'});
  assert.deepEqual(await record(),filterBefore,'display filtering preserves exact raw/revision/settings');
  await p.context().setOffline(true);await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await p.locator('#mobileNav [data-page=positions]:visible,#sidebarNav [data-page=positions]:visible').click();assert.equal(await p.locator('#positionValueFilter').inputValue(),'');assert.deepEqual(await record(),filterBefore,'fresh offline session defaults all visible without canonical mutation');
  writeFileSync('artifacts/gates/position-value-filter/'+engine+'.json',JSON.stringify({engine,result:'PASS',scope:'Synthetic UI-R4 display-only filter',checks:['default all; exact decimal boundary; UNKNOWN/missing price preserved','true zero distinguished; archive/search/paging scope; hidden selection retained','invalid draft preserves previous applied filter','navigation retained; fresh offline session defaults all','five widths/Axe/44px/focus; exact IDB raw/revision/settings unchanged']},null,2));
}
