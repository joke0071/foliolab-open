import assert from 'node:assert/strict';
import {rename,symlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';

const port=process.env.TRANSITION_PORT||'4417';
const base='http://127.0.0.1:'+port+'/';
const mount=resolve('sw347-transition-serving-'+port),next=mount+'-next';
const swap=async tree=>{await symlink(resolve(tree),next);await rename(next,mount);};
const legacyRaw='2500000000000000000000000';
const fullRaw='145768498431409676817125837316', full='145768.498431409676817125837316';
const results=[];
for(const engine of (process.env.TRANSITION_ENGINES||'chromium,firefox,webkit').split(',')){
 const launcher={chromium,firefox,webkit}[engine];
 console.error('start',engine);
 await swap('sw346-main');
 const options=engine==='webkit'?{executablePath:process.env.TRANSITION_WEBKIT_EXECUTABLE}:{};
 const browser=await launcher.launch(options);
 try{
  const context=await browser.newContext();
  await context.addInitScript(({legacyRaw,fullRaw})=>{
   const nativeFetch=window.fetch.bind(window);
   window.fetch=(input,options)=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.origin===location.origin)return nativeFetch(input,options);
    if(url.hostname==='rpc.mainnet.fastnear.com'&&options?.method==='POST'){
     const {params}=JSON.parse(options.body);
     if(params.request_type!=='view_account'||params.account_id!=='aurora'||params.finality!=='final')throw Error('Unexpected public NEAR fixture request');
     const amount=localStorage.getItem('local-qa-near')==='full'?fullRaw:legacyRaw;
     return Promise.resolve(new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:{amount,locked:'0'}})));
    }
    return Promise.reject(new Error('External requests are disabled in this release reproduction.'));
   }
  },{legacyRaw,fullRaw});
  const page=await context.newPage();
  page.on('pageerror',error=>console.error('pageerror',engine,error.stack));
  const ready=()=>page.waitForFunction(()=>document.getElementById('appStartup')?.hidden&&document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')&&navigator.serviceWorker.controller);
  const get=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const db=await openPortfolioDB();
   try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  const scan=async()=>{
   await page.locator('#sidebarNav [data-page=positions]').click();
   await page.locator('#addWallet').click();
   await page.locator('#scanNetwork').selectOption('near');
   await page.locator('#scanAddress').fill('aurora');
   await page.locator('#scanWalletButton').click();
   try{await page.locator('[data-wallet-asset]').waitFor({timeout:12000});}
   catch(error){
    console.error(engine,await page.locator('#editDialog').innerText(),await page.evaluate(async raw=>{
     const assetSource=await fetch('/src/native-staking-networks.js').then(r=>r.text());
     const decimal=await import('/src/decimal.js');
     const native=await import('/src/native-staking-networks.js');
     let direct=null;
     try{direct=await native.nearAccountBalances('aurora',async()=>new Response(JSON.stringify({result:{amount:raw,locked:'0'}})));}
     catch(error){direct=error.stack;}
     return {caches:await caches.keys(),nearNative:assetSource.includes('nearQuantity'),publicNearQuantity:Boolean(decimal.nearQuantity),direct,controller:navigator.serviceWorker.controller?.state};
    },fullRaw));
    throw error;
   }
   await page.locator('#saveDialog').click();
   await page.locator('#editDialog').waitFor({state:'hidden'});
  };
  await page.goto(base);await ready();await scan();
  await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const {createProvider,createAccount,createPosition}=await import('/src/model.js');
   const {executeTransaction}=await import('/src/transactions.js');
   const storage=new PortfolioStorage();const m=await storage.initialize();
   try{
    m.providers.push(createProvider({id:'bank',name:'Legacy bank',type:'bank'}));
    m.accounts.push(createAccount({id:'current',providerId:'bank',name:'EUR',type:'checking'},m));
    m.positions.push(createPosition({id:'cash',providerId:'bank',accountId:'current',kind:'cash',name:'EUR',quantity:'5',price:1},m));
    executeTransaction(m,{positionId:'cash',type:'deposit',date:'2026-11-25',quantity:'3',unitPrice:1});
    await storage.save(m);
   }finally{storage.close();}
  });
  await page.reload();await ready();
  const before=await get(), initial=JSON.parse(before.raw);
  assert.equal(initial.positions[0].quantityExact,'2.5');
  assert.equal(initial.openingPositions.find(p=>p.positionId===initial.positions[0].id).quantityExact,'2.5');
  await swap('sw347-candidate');
  const updated=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame());
  await page.evaluate(()=>{
   void navigator.serviceWorker.ready.then(registration=>registration.update());
  });
  const waitCache=(oldVersion,newVersion)=>page.waitForFunction(async([oldVersion,newVersion])=>await caches.has('foliolab-open-v'+newVersion)&&!(await caches.has('foliolab-open-v'+oldVersion)),[oldVersion,newVersion]);
  await waitCache(346,347);
  await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.ready;return r.active===navigator.serviceWorker.controller&&r.active.state==='activated';});
  await updated;
  try{await ready();}
  catch(error){
   console.error('update did not become ready',engine,await page.evaluate(async()=>({body:document.body.innerText?.slice(0,1000),caches:await caches.keys(),controller:navigator.serviceWorker.controller?.state})));
   throw error;
  }
  const controllerAfterNavigation=await page.evaluate(()=>navigator.serviceWorker.controller.state);
  assert.equal(await page.evaluate(async()=>Boolean((await import('/src/decimal.js')).nearQuantity)),true);
  assert.deepEqual(await get(),before);
  await page.evaluate(()=>localStorage.setItem('local-qa-near','full'));await scan();
  const accepted=await get(), portfolio=JSON.parse(accepted.raw), key=initial.positions[0].id;
  assert.equal(portfolio.positions.length,2);
  assert.equal(portfolio.positions[0].id,key);
  assert.equal(portfolio.positions[0].quantityExact,full);
  assert.equal(portfolio.openingPositions.find(p=>p.positionId===key).quantityExact,full);
  assert.deepEqual(portfolio.positions[1],initial.positions[1]);
  assert.deepEqual(portfolio.journalEntries,initial.journalEntries);
  assert.deepEqual(portfolio.externalCashFlows,initial.externalCashFlows);
  assert.equal(accepted.revision,before.revision+1);
  await context.setOffline(true);
  await page.reload();await ready();
  assert.deepEqual(await get(),accepted);
  results.push({engine,browser:browser.version(),controllerAfterNavigation,controllerAfterOfflineReopen:await page.evaluate(()=>navigator.serviceWorker.controller.state),
   oldBalance:'2.5',stateByteExactAfterUpdate:true,positionIdRetained:true,oneRevision:true,offlineReopened:true,finalQuantity:full});
  console.error('pass',engine);
 }finally{await browser.close();}
}
console.log(JSON.stringify({from:'61d67d0d',candidate:'c3d6204f',tree:'e87fab0abdbc0dda57da48cf9f30bccbabbb655c',results},null,2));
