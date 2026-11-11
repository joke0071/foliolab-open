import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

/** Real keyboard navigation; no app functions or storage paths are replaced. */
export async function navigationFocusBrowserContract({p,nav,record,engine}){
 const before=await record(),checks=[];
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:800});await nav('dashboard');
  const menu=p.locator(await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav');
  const link=p.locator('#dashboardPage [data-go="history"]');
  await link.focus();await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(()=>document.activeElement?.id),'pageTitle','page-local navigation must focus its new heading');
  assert.equal(await p.locator('#pageTitle').innerText(),'Vermögensentwicklung');
  assert.equal(await p.locator('#pageTitle').evaluate(e=>e.getBoundingClientRect().width>0),true);
  assert.equal(await p.locator('#pageTitle').getAttribute('tabindex'),'-1','heading is programmatically focusable without a new tab stop');
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>{const e=document.activeElement;return Boolean(e&&e.checkVisibility()&&e.closest('.page')?.id!=='dashboardPage');}),true,'next Tab reaches a visible control outside the previous page');
  const target=menu.locator('[data-page="bookings"]');await target.focus();await p.keyboard.press('Enter');
  assert.equal(await target.evaluate(e=>e===document.activeElement),true,'persistent navigation retains keyboard focus');
  assert.equal(await target.getAttribute('aria-current'),'page');
  assert.deepEqual(await record(),before,'navigation does not change canonical data or revision');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  checks.push({width,pageActionFocus:'pageTitle',nextTabVisibleOutsidePreviousPage:true,navigationFocusRetained:true,canonicalBytesAndRevisionUnchanged:true});
 }
 await nav('dashboard');
 const out='artifacts/gates/navigation-focus';await mkdir(out,{recursive:true});
 await writeFile(`${out}/${engine}.json`,JSON.stringify({engine,result:'PASS',checks,limits:['Automated browser keyboard test, not native TalkBack or physical Android']},null,2));
}
