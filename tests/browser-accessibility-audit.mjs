import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require=createRequire(import.meta.url);
const axeScript=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const pages=['dashboard','history','positions','bookings','more'];
const issues=[];
try{
 await page.route('**/__audit_axe.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:axeScript}));
 await page.goto('http://127.0.0.1:4173/');
 await page.addScriptTag({url:'http://127.0.0.1:4173/__audit_axe.js'});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  const nav=width===390?'#mobileNav':'#sidebarNav';
  for(const section of pages){
   await page.locator(nav+' [data-page="'+section+'"]').click();
   const report=await page.evaluate(async()=>await window.axe.run(document,{
    runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
   }));
   const violations=report.violations.map(v=>({id:v.id,impact:v.impact,description:v.help,targets:v.nodes.slice(0,140).map(n=>({selector:n.target.join(' '),contrast:n.any.find(c=>c.id==='color-contrast')?.data??null}))}));
   for(const issue of violations)issues.push({viewport:width,section,...issue});
  }
 }
 await page.locator('#sidebarNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 const dialog=await page.evaluate(async()=>await window.axe.run(document.getElementById('editDialog'),{
  runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
 }));
 for(const v of dialog.violations)issues.push({viewport:1440,section:'provider-dialog',id:v.id,impact:v.impact,description:v.help,targets:v.nodes.slice(0,140).map(n=>({selector:n.target.join(' '),contrast:n.any.find(c=>c.id==='color-contrast')?.data??null}))});
 const unique=[...new Set(issues.map(i=>i.id))];
 console.log('ACCESSIBILITY-AUDIT '+JSON.stringify({scans:pages.length*2+1,violations:issues,uniqueRules:unique}));
 // Initial inventory gate: critical issues are unsafe to ship; other findings must
 // be triaged explicitly instead of falsely claiming complete WCAG conformity.
 assert.equal(issues.filter(x=>['serious','critical'].includes(x.impact)).length,0,'Serious/critical WCAG accessibility violations');
}finally{await browser.close();}
