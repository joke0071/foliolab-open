// Independent browser diagnostic: no FolioLab bootstrap, storage or service worker.
// Every origin/method/consent case remains a strict gate; known failures are recorded,
// not converted to skips or accepted as browser-specific success.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';

const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Unload diagnostic</title>
<a id="enter">Open synthetic form</a><label>Draft<input id="draft"></label>
<script>
document.getElementById('enter').href='http://127.0.0.1:'+location.port+'/form';
let dirty=false;
document.getElementById('draft').addEventListener('input',()=>dirty=true);
addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=true;}});
</script></html>`;
const server=createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,base=`http://127.0.0.1:${port}`,results=[],failures=[];
try{
 for(const engine of (process.env.UNLOAD_ENGINES||'chromium').split(',')){
  const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const origin of ['same','cross'])for(const method of ['script','driver'])for(const consent of ['reject','accept']){
    const context=await browser.newContext(),page=await context.newPage();
    const previous=`http://${origin==='same'?'127.0.0.1':'localhost'}:${port}/previous`;
    const result={engine,version:browser.version(),origin,method,consent,dialogs:[]};
    try{
     await page.goto(previous);await page.locator('#enter').click();await page.waitForURL(base+'/form');
     await page.locator('#draft').click();
     await page.locator('#draft').fill('Synthetic unsaved input');
     result.before=await page.evaluate(()=>({href:location.href,historyLength:history.length,active:navigator.userActivation.hasBeenActive}));
     assert.equal(result.before.active,true);
     // Observe the handler independently before real native traversal.
     assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),true);
     page.on('dialog',async dialog=>{result.dialogs.push(dialog.type());await dialog[consent==='reject'?'dismiss':'accept']();});
     const warning=page.waitForEvent('dialog',{predicate:d=>d.type()==='beforeunload',timeout:2500});
     // Await both outcomes: no dangling rejected promise can terminate other cases.
     const navigation=method==='driver'?page.goBack({timeout:2500}):page.evaluate(()=>{setTimeout(()=>history.back(),0);});
     const outcomes=await Promise.allSettled([warning,navigation]);
     assert.equal(outcomes[0].status,'fulfilled','Native Back must ask before discarding');
     assert.deepEqual(result.dialogs,['beforeunload']);
     if(consent==='reject'){
      assert.equal(page.url(),base+'/form');
      assert.equal(await page.locator('#draft').inputValue(),'Synthetic unsaved input');
     }else{
      await page.waitForURL(previous,{timeout:2500});assert.equal(page.url(),previous);
     }
     result.status='PASS';
    }catch(error){result.status='FAIL';result.error=error.message;failures.push(result);}
    finally{
     result.after=await page.evaluate(()=>({href:location.href,draft:document.getElementById('draft')?.value})).catch(()=>null);
     results.push(result);console.log(JSON.stringify(result));await context.close();
    }
   }
  }finally{await browser.close();}
 }
}finally{
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 mkdirSync('artifacts/gates',{recursive:true});
 writeFileSync('artifacts/gates/beforeunload-origin.json',JSON.stringify({results,failures:failures.length},null,2)+'\n');
}
assert.equal(failures.length,0,'All native Back consent/origin gates must pass; see beforeunload-origin.json');
