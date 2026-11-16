import assert from 'node:assert/strict';

// The 300ms CSS delay starts when the animation is ready, not when app.js
// is requested. Keep the original 450ms observation window after that anchor.
export async function waitForStartupRevealWindow(page){
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('appStartup')).animationName==='startup-show');
 await page.locator('#appStartup').evaluate(async element=>{
  const animation=element.getAnimations().find(animation=>animation.animationName==='startup-show');
  await animation.ready;
 });
 await page.waitForTimeout(450);
}

// Controlled resource ordering reproduces an expired request timer before
// CSS starts. A hidden-keyframe mutant must still fail the visibility assertion.
export async function verifyStartupTiming(browser,base){
 const bounded=async(promise,label)=>{
  let timer;
  try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' request not observed within30000ms')),30000);})]);}
  finally{clearTimeout(timer);}
 };
 const rows=[];
 for(const mutant of [false,true]){
  const context=await browser.newContext({viewport:{width:320,height:740},serviceWorkers:'block'});
  const page=await context.newPage();let releaseCSS,releaseApp,cssRequested,appRequested;
  const appHold=new Promise(resolve=>releaseApp=resolve);
  const cssHold=new Promise(resolve=>releaseCSS=resolve),cssSeen=new Promise(resolve=>cssRequested=resolve),appSeen=new Promise(resolve=>appRequested=resolve);
  await page.route('**/src/app.js',async route=>{appRequested();await appHold;await route.abort();});
  await page.route('**/styles.css',async route=>{
   cssRequested();await cssHold;
   if(!mutant)return route.continue();
   const response=await route.fetch(),body=await response.text();
   assert.ok(body.includes('@keyframes startup-show{to{visibility:visible}}'));
   await route.fulfill({response,body:body.replace('@keyframes startup-show{to{visibility:visible}}','@keyframes startup-show{to{visibility:hidden}}')});
  });
  try{
   await page.clock.install();await page.goto(base,{waitUntil:'commit'});await bounded(cssSeen,'stylesheet');
   const timerStart=Date.now();await page.waitForTimeout(450);const oldTimerElapsed=Date.now()-timerStart;
   releaseCSS();await bounded(appSeen,'held application');
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('appStartup')).animationName==='startup-show');
   await page.locator('#appStartup').evaluate(async element=>{const animation=element.getAnimations().find(a=>a.animationName==='startup-show');await animation.ready;animation.pause();animation.currentTime=0;});
   // Freeze only the diagnostic's early observation so runner scheduling cannot
   // turn the counterexample into a late successful observation.
   const prematureVisible=await page.locator('#appStartup').isVisible();
   assert.equal(prematureVisible,false,'expired request timer does not establish CSS visibility');
   await page.locator('#appStartup').evaluate(element=>element.getAnimations().find(a=>a.animationName==='startup-show').play());
   await waitForStartupRevealWindow(page);
   const visible=await page.locator('#appStartup').isVisible();
   if(mutant)assert.throws(()=>assert.ok(visible),'a permanently hidden loader must fail the original assertion');
   else assert.ok(visible,'real stylesheet reveals the loader after its own delay');
   assert.ok(await page.locator('.layout').evaluate(element=>element.inert));
   rows.push({mutant,oldTimerElapsed,prematureVisible,anchoredVisible:visible,result:'PASS'});
  }finally{releaseCSS();releaseApp();await context.close();}
 }
 return rows;
}
