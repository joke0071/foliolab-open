// Follow the intended native disclosure interaction before invoking an action.
// Never change disabled state, dispatch synthetic clicks, or bypass a guard.
export async function revealAction(action){
 // Module top-level await can outlive the document load event after reload.
 // Wait for the actual target before deciding whether ancestors are closed.
 await action.waitFor({state:'attached'});
 for(let depth=0;depth<10;depth++){
  const closed=action.locator('xpath=ancestor::details[not(@open)][last()]');
  if(!await closed.count())return action;
  await closed.locator(':scope > summary').click();
 }
 throw Error('Action remains inside an unexpectedly deep closed disclosure');
}
export async function clickDisclosed(action){await revealAction(action);await action.click();}
