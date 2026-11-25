import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [engine,pw,base]=process.argv.slice(2);
const playwright=await import(pathToFileURL(resolve(pw)));
const browser=await playwright[engine].launch();
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 const page=await context.newPage();await page.goto(base+'/old/index.html');
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const start=await page.evaluate(async()=>{
  const {PortfolioStorage}=await import('/old/src/browser-portfolio-storage.js');
  window.oldReader=new PortfolioStorage();await oldReader.initialize();return oldReader.revision;
 });
 const writer=await context.newPage();await writer.goto(base+'/new/index.html');
 await writer.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=p=>p.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/new/src/atomic-storage.js');const db=await openPortfolioDB();
  try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 const next=await writer.evaluate(async()=>{
  const {createProvider,createAccount,createPosition}=await import('/new/src/model.js');
  const {captureOpenings}=await import('/new/src/transactions.js');
  const {PortfolioStorage}=await import('/new/src/browser-portfolio-storage.js');
  const storage=new PortfolioStorage();try{
   const m=await storage.initialize();
   m.providers.push(createProvider({id:'test',name:'Öffentliche Referenz',type:'wallet'}));
   m.accounts.push(createAccount({id:'test',providerId:'test',name:'NEAR',type:'wallet'},m));
   m.positions.push(createPosition({id:'near',kind:'crypto',name:'NEAR',providerId:'test',accountId:'test',quantityExact:'145768.498431409676817125837316',price:0,coinId:'near',symbol:'NEAR',wallet:{enabled:true,chain:'near',address:'aurora'}},m));
   captureOpenings(m);await storage.save(m);return storage.revision;
  }finally{storage.close();}
 });
 assert.equal(next,start+1);const saved=await record(writer);
 const message=await page.evaluate(async()=>{try{await oldReader.reload();return null}catch(e){return e.message}finally{oldReader.close()}});
 const reason=await page.evaluate(async raw=>{const {safeImport}=await import('/old/src/model.js');try{safeImport(JSON.parse(raw));return null}catch(e){return e.message}},saved.raw);
 assert.match(reason,/18 Nachkommastellen/);assert.match(message,/Keine Änderungen vorgenommen/);assert.deepEqual(await record(writer),saved);
 const old=await context.newPage();await old.goto(base+'/old/index.html');
 await old.waitForFunction(()=>document.getElementById('appStartup')?.hidden&&/nicht lesbar|beschädigt|Lesefehler|nicht geladen|Wiederherstellung/i.test(document.body.innerText));
 assert.deepEqual(await record(writer),saved);
 await writer.reload();await writer.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 assert.deepEqual(await record(writer),saved);
 console.log(JSON.stringify({engine,browser:browser.version(),legacy:'SW346',candidate:'SW347',initialRevision:start,acceptedRevision:next,legacyParser:reason,openTabStorageMessage:message,freshOldProfileTabOpenedRecoverableError:true,oldReadersPreservedRawAndRevision:true,reopenedNewReaderPreservedRawAndRevision:true,sha256:createHash('sha256').update(saved.raw).digest('hex')}));
}finally{await browser.close();}
