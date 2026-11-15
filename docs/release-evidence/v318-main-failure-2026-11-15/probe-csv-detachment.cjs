const {createRequire}=require('node:module');
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/package.json');
const {chromium}=req('playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=__dirname+'/../foliolab-open',server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
(async()=>{let browser;try{
 for(let n=0;n<50;n++){try{if((await fetch('http://127.0.0.1:4173/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:'/home/agent/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:430,height:900},serviceWorkers:'block'}),page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>document.getElementById('appStartup').hidden&&document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
 await page.evaluate(async()=>{const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC',type:'securities'},m));m.positions.push(createPosition({id:'etf',providerId:'p',accountId:'a',kind:'etf',name:'SYNTHETIC ETF',quantity:1,price:100},m));const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});
 await page.reload();await page.waitForFunction(()=>document.getElementById('appStartup').hidden);
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readUnverifiedRecord(db));}finally{db.close();}});
 const before=await record();await page.locator('#providerOverview details').evaluateAll(es=>es.forEach(e=>e.open=true));await page.locator('.position-csv-import').waitFor({state:'visible'});
 const old=await page.locator('.position-csv-import').elementHandle();
 await page.locator('details[data-position-id=etf]').evaluate(e=>e.dispatchEvent(new Event('toggle')));
 const stale=await old.evaluate(e=>({connected:e.isConnected,height:e.getBoundingClientRect().height,ancestorClasses:[e.parentElement?.className,e.parentElement?.parentElement?.className]}));
 const fresh=await page.evaluate(()=>{const e=document.querySelector('.position-csv-import');return {connected:e?.isConnected,height:e?.getBoundingClientRect().height};});
 assert.deepEqual(stale,{connected:false,height:0,ancestorClasses:['position-csv-actions','position-native-quote-actions']});assert.deepEqual(fresh,{connected:true,height:44});assert.equal(await record(),before);
 const result={result:'PASS',source:'127019cf71304981c0c7f1a446f4dee8bc27404d',browser:browser.version(),environment:'Linux Chromium; isolated native IDB; synthetic fixture; SW blocked for match with canonical navigation test',mechanism:'Real app toggle handler rerenders the position detail between retained element resolution and measurement',stale,fresh,fullIDBRecordUnchanged:true,limits:'Controlled lifecycle reproduction explains this observed disconnected-element failure. Historical failures without equivalent capture remain UNKNOWN. No product geometry fix or production/hardware claim.'};
 fs.writeFileSync(__dirname+'/csv-detachment-native-repro.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
