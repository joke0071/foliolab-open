import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const today=new Date().toISOString().slice(0,10);
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(date=>import('/src/model.js').then(({blankModel,createProvider,createAccount,createPosition,snapshot,persist})=>{
  const m=blankModel(),provider=createProvider({name:'Testanbieter'});m.providers.push(provider);
  const account=createAccount({providerId:provider.id,name:'Langfristiges Depot',type:'securities'},m);
  m.accounts.push(account);m.settings.autoRefresh=false;
  const positions=[
   {id:'etf-test',name:'Vanguard FTSE All-World <img src=x onerror=window.__bad=true>',kind:'etf',symbol:'VWCE',quantity:'10',price:'100'},
   {id:'btc-test',name:'Bitcoin',kind:'crypto',symbol:'BTC',coinId:'bitcoin',quantity:'0.5',price:'70000'},
   {id:'cash-test',name:'Guthaben',kind:'cash',symbol:'EUR',quantity:'500',price:'1'}
  ];
  for(const props of positions)m.positions.push(createPosition({...props,providerId:provider.id,accountId:account.id},m));
  snapshot(m,date);persist(m);
 }),today);
 await page.reload();
 assert.equal(await page.locator('#providerOverview .provider-position-accordion').first().isVisible(),false);
 await page.locator('#providerOverview .provider-accordion>summary').first().click();
 assert.equal(await page.locator('#providerOverview .provider-position-accordion').count(),3);
 assert.equal(await page.evaluate(()=>window.__bad),undefined);
 const btc=page.locator('#providerOverview [data-position-id="btc-test"]');
 let calls=0;
 await page.route('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart**',route=>{
  calls++;
  const now=Date.now();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({prices:[[now-3*864e5,70000],[now-2*864e5,71000],[now-864e5,72000],[now,73000]]})});
 });
 await btc.locator('summary').click();
 assert.equal(await btc.getAttribute('open'),'');
 await btc.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await btc.innerText(),/Kurs je Einheit/);
 assert.match(await btc.innerText(),/Marktkurs je Einheit/);
 assert.match(await btc.innerText(),/nicht deine persönliche Rendite/);
 await btc.locator('.position-history-chart .chart-plot').focus();
 await page.keyboard.press('Home');
 assert.match(await btc.locator('.chart-tooltip').innerText(),/70.000/);
 await btc.locator('[data-position-range="7"]').click();
 assert.equal(await btc.locator('[data-position-range="7"]').getAttribute('aria-pressed'),'true');
 await btc.locator('.position-history-chart .chart-plot').waitFor();
 await btc.locator('summary').click();
 assert.equal(await btc.getAttribute('open'),null);
 await btc.locator('summary').click();
 await btc.locator('.position-history-chart .chart-plot').waitFor();
 // A redraw triggered by switching to another tab should retain expansion.
 await page.locator('#mobileNav [data-page="history"]').click();
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 assert.equal(await page.locator('[data-position-id="btc-test"]').getAttribute('open'),'');
 const etf=page.locator('#providerOverview [data-position-id="etf-test"]');
 await etf.locator('summary').focus();await page.keyboard.press('Enter');
 assert.equal(await etf.getAttribute('open'),'');
 await etf.locator('.position-history-unavailable').waitFor();
 assert.match(await etf.innerText(),/Keine bestätigte Kursquelle/);
 const cash=page.locator('#providerOverview [data-position-id="cash-test"]');
 await cash.locator('summary').click();
 assert.match(await cash.locator('.position-history-unavailable').innerText(),/keinen Börsenkurs/);
 const snap=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(snap.snapshots.at(-1).byPosition['btc-test'],'35000');
 assert.equal(snap.snapshots.at(-1).byPosition['cash-test'],'500');
 assert.ok(calls>0);
 for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   const r=await page.evaluate(()=>{
    const outer=document.documentElement.scrollWidth,w=innerWidth;
    const p=[...document.querySelectorAll('#providerOverview [data-position-id][open] .provider-position-detail')].map(el=>{
     const b=el.getBoundingClientRect(),card=el.closest('.panel').getBoundingClientRect();
     return {left:b.left,right:b.right,cardLeft:card.left,cardRight:card.right};
    });
    return {outer,w,p};
   });
   assert.ok(r.outer<=width+1,'horizontal overflow '+width+': '+JSON.stringify(r));
   assert.ok(r.p.every(v=>v.left>=v.cardLeft-1&&v.right<=v.cardRight+1),'drilldown escapes card '+width+': '+JSON.stringify(r));
 }
 console.log('POSITION DRILLDOWN: real price chart, keyboard, periods, empty market, safe snapshot, responsive 320–1440px PASS');
}finally{await browser.close();}
