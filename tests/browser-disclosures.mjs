import {manageList} from './browser-management-mode.mjs';
export async function returnFromSection(page){
 const nav=page.locator('#sectionNav');
 const active=nav.locator('[aria-current]');
 if(await active.getAttribute('aria-current')==='location')await active.click();
 else await nav.locator('a').first().click();
}
// Follow the intended native disclosure interaction before invoking an action.
// Never change disabled state, dispatch synthetic clicks, or bypass a guard.
export async function revealAction(action){
 // Module top-level await can outlive the document load event after reload.
 // Wait for the actual target before deciding whether ancestors are closed.
 await action.waitFor({state:'attached'});
 if(await action.evaluate(el=>Boolean(el.closest('.section-obscured')))){
  const id=await action.evaluate(el=>{
   const panel=el.closest('#morePage .settings-grid>.panel');
   if(panel)return panel.querySelector('h2[id]').id;
   const area=el.closest('#bookingPanel,#bookingIncomeDetails,#internalTransfers,#snapshotManager,#portfolioProjection,#performanceDetails');
   return area?.id||'historyDiagram';
  });
  await action.page().locator('[data-section="'+id+'"]').click();
 }
 const managed=action.locator('xpath=ancestor::div[@hidden and contains(@class,"detail-action-row")]');
 if(await managed.count()){
  const list=action.locator('xpath=ancestor::*[@id="positionList" or @id="bookingList"]');
  if(await list.count())await manageList(action.page(),await list.getAttribute('id')==='positionList'?'positions':'bookings');
 }
 for(let depth=0;depth<10;depth++){
  const closed=action.locator('xpath=ancestor::details[not(@open)][last()]');
  if(!await closed.count())return action;
  await closed.locator(':scope > summary').click();
 }
 throw Error('Action remains inside an unexpectedly deep closed disclosure');
}
export async function clickDisclosed(action){await revealAction(action);await action.click();}
