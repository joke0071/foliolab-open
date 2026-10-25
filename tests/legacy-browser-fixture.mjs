import {blankModel,STORE_KEY} from '../src/model.js';
/** Explicit pre-existing installation for regressions of the retained legacy
 * path. No app switches, API mocks or assertions are bypassed. New-installation
 * coverage deliberately does not use this fixture. */
export async function legacyContext(browser,options){
 const context=await browser.newContext(options);
 await context.addInitScript(({key,raw})=>{
  if(location.protocol.startsWith('http')&&localStorage.getItem(key)===null&&localStorage.getItem('foliolab-open-storage-mode')===null)
   localStorage.setItem(key,raw);
 },{key:STORE_KEY,raw:JSON.stringify(blankModel())});
 return context;
}
export async function legacyPage(browser,options){
 const context=await legacyContext(browser,options);
 return context.newPage();
}
