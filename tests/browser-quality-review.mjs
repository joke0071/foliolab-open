import {clickDisclosed,revealAction} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';import {readFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const base=process.env.QUALITY_BASE||'http://127.0.0.1:4173/';
for(const engine of (process.env.QUALITY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
 try{
  await page.addInitScript({content:axe});await page.goto(new URL('tests/storage-origin.html',base).href);
  const setup=await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {acceptHistory,historyPreview,checkpointHistory}=await import('/src/wallet-history-state.js');const {replayWalletHistory}=await import('/src/wallet-history-core.js');const {event,stream,NOW}=await import('/tests/wallet-history-fixtures.mjs');
   let m=blankModel();m.settings.autoRefresh=false;const provider=createProvider({name:'Synthetic Review Provider'});m.providers.push(provider);const a=createAccount({providerId:provider.id,name:'Wallet account',type:'wallet'},m),b=createAccount({providerId:provider.id,name:'Other custody',type:'securities'},m);m.accounts.push(a,b);
   const w=createPosition({providerId:provider.id,accountId:a.id,name:'Synthetic ETH',kind:'crypto',symbol:'ETH',coinId:'ethereum',quantity:5,price:0,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x1111111111111111111111111111111111111111'}},m),old=createPosition({providerId:provider.id,accountId:b.id,name:'Old ETF',kind:'etf',quantity:1,price:100,quoteAsOf:'2026-01-01'},m),manual=createPosition({providerId:provider.id,accountId:b.id,name:'Intentional manual price',kind:'etf',quantity:1,price:100},m);old.quoteAsOf='2026-01-01';m.positions.push(w,old,manual);
   m=acceptHistory(m,historyPreview({replay:replayWalletHistory({events:[event()],streams:[stream({coverage:{status:'partial',fromBlock:'0',toBlock:'10',tipHash:'block-10',source:'fixture'}})]}),issues:['archive-gap']},{id:'wallet-history:'+w.id,chain:'eth',walletKey:w.id,acceptedAt:NOW}));m=checkpointHistory(m,{id:'wallet-history:'+w.id,chain:'eth',walletKey:w.id,provider:'fixture.test',filter:'all',updatedAt:NOW});
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();return {wallet:w.id,other:b.id,walletAccount:a.id};
  });
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));const state=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}}),before=await state();
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.locator((width<720?'#mobileNav':'#sidebarNav')+' [data-page="positions"]').click();await page.locator('[data-filter="__review"]').click();
   assert.match(await page.locator('[data-filter="__review"]').innerText(),/\(2\)/);assert.equal(await page.locator('#positionList .position-entry').count(),2);
   await page.locator('#qualityReviewKind').selectOption('history');assert.equal(await page.locator('#positionList .position-entry').count(),1);
   await page.locator('#qualityReviewAccount').selectOption(setup.other);assert.equal(await page.locator('#positionList .position-entry').count(),0);
   await page.locator('[data-action="reset-quality-review"]').click();assert.equal(await page.locator('#qualityReviewKind').inputValue(),'all');assert.equal(await page.locator('#qualityReviewAccount').inputValue(),'');assert.equal(await page.locator('#positionList .position-entry').count(),2);
   assert.deepEqual(await page.evaluate(async()=> (await axe.run('#qualityReviewTools',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await mkdir('artifacts/gates/quality',{recursive:true});await page.screenshot({path:'artifacts/gates/quality/'+engine+'-'+width+'.png'});
   const action=page.locator('#positionList [data-action="wallet-history"]');assert.equal(await action.count(),1);await clickDisclosed(action);await page.locator('#walletHistoryDialog').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#walletHistoryDialog').waitFor({state:'hidden'});assert.ok(await action.evaluate(el=>document.activeElement===el));
  }
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.locator((width<720?'#mobileNav':'#sidebarNav')+' [data-page="more"]').click();
   const details=page.locator('[data-account-evidence="'+setup.walletAccount+'"]');
   await revealAction(details);if(!await details.evaluate(el=>el.open))await details.locator(':scope > summary').click();
   assert.equal(await details.evaluate(el=>el.open),true,'account evidence must really be open before reading');
   await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   await page.screenshot({path:'artifacts/gates/quality/'+engine+'-account-geometry-'+width+'.png'});
   const panelBox=await page.locator('#providerSettings').boundingBox(),evidenceBox=await details.boundingBox();assert.ok(evidenceBox.width>=panelBox.width-24,'expanded account evidence must not be squeezed beside provider controls');
   for(const button of await page.locator('#providerSettings .row-btn').all())if(await button.isVisible()){const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44,'visible account/provider icon targets >=44px: '+JSON.stringify({engine,width,box,css:await button.evaluate(el=>({action:el.dataset.action,minWidth:getComputedStyle(el).minWidth,minHeight:getComputedStyle(el).minHeight,width:getComputedStyle(el).width,height:getComputedStyle(el).height,transform:getComputedStyle(el).transform}))}));}
   assert.match(await details.innerText(),/Positionen: 1/);assert.match(await details.innerText(),/Positionen mit Kursprüfbedarf: 1/);assert.match(await details.innerText(),/Positionen mit gemeldetem Historienprüfbedarf: 1/);assert.match(await details.innerText(),/Kein vollständiger Bank- oder Walletabgleich bestätigt/);
   for(const target of [details.locator(':scope > summary'),details.locator('[data-action="view-account"]')]){const box=await target.boundingBox();assert.ok(box.width>=44&&box.height>=44,'account evidence targets >=44px');}
   await page.screenshot({path:'artifacts/gates/quality/'+engine+'-account-open-'+width+'.png'});
   assert.deepEqual(await page.evaluate(async()=> (await axe.run('#providerSettings',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'artifacts/gates/quality/'+engine+'-account-'+width+'.png'});
   const action=details.locator('[data-action="view-account"]');await action.click();assert.equal(await page.locator('#positionList .position-entry').count(),1);assert.match(await page.locator('#positionList').innerText(),/Synthetic ETH/);
   await page.locator((width<720?'#mobileNav':'#sidebarNav')+' [data-page="more"]').click();assert.equal(await details.evaluate(el=>el.open),true,'evidence disclosure survives navigation');
   const summary=details.locator(':scope > summary');
   const arrow=()=>summary.evaluate(async el=>{getComputedStyle(el,'::after').transform;await Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));return getComputedStyle(el,'::after').transform;});
   const openArrow=await arrow();await summary.focus();await page.keyboard.press('Enter');assert.equal(await details.evaluate(el=>el.open),false);assert.notEqual(await arrow(),openArrow,'nested account arrow must reflect its own closed state');
   if(width===320||width===1440)await page.screenshot({path:'artifacts/gates/quality/'+engine+'-account-closed-'+width+'.png'});
   await page.keyboard.press('Enter');assert.equal(await details.evaluate(el=>el.open),true);
  }
  assert.deepEqual(await state(),before,'review/filter/history viewing must not change portfolio or revision');
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();for(const p of m.positions){p.price=100;p.priceExact='100';p.quoteAsOf=new Date().toISOString().slice(0,10);}m.walletHistory.pending=[];for(const session of m.walletHistory.sessions){session.issues=[];session.streams.forEach(s=>{s.opening={quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic-verified-genesis'};s.coverage.status='verified';});}await s.save(m);s.close();});
  await page.reload();await page.locator('#sidebarNav [data-page="positions"]').click();assert.equal(await page.locator('[data-filter="__review"]').count(),0,JSON.stringify(await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {positionQualityReview}=await import('/src/position-quality-review.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return {issues:positionQualityReview(m),history:m.walletHistory};})));
  console.log('QUALITY '+engine+': per-position dedupe, category/account/reset, 5 widths/Axe/history action/focus, account evidence/open+closed arrows/keyboard/drilldown, no writes, repair disappearance PASS');
 }finally{await context.close();await browser.close();}
}
