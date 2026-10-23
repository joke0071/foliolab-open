import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 const seeded=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Synthetic performance broker'});
  m.providers.push(p);
  const a=createAccount({providerId:p.id,name:'Testportfolio',type:'securities'},m);
  m.accounts.push(a);
  m.settings.autoRefresh=false;
  for(let i=0;i<1000;i++){
   m.positions.push(createPosition({id:'scale-'+i,providerId:p.id,accountId:a.id,
    name:'Synthetic ETF '+String(i).padStart(4,'0'),kind:'etf',symbol:'T'+i,
    quantity:'1',price:'10',currency:'EUR'},m));
  }
  for(let i=0;i<1825;i++){
   const date=new Date(Date.UTC(2021,0,1+i)).toISOString().slice(0,10);
   m.snapshots.push({id:'historical-'+i,date,total:10000,totalEURExact:'10000',
    valuationStatus:'manual',source:'manual',byAccount:null,byPosition:null,
    quoteTimes:[],revisions:[],note:''});
  }
  const started=performance.now();
  persist(m);
  return {positions:m.positions.length,snapshots:m.snapshots.length,
   serializedBytes:new TextEncoder().encode(localStorage.getItem('foliolab-open-v1')).length,
   writeMs:Math.round(performance.now()-started)};
 });
 const startReload=Date.now();
 await page.reload();
 await page.locator('#totalValue').waitFor();
 assert.match(await page.locator('#totalValue').innerText(),/10.000/);
 const reloadMs=Date.now()-startReload;
 const startPositions=Date.now();
 await page.locator('#sidebarNav [data-page="positions"]').click();
 assert.match(await page.locator('#positionList').innerText(),/Synthetic ETF/);
 const positionsMs=Date.now()-startPositions;
 const startFilter=Date.now();
 await page.locator('#positionSearch').fill('Synthetic ETF 0421');
 assert.match(await page.locator('#positionList').innerText(),/Synthetic ETF 0421/);
 const filterMs=Date.now()-startFilter;
 const startHistory=Date.now();
 await page.locator('#sidebarNav [data-page="history"]').click();
 assert.equal(await page.locator('#historyPage').isVisible(),true);
 const historyMs=Date.now()-startHistory;
 await page.setViewportSize({width:320,height:760});
 await page.locator('#mobileNav [data-page="positions"]').click();
 const overflow=await page.evaluate(()=>({content:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(overflow.content<=overflow.viewport+1,'Large portfolio causes mobile horizontal overflow');
 const remaining=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(remaining.positions.length,1000);
 assert.equal(remaining.snapshots.length,1825);
 const quota=await page.evaluate(()=>{
  const key='foliolab-open-v1',before=localStorage.getItem(key);
  const temporary=[],chunk='Q'.repeat(1024*1024);
  let quotaExceeded=false;
  try{
   for(let i=0;i<16;i++){
    const name='__temporary_scale_quota_'+i;
    try{localStorage.setItem(name,chunk);temporary.push(name);}
    catch(error){
     if(error?.name!=='QuotaExceededError')throw error;
     quotaExceeded=true;break;
    }
   }
  }finally{
   for(const name of temporary)localStorage.removeItem(name);
  }
  return {extraMiBAccepted:temporary.length,quotaExceeded,portfolioUnchanged:localStorage.getItem(key)===before};
 });
 assert.equal(quota.portfolioUnchanged,true,'Quota probe may never alter saved portfolio');
 console.log('BROWSER-SCALE '+JSON.stringify({...seeded,reloadMs,positionsMs,filterMs,historyMs,overflow,quota}));
 // Performance measurements are runner-dependent, so strict benchmarks are reported
 // separately; this gate verifies usability and integrity without fragile millisecond SLAs.
}finally{await browser.close();}
