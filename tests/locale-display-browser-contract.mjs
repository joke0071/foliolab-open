import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {transferFixture} from './transfer-matching-fixture.mjs';
/** Display-only contract against delivered modules and real canonical IndexedDB. */
export async function localeDisplayBrowserContract({p,nav,record,scan,engine,scans=[]}){
 await p.evaluate(async m=>{
  const {createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const cash=m.positions[0];m.positions.push(createPosition({id:'locale-tiny',providerId:cash.providerId,accountId:cash.accountId,name:'SYNTHETIC winziger Bestand',kind:'etf',symbol:'TINY',quantity:0,price:100},m));
  executeTransaction(m,{id:'locale-buy',type:'buy',date:'2024-02-29',positionId:'locale-tiny',quantity:'0.000000000000000001',unitPrice:100});
  executeTransaction(m,{id:'locale-fraction',type:'withdraw',date:'2026-03-29',positionId:cash.id,quantity:'0.123456789012345678'});
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
 },transferFixture());
 await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));const before=await record();
 assert.equal(JSON.parse(before.raw).positions.find(x=>x.id==='locale-tiny').quantityExact,'0.000000000000000001');
 mkdirSync('artifacts/gates/locale-display',{recursive:true});
 for(const width of [320,360,390,412,430,1440]){
  await p.setViewportSize({width,height:900});await nav('bookings');await p.locator('#bookingSearch').fill('');
  const buy=p.locator('[data-booking-id="locale-buy"]'),fraction=p.locator('[data-booking-id="locale-fraction"]');
  assert.equal(await buy.locator('time').getAttribute('datetime'),'2024-02-29');assert.equal(await buy.locator('time').innerText(),'29.02.2024');assert.equal(await buy.locator('.quantity-display').innerText(),'+1E-18');
  assert.equal(await fraction.locator('time').innerText(),'29.03.2026');assert.equal(await fraction.locator('.quantity-display').innerText(),'-0,123456789012345678');
  await buy.locator('.booking-meta>summary').click();const restrictions=buy.locator('.booking-permission-details');assert.equal(await restrictions.evaluate(e=>e.open),false,'technical restrictions start compact');const reasonSummary=restrictions.locator('summary');assert.ok((await reasonSummary.boundingBox()).height>=44);await reasonSummary.focus();await p.keyboard.press('Enter');assert.equal(await restrictions.evaluate(e=>e.open),true);assert.match(await restrictions.locator('p').innerText(),/Status|Kapitalfluss|belegt/);await scan('expanded restriction '+width);await reasonSummary.click();assert.equal(await restrictions.evaluate(e=>e.open),false);assert.match(await buy.locator('.booking-meta>summary').getAttribute('aria-label'),/29\.02\.2024/);await scan('localized bookings '+width);
  await buy.scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/gates/locale-display/'+engine+'-bookings-'+width+'.png'});await buy.locator('.booking-meta>summary').click();
  for(const term of ['29.02.2024','2024-02-29']){await p.locator('#bookingSearch').fill(term);assert.equal(await p.locator('.booking-management-row').count(),1,'localized and original ISO dates remain searchable');}
  await p.locator('#bookingSearch').fill('');await fraction.locator('.booking-meta>summary').click();await fraction.locator('[data-action=booking-transfer]').click();
  const dialog=p.locator('#transferMatchingDialog');assert.match(await dialog.locator('[data-transfer=out] option:checked').innerText(),/29\.03\.2026.*0,123456789012345678/);await scan('localized transfer '+width);await p.keyboard.press('Escape');
  await nav('positions');await p.locator('#positionSearch').fill('SYNTHETIC winziger Bestand');
  const detail=p.locator('.position-entry .holding-expand');await detail.locator('summary').click();
  const fact=detail.locator('.holding-facts>div').filter({has:p.locator('dt', {hasText:/^Bestand$/})});assert.equal(await fact.locator('dd').innerText(),'1E-18');await scan('localized tiny position '+width);await detail.scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/gates/locale-display/'+engine+'-positions-'+width+'.png'});
  await detail.locator('summary').click();await p.locator('#positionSearch').fill('');
  // The native provider details use the same delivered formatters; reading the
  // generated timeline does not need an external market-history request.
  const timeline=await p.evaluate(async()=>{const {positionDetailMarkup}=await import('/src/position-detail-ui.js'),{escapeHTML,money,quant,valueEUR}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();const host=document.createElement('div');host.innerHTML=positionDetailMarkup(m.positions.find(x=>x.id==='locale-tiny'),m,{esc:escapeHTML,money,quant,valueEUR});const summary=host.querySelector('.position-booking-history>summary');return {summary:summary.textContent,text:host.querySelector('.position-booking-history').textContent};});
  assert.match(timeline.summary,/Gebuchte Vorgänge \(1\)/);assert.match(timeline.text,/29\.02\.2024/);assert.match(timeline.text,/1E-18/);
  assert.deepEqual(await record(),before,'display/search/previews preserve exact IndexedDB record');scans.push({page:'locale-display',width,height:900});
 }
 console.log(engine+': de-AT dates/exact decimal quantities/tiny nonzero holdings,6 widths/Axe/transfer/ISO search/unchanged canonical record PASS');
}
