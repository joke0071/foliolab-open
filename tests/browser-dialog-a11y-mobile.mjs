import {legacyContext} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require=createRequire(import.meta.url);
const axeSource=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await legacyContext(browser,{viewport:{width:390,height:680},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await ctx.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 const openWizard=page.locator('#addWizard');
 await openWizard.click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardTitle','Wizard must open at dialog heading, not keyboard');
 await page.locator('#wizardNext').click();
 assert.match(await page.locator('#wizardError').innerText(),/Anlage auswählen/);
 assert.equal(await page.locator('#wizardName').getAttribute('aria-invalid'),'true');
 assert.equal(await page.locator('#wizardName').getAttribute('aria-describedby'),'wizardName-feedback');
 assert.match(await page.locator('#wizardName-feedback').innerText(),/Anlage auswählen/);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardName');
 await page.locator('#wizardName').fill('Testanlage');
 assert.equal(await page.locator('#wizardName').getAttribute('aria-invalid'),null,'Correction clears inline error');
 await page.locator('#wizardNext').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardSymbol','Identity field focused');
 await page.locator('#wizardSymbol').fill('TEST');
 await page.locator('#wizardNext').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardProviderName','Provider identity focused');
 await page.locator('#wizardProviderName').fill('Testanbieter');
 await page.locator('#wizardNext').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardQuantity','Missing quantity marked');
 await page.locator('#wizardQuantity').fill('3');
 await page.locator('#wizardKind').focus(); // Simulate real keyboard/user focus before selection.
 await page.locator('#wizardKind').selectOption('stock');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'wizardKind','Changing kind retains keyboard focus');
 assert.equal(await page.locator('#wizardName').inputValue(),'','Identity resets intentionally with a changed asset class');
 for(const [width,height] of [[320,360],[360,420],[390,480],[430,620],[768,600],[1440,800]]){
  await page.setViewportSize({width,height});
  const box=await page.locator('#wizardDialog').evaluate(el=>{
   const d=el.getBoundingClientRect(),footer=el.querySelector('.dialog-footer').getBoundingClientRect();
   return {left:d.left,right:d.right,top:d.top,bottom:d.bottom,footerBottom:footer.bottom,scroll:document.documentElement.scrollWidth};
  });
  assert.ok(box.left>=-1&&box.right<=width+1&&box.top>=-1&&box.bottom<=height+1,'Wizard viewport '+width+'x'+height+': '+JSON.stringify(box));
  assert.ok(box.footerBottom<=height+1&&box.scroll<=width+1,'Footer and page remain reachable '+width+'x'+height);
 }
 // axe runs against open native dialog and expanded content, including semantic error state.
 await page.setViewportSize({width:390,height:680});
 await page.locator('#wizardNext').click();
 await page.route('**/__dialog_axe.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:axeSource}));
 await page.addScriptTag({url:'http://127.0.0.1:4173/__dialog_axe.js'});
 const wizardReport=await page.evaluate(async()=>window.axe.run(document.getElementById('wizardDialog'),{
  runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}
 }));
 const seriousWizard=wizardReport.violations.filter(v=>['critical','serious'].includes(v.impact));
 assert.deepEqual(seriousWizard.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],'Wizard accessibility');
 page.once('dialog',d=>d.accept());
 await page.locator('#wizardPrev').click();
 assert.equal(await openWizard.evaluate(el=>document.activeElement===el),true,'Wizard restores focus');
 await page.locator('#mobileNav [data-page="more"]').click();
 const opener=page.locator('#addProvider');
 await opener.click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'dialogTitle','Editor opens at heading without opening keyboard');
 await page.locator('#providerName').fill('Testunternehmen');
 // Simulate persistent storage rejection to inspect the inline error without mutating portfolio.
 await page.evaluate(()=>{
  window.__oldSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key==='foliolab-open-v1')throw new DOMException('Speicher voll','QuotaExceededError');
   return window.__oldSetItem.call(this,key,value);
  };
 });
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 assert.equal(await page.locator('#editDialog').isVisible(),true);
 assert.match(await page.locator('#dialogError').innerText(),/Änderung nicht gespeichert/);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'dialogError','Accessible feedback is focused on failed save');
 assert.equal(await page.locator('#providerName').inputValue(),'Testunternehmen');
 await page.evaluate(()=>{Storage.prototype.setItem=window.__oldSetItem;delete window.__oldSetItem;});
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 assert.equal(await page.locator('#editDialog').isVisible(),false);
 assert.equal(await opener.evaluate(el=>document.activeElement===el),true);
 console.log('DIALOG A11Y MOBILE: inline field error, focus retention, axe, short viewports, save failure draft PASS');
}finally{await ctx.close();await browser.close();}
