import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const first=await context.newPage(),second=await context.newPage();
try{
 await first.goto('http://127.0.0.1:4173/tests/storage-origin.html');
 const backups=await first.evaluate(async()=>{
  const {blankModel,createProvider,persist,backup}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const original=blankModel();
  original.settings.autoRefresh=false;
  original.providers.push(createProvider({name:'Base provider'}));
  persist(original);
  const store=new PortfolioStorage();await store.migrate(original);store.close();
  const make=label=>{
   const m=structuredClone(original);
   m.providers.push(createProvider({name:label}));
   return backup(m);
  };
  return [make('Import tab A'),make('Import tab B')];
 });
 await Promise.all([first.reload(),second.goto('http://127.0.0.1:4173/tests/storage-origin.html')]);
 await Promise.all([first.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent?.includes('IndexedDB aktiv')),
  second.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent?.includes('IndexedDB aktiv'))]);
 first.on('dialog',async d=>d.accept());second.on('dialog',async d=>d.accept());
 await Promise.all([
  first.locator('#backupFile').setInputFiles({name:'a.json',mimeType:'application/json',buffer:Buffer.from(backups[0])}),
  second.locator('#backupFile').setInputFiles({name:'b.json',mimeType:'application/json',buffer:Buffer.from(backups[1])})
 ]);
 await first.waitForTimeout(700);
 const outcome=await first.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{
   const record=await readPortfolioRecord(db);
   return {revision:record.revision,names:JSON.parse(record.raw).providers.map(x=>x.name)};
  }finally{db.close();}
 });
 assert.equal(outcome.revision,2,'Exactly one importer may commit from revision 1');
 assert.equal(outcome.names.length,2);
 assert.equal(outcome.names[0],'Base provider');
 assert.ok(['Import tab A','Import tab B'].includes(outcome.names[1]));
 await Promise.all([first.reload(),second.reload()]);
 const after=await second.evaluate(async()=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const store=new PortfolioStorage();try{return (await store.initialize()).providers.map(x=>x.name);}
  finally{store.close();}
 });
 assert.deepEqual(after,outcome.names);
 console.log('CONCURRENT BACKUP IMPORTS: only one revision commits, no overwritten providers, restart data intact PASS');
}finally{await context.close();await browser.close();}
