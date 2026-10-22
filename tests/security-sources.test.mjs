import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';globalThis.crypto??=webcrypto;
import {fetchSecurityQuote,fetchSecurityHistory,marketSourceOptions,tradingViewIdentifier} from '../src/security-sources.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
const today=new Date().toISOString().slice(0,10);
const yday=new Date(Date.now()-86400000).toISOString().slice(0,10);
const older=new Date(Date.now()-2*86400000).toISOString().slice(0,10);
const ok=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
function position(extra={}){return {kind:'etf',name:'Vanguard FTSE All-World',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR',...extra};}
test('Free TradingView chart is tied to explicit exchange and never guesses a missing MIC',()=>{
 assert.equal(tradingViewIdentifier(position()),'XETR:VWCE');
 assert.equal(tradingViewIdentifier(position({mic:'',exchange:''})),null);
 assert.equal(tradingViewIdentifier(position({mic:'',exchange:'',tradingViewSymbol:'XETR:VWCE'})),'XETR:VWCE');
 assert.equal(tradingViewIdentifier(position({tradingViewSymbol:'NYSE:VWRL'})),null);
 assert.equal(tradingViewIdentifier(position({tradingViewSymbol:'javascript:alert(1)'})),null);
});
test('Provider auto-priority chooses configured EODHD then explicit FMP then Twelve Data',()=>{
 const p=position({fmpSymbol:'VWCE.DE'});
 assert.deepEqual(marketSourceOptions(p,{eodhdKey:'a',fmpKey:'b',twelveKey:'c'}),['eodhd','fmp','twelve']);
 assert.deepEqual(marketSourceOptions(p,{securitySource:'fmp',eodhdKey:'a',fmpKey:'b',twelveKey:'c'}),['fmp']);
 assert.deepEqual(marketSourceOptions(p,{securitySource:'fmp',eodhdKey:'a',twelveKey:'c'}),[]);
 assert.throws(()=>marketSourceOptions(position({exchange:'',mic:''}),{eodhdKey:'a'}),/Handelsplatz/);
});
test('EODHD exact XETRA EOD close is used with true bar date, not speculative live label',async()=>{
 const p=position(),calls=[];
 const mock=async url=>{const u=new URL(url);calls.push(u);return ok([{date:older,close:100},{date:yday,close:103.22}]);};
 const quote=await fetchSecurityQuote(p,{eodhdKey:'local-test'},mock);
 assert.deepEqual({price:quote.price,asOf:quote.asOf,source:quote.source,quality:quote.quality},
  {price:103.22,asOf:yday,source:'EODHD · Tagesschluss',quality:'configured-listing'});
 assert.match(calls[0].pathname,/VWCE.XETRA/);assert.equal(calls[0].searchParams.get('fmt'),'json');
 const history=await fetchSecurityHistory(p,{eodhdKey:'local-test'},30,mock);
 assert.equal(history.points.length,2);assert.equal(history.points.at(-1).total,103.22);
});
test('EODHD rejects outdated or empty prices and falls back without changing a holding',async()=>{
 const p=position();
 const mock=async url=>{
  if(url.includes('eodhd.com'))return ok([{date:'2021-01-01',close:1.2}]);
  return ok({symbol:'VWCE',exchange:'Xetra',currency:'EUR',close:105,datetime:today});
 };
 const q=await fetchSecurityQuote(p,{eodhdKey:'a',twelveKey:'b'},mock);
 assert.equal(q.price,105);assert.equal(q.source,'Twelve Data');
 await assert.rejects(()=>fetchSecurityQuote(p,{eodhdKey:'a',securitySource:'eodhd'},mock),/nicht aktuell genug/);
});
test('FMP validated explicitly mapped ticker and actual exchange, rejects identity mismatch',async()=>{
 const p=position({fmpSymbol:'VWCE.DE'}),settings={fmpKey:'local-test',securitySource:'fmp'};
 const good=()=>ok([{symbol:'VWCE.DE',exchange:'XETRA',price:108.5,timestamp:Math.floor(Date.now()/1000)}]);
 const result=await fetchSecurityQuote(p,settings,good);
 assert.equal(result.price,108.5);assert.equal(result.quality,'configured-listing');
 for(const wrong of [{symbol:'OTHER.DE'},{exchange:'NYSE'},{currency:'USD'},{price:0},{timestamp:Date.parse('2020-01-01')/1000}]){
  await assert.rejects(()=>fetchSecurityQuote(p,settings,async()=>ok([{...(await good().json())[0],...wrong}])));
 }
 await assert.rejects(()=>fetchSecurityQuote(position(),settings,good),/konfiguriert/);
});
test('FMP historical endpoint uses stable slash path and validates symbol, dates, currency',async()=>{
 const p=position({fmpSymbol:'VWCE.DE'});
 const mock=async url=>{assert.match(url,/historical-price-eod\/full/);return ok([{symbol:'VWCE.DE',date:yday,close:102},{symbol:'VWCE.DE',date:older,close:101}]);};
 const chart=await fetchSecurityHistory(p,{fmpKey:'k'},30,mock);
 assert.deepEqual(chart.points.map(x=>x.total),[101,102]);
 await assert.rejects(()=>fetchSecurityHistory(p,{fmpKey:'k'},30,async()=>ok([{symbol:'OTHER.DE',date:yday,close:102},{symbol:'OTHER.DE',date:older,close:103}])),/Symbol|abrufbar/);
});
test('FMP and EODHD provider identifiers survive backups, secret API keys never exported',()=>{
 const m=blankModel(),provider=createProvider({name:'Broker'});m.providers.push(provider);
 const account=createAccount({name:'Depot',providerId:provider.id},m);m.accounts.push(account);
 const p=createPosition({...position(),providerId:provider.id,accountId:account.id,quantity:'3',price:'100',eodhdSymbol:'VWCE.XETRA',fmpSymbol:'VWCE.DE',tradingViewSymbol:'XETR:VWCE'},m);
 m.positions.push(p);m.settings.fmpKey='SECRET';m.settings.eodhdKey='SECRET2';
 const raw=backup(m);assert.ok(!raw.includes('SECRET'));
 const decoded=safeImport(JSON.parse(raw));
 assert.equal(decoded.positions[0].eodhdSymbol,'VWCE.XETRA');
 assert.equal(decoded.positions[0].fmpSymbol,'VWCE.DE');
 assert.equal(decoded.positions[0].tradingViewSymbol,'XETR:VWCE');
});
