import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {transferFixture} from './transfer-matching-fixture.mjs';
/** UI integration only; every economic operation runs through delivered preview,
 * evidence, explicit consent, CAS and Undo. Also runs at the actual live URL. */
export async function bookingTransferBrowserContract({p,engine,record,scan,base}){
 const nav=()=>p.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();
 const d=p.locator('#transferMatchingDialog'),el=k=>d.locator('[data-transfer="'+k+'"]');
 const row=id=>p.locator('[data-booking-id="'+id+'"]'),action=id=>row(id).locator('[data-action=booking-transfer]');
 const openRow=async id=>{const details=row(id).locator('.booking-meta');if(!await details.evaluate(e=>e.open))await details.locator('summary').click();const button=action(id);await button.scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/gates/booking-transfers/'+engine+'-detail-'+id+'-'+p.viewportSize().width+'.png'});const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44,'direct booking transfer action has a usable touch target');assert.deepEqual(await p.evaluate(async()=>(await axe.run('#bookingsPage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[],'expanded ordinary booking details');await action(id).click();await d.waitFor({state:'visible'});};
 const seed=async()=>{await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},transferFixture());await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await nav();await p.locator('#bookingSearch').fill('');await p.locator('#bookingFilterType').selectOption('');};
 const choose=async()=>{await d.locator('[data-transfer-in][value=in]').check();await d.locator('[data-transfer-in][value=in2]').check();await el('reference').fill('SYNTHETIC direct booking proof');assert.ok(await el('accept').isDisabled());await el('consent').check();assert.ok(await el('accept').isEnabled());};
 await seed();const before=await record();assert.equal(await p.locator('#bookingTransferDetails').count(),0);assert.equal(await p.locator('[data-action=transfer-matching]').count(),1);
 for(const width of [320,360,390,412,430,1440]){
  await p.setViewportSize({width,height:900});await nav();
  const outDetails=row('out').locator('.booking-meta');await outDetails.locator('summary').click();await mkdir('artifacts/gates/booking-transfers',{recursive:true});await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:'artifacts/gates/booking-transfers/'+engine+'-rows-'+width+'.png'});
  await openRow('out');assert.equal(await el('out').inputValue(),'out');assert.equal(await d.locator('[data-transfer-in]:checked').count(),0,'outgoing context never auto-pairs amount/date');assert.ok(await el('accept').isDisabled());
  await choose();await scan('booking direct outgoing '+width);await mkdir('artifacts/gates/booking-transfers',{recursive:true});await p.screenshot({path:'artifacts/gates/booking-transfers/'+engine+'-out-'+width+'.png'});await p.keyboard.press('Escape');assert.ok(await action('out').evaluate(e=>e===document.activeElement));
  await openRow('in');assert.equal(await el('out').inputValue(),'','incoming context still requires an explicit outgoing choice');await el('out').selectOption('out');assert.ok(await d.locator('[data-transfer-in][value=in]').isChecked(),'the chosen booking is visible and selected');assert.equal(await d.locator('[data-transfer-in][value=in2]').isChecked(),false);assert.ok(await el('accept').isDisabled());await scan('booking direct incoming '+width);await p.keyboard.press('Escape');assert.ok(await action('in').evaluate(e=>e===document.activeElement));
  assert.deepEqual(await record(),before,'row navigation and candidate previews never write');
 }
 await openRow('out');await choose();await el('accept').click();await p.waitForFunction(()=>document.querySelector('[data-transfer=status]').textContent.startsWith('Zuordnung gespeichert'));
 const matched=await record(),m=JSON.parse(matched.raw),original=JSON.parse(before.raw);assert.equal(matched.revision,before.revision+1);assert.equal(m.externalCashFlows.length,0);assert.deepEqual(m.positions,original.positions);assert.deepEqual(m.snapshots,original.snapshots);assert.ok(m.bookings.every(b=>b.transferMatch));
 await p.keyboard.press('Escape');assert.ok(await row('out').locator('.booking-meta>summary').evaluate(e=>e===document.activeElement),'save returns to a replacement row summary');
 await p.locator('#bookingFilterType').selectOption('transfer');assert.equal(await p.locator('.booking-management-row').count(),3);await p.locator('#bookingSearch').fill('intern');assert.equal(await p.locator('.booking-management-row').count(),3);await p.locator('#bookingSearch').fill('SYNTHETIC direct booking proof');assert.equal(await p.locator('.booking-management-row').count(),3,'confirmed reference is searchable');
 await openRow('in');assert.equal(await el('form').isVisible(),false);assert.equal(await el('confirmed-section').evaluate(e=>e.open),true);assert.equal(await d.locator('[data-transfer-undo]').count(),1);assert.match(await el('confirmed').innerText(),/SYNTHETIC direct booking proof/);assert.match(await el('confirmed').innerText(),/ursprünglichen externen/);await scan('booking direct confirmed group');
 assert.deepEqual(await record(),matched,'opening confirmed details is read-only');p.once('dialog',x=>x.dismiss());await d.locator('[data-transfer-undo]').click();assert.deepEqual(await record(),matched,'cancel Undo leaves exact record');
 p.once('dialog',x=>x.accept());await d.locator('[data-transfer-undo]').click();await p.waitForFunction(()=>document.querySelector('[data-transfer=status]').textContent.startsWith('Zuordnung aufgehoben'));
 const undone=await record();assert.equal(undone.revision,before.revision+2);assert.deepEqual(JSON.parse(undone.raw),original,'Undo restores exact economic model');assert.deepEqual(undone.settings,before.settings);await p.keyboard.press('Escape');assert.ok(await p.locator('#bookingTransferAction').evaluate(e=>e===document.activeElement),'filtered-away row returns focus to the ordinary toolbar');
 // The booking selected from a filtered list must not disappear behind the
 // dialog's first 200 candidates. Build genuine delivered journal operations.
 await seed();await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{executeTransaction}=await import('/src/transactions.js');const s=new PortfolioStorage(),m=await s.initialize();const target=m.bookings.find(b=>b.id==='in').positionId;for(let i=0;i<205;i++)executeTransaction(m,{id:'context-extra-'+i,positionId:target,type:'deposit',date:'2026-01-02',quantity:1,notes:i===204?'SYNTHETIC selected beyond page':'SYNTHETIC candidate'});await s.save(m);s.close();});await p.reload();await nav();await p.locator('#bookingSearch').fill('SYNTHETIC selected beyond page');assert.equal(await p.locator('.booking-management-row').count(),1);const pagedBefore=await record();await openRow('context-extra-204');await el('out').selectOption('out');assert.ok(await d.locator('[data-transfer-in][value=context-extra-204]').isVisible());assert.ok(await d.locator('[data-transfer-in][value=context-extra-204]').isChecked());assert.ok(await el('incoming-more').isVisible());await p.keyboard.press('Escape');assert.deepEqual(await record(),pagedBefore,'candidate pagination never changes economic data');
 // Exercise the real refresh handler with controlled provider latency. No
 // real provider data or OAuth result is asserted by this synthetic fixture.
 await seed();await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{createPosition}=await import('/src/model.js');const s=new PortfolioStorage(),m=await s.initialize();m.positions.push(createPosition({id:'busy-crypto',providerId:m.providers[0].id,accountId:m.accounts[0].id,name:'SYNTHETIC refresh latency',kind:'crypto',coinId:'ethereum',quantity:1,price:1},m));await s.save(m);s.close();});await p.reload();await nav();await openRow('out');await choose();
 // Hold only the external quote boundary. The prior routing fixture let WebKit
 // finish before confirmation; the real client/parser/storage/guards
 // still run, and no worker registration or acceptance assertion is replaced.
 await p.evaluate(()=>{
  const key=Symbol.for('foliolab.test.held-quote'),native=globalThis.fetch;
  const gate={native,pending:false,requests:0,release:null};globalThis[key]=gate;
  globalThis.fetch=(input,options)=>{
   const url=new URL(typeof input==='string'?input:(input?.url??String(input)),location.href);
   if(url.hostname!=='api.coingecko.com')return native.call(globalThis,input,options);
   gate.pending=true;gate.requests++;
   return new Promise((resolve,reject)=>{
    const aborted=()=>{gate.pending=false;reject(options?.signal?.reason||new DOMException('Aborted','AbortError'));};
    if(options?.signal?.aborted){aborted();return;}
    options?.signal?.addEventListener('abort',aborted,{once:true});
    gate.release=()=>{options?.signal?.removeEventListener('abort',aborted);gate.pending=false;resolve(new Response(JSON.stringify({ethereum:{eur:2,last_updated_at:Math.floor(Date.now()/1000)}}),{status:200,headers:{'content-type':'application/json'}}));};
   });
  };
 });
 let refreshRecord;
 try{
  await p.locator('#refreshAll').evaluate(el=>el.click());
  await p.waitForFunction(()=>globalThis[Symbol.for('foliolab.test.held-quote')]?.pending===true,null,{timeout:10000});
  assert.ok(await p.locator('#refreshAll').isDisabled(),'fixture must actually hold an in-flight refresh');assert.equal(await p.evaluate(()=>globalThis[Symbol.for('foliolab.test.held-quote')].requests),1,'one explicitly held synthetic provider request');
  refreshRecord=await record();await el('accept').click();await p.waitForFunction(()=>/^(Nicht gespeichert|Zuordnung gespeichert)/.test(document.querySelector('[data-transfer=status]').textContent));
  const blocked=await record();console.log(engine+': synthetic refresh guard revisions '+refreshRecord.revision+' -> '+blocked.revision+', flows '+JSON.parse(blocked.raw).externalCashFlows.length);
  assert.deepEqual(blocked,refreshRecord,'an open transfer dialog cannot write during an in-flight refresh');assert.match(await el('status').innerText(),/^Nicht gespeichert/);assert.equal(JSON.parse(blocked.raw).externalCashFlows.length,3);
 }finally{
  await p.evaluate(()=>{const key=Symbol.for('foliolab.test.held-quote'),gate=globalThis[key];if(gate){gate.release?.();globalThis.fetch=gate.native;delete globalThis[key];}});
 }
 await p.waitForFunction(()=>!document.getElementById('refreshAll').disabled);const refreshed=await record(),refreshedModel=JSON.parse(refreshed.raw),refreshOriginal=JSON.parse(refreshRecord.raw);assert.equal(refreshed.revision,refreshRecord.revision+1,'only one quote refresh commit');assert.equal(refreshedModel.positions.find(p=>p.id==='busy-crypto').priceExact,'2','only the explicitly triggered synthetic quote refresh commits');for(const key of ['bookings','journalEntries','externalCashFlows','openingPositions'])assert.deepEqual(refreshedModel[key],refreshOriginal[key],'quote refresh leaves '+key+' intact');await p.keyboard.press('Escape');
 await seed();await openRow('out');await choose();
 await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.bookings[0].notes='SYNTHETIC newer tab';await s.save(m);s.close();});const newer=await record();await el('accept').click();await p.waitForFunction(()=>document.querySelector('[data-transfer=status]').textContent.startsWith('Nicht gespeichert'));assert.deepEqual(await record(),newer,'row entry cannot bypass stale revision protection');await p.keyboard.press('Escape');
 console.log(engine+': integrated booking transfers '+base+',6 widths/Axe/row contexts/read-only previews/reference+consent/one CAS commit/counterparts/filter/search/Undo cancellation+exact restore/focus/stale CAS PASS');
}
