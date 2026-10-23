import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseEodhd,classifyMarketFailure} from '../src/market-diagnostics.js';
import {priceQuality,quoteQualitySummary} from '../src/quote-quality.js';
const p=(symbol,other={})=>({kind:'etf',name:symbol,symbol,quantity:1,price:100,currency:'EUR',mic:'XETR',exchange:'Xetra',eodhdSymbol:symbol+'.XETRA',...other});
const d=new Date(Date.now()-864e5).toISOString().slice(0,10);
const ok=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
test('EODHD diagnostics do not probe without credentials or positions',async()=>{
 let calls=0;const mock=()=>{calls++;throw Error('unexpected');};
 assert.equal((await diagnoseEodhd({},[p('VWCE')],mock)).rows.length,0);
 assert.equal((await diagnoseEodhd({eodhdKey:'mock'},[],mock)).rows.length,0);
 assert.equal(calls,0);
});
test('Diagnostic limits calls to four existing securities and never mutates them',async()=>{
 const holdings=['VWCE','5MVL','XDEM','XDEQ','NEXT'].map(p),before=JSON.stringify(holdings);
 let calls=0;
 const result=await diagnoseEodhd({eodhdKey:'TEST'},holdings,async()=>{calls++;return ok([{date:d,close:123.4}]);});
 assert.equal(calls,4);assert.equal(result.rows.length,4);
 assert.equal(result.rows.every(x=>x.status==='ok'),true);
 assert.equal(JSON.stringify(holdings),before);
});
test('Rate and auth failures stop global probes, never expose user keys',async()=>{
 for(const status of [401,403,429]){
  let calls=0;const key='DONT_LEAK_KEY';
  const result=await diagnoseEodhd({eodhdKey:key},['VWCE','5MVL','XDEM'].map(p),async()=>{
   calls++;return {ok:false,status,headers:{get:()=>null}};
  });
  assert.equal(calls,1);assert.equal(result.rows.filter(x=>x.status==='skipped').length,2);
  assert.equal(JSON.stringify(result).includes(key),false);
 }
 assert.equal(classifyMarketFailure(Error('Failed to fetch')).code,'network');
 assert.equal(classifyMarketFailure(Error('EODHD-Ticker ungültig')).code,'listing');
});
test('Quote evidence remains distinct from staleness and manual values',()=>{
 const now=Date.parse('2026-10-23T12:00:00Z');
 const base=p('VWCE',{quoteAsOf:'2026-10-22',quoteQuality:'configured-listing'});
 assert.equal(priceQuality(base,now).state,'confirmed');
 assert.equal(priceQuality({...base,quoteAsOf:'2022-03-04'},now).state,'stale');
 assert.equal(priceQuality({...base,quoteAsOf:null,quoteQuality:'provider-undated'},now).state,'undated');
 assert.equal(priceQuality({...base,priceStatus:'Preis aus gesichertem Stichtagswert abgeleitet'},now).state,'derived');
 assert.equal(priceQuality({...base,quoteQuality:null},now).state,'unverified');
 assert.equal(priceQuality({...base,priceExact:'0'},now).state,'missing');
 assert.equal(priceQuality({...base,kind:'cash'},now).state,'ignored');
 const x=quoteQualitySummary([base,{...base,quoteAsOf:'2022-03-04'}],now);
 assert.equal(x.total,2);assert.equal(x.counts.confirmed,1);assert.equal(x.counts.stale,1);
});
