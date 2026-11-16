// Run from repository root with the existing HTTP server on4173 and normal test dependencies.
// Current-head oracle; before/after reports identify their exact source heads.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('artifacts/contrast-probe',{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const c=await b.newContext({viewport:{width:430,height:900}});await c.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const p=await c.newPage();await p.goto('http://127.0.0.1:4173/?page=positions');await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await p.evaluate(()=>getComputedStyle(document.getElementById('addWizard')).color);
 await p.setViewportSize({width:768,height:900});
 const samples=await p.evaluate(()=>{
  const btn=document.getElementById('addWizard');getComputedStyle(btn).color;
  const animations=btn.getAnimations();for(const a of animations)a.pause();
  const states=[];for(const time of [0,26,52,78,104,130]){for(const a of animations)a.currentTime=time;const s=getComputedStyle(btn);states.push({time,color:s.color,background:s.backgroundColor});}
  for(const a of animations)a.currentTime=52;
  return {animations:animations.map(a=>({property:a.transitionProperty,duration:a.effect.getComputedTiming().duration})),states};
 });
 const during=(await p.evaluate(async()=>(await axe.run('#positionsPage',{runOnly:{type:'rule',values:['color-contrast']}})).violations));
 await p.evaluate(()=>document.getElementById('addWizard').getAnimations().forEach(a=>a.finish()));
 const after=(await p.evaluate(async()=>(await axe.run('#positionsPage',{runOnly:{type:'rule',values:['color-contrast']}})).violations));
 const report={samples,during,after};writeFileSync('artifacts/contrast-probe/after.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.deepEqual(during,[],'responsive midpoint retains contrast');assert.deepEqual(after,[],'responsive endpoint retains contrast');
}finally{await b.close();}
