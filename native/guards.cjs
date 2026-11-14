const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try {
  for(const variant of ['unconfirmed','revert-intent','damaged','unknown-mode','tombstone']){
   const context=await browser.newContext();
   const page=await context.newPage();
   await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
   const result=await page.evaluate(async variant=>{
    const {PortfolioStorage,MODE_KEY,REVERT_INTENT_KEY}=await import('/src/browser-portfolio-storage.js');
    const {fixture}=await import('/tests/restore-position-fixture.mjs');
    const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');
    const writer=new PortfolioStorage();await writer.initialize();await writer.save(fixture());writer.close();
    const db=await openPortfolioDB(),original=await readUnverifiedRecord(db);
    if(original.confirmedActive!==true)throw Error('missing active proof');
    if(variant==='unconfirmed')delete original.confirmedActive;
    if(variant==='damaged')original.raw='{invalid';
    if(variant==='tombstone'){original.raw=null;original.deleted=true;original.settings=null;}
    await new Promise((ok,fail)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(original,'portfolio');tx.oncomplete=ok;tx.onabort=()=>fail(tx.error)});
    localStorage.removeItem(MODE_KEY);
    if(variant==='unknown-mode')localStorage.setItem(MODE_KEY,'future');
    if(variant==='revert-intent')localStorage.setItem(REVERT_INTENT_KEY,'pending');
    const storage=new PortfolioStorage();let error;try{await storage.initialize()}catch(e){error=e.message}
    const after=await readUnverifiedRecord(db);storage.close();db.close();
    return {error,preserved:JSON.stringify(original)===JSON.stringify(after),mode:localStorage.getItem(MODE_KEY)};
   },variant);assert(result.error,variant);assert(result.preserved,variant);assert.equal(result.mode,variant==='unknown-mode'?'future':null);console.log('GUARD PASS',variant);await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
