import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';globalThis.crypto??=webcrypto;
import {fetchSecurityQuote,fetchSecurityHistory,marketSourceOptions,marketSourcePlan} from '../src/security-sources.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
const today=new Date().toISOString().slice(0,10);
const yday=new Date(Date.now()-86400000).toISOString().slice(0,10);
const older=new Date(Date.now()-2*86400000).toISOString().slice(0,10);
const ok=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
function position(extra={}){return {kind:'etf',name:'Vanguard FTSE All-World',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR',...extra};}
test('An external TradingView chart API is not exposed; quote sources remain strictly configured',async()=>{
 const sources=await import('../src/security-sources.js');
 assert.equal(Object.hasOwn(sources,'tradingViewIdentifier'),false);
 assert.deepEqual(marketSourceOptions(position(),{}),[]);
 assert.throws(()=>marketSourceOptions(position({mic:'',exchange:'',name:'unconfirmed',isin:''}),{eodhdKey:'SYNTHETIC'}),/Handelsplatz/);
});
test('Direct browser providers precede optional worker; direct EODHD keys never cause network requests',async()=>{
 const p=position({fmpSymbol:'VWCE.DE'});
 const worker={eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'};
 assert.deepEqual(marketSourceOptions(p,{eodhdKey:'a',fmpKey:'b',twelveKey:'c',...worker}),['fmp','twelve','eodhd']);
 assert.deepEqual(marketSourceOptions(p,{eodhdKey:'a',fmpKey:'b',twelveKey:'c'}),['fmp','twelve']);
 let calls=0;
 for(const source of ['auto','eodhd'])await assert.rejects(()=>fetchSecurityQuote(p,{eodhdKey:'PRIVATE',securitySource:source},()=>{calls++;throw Error('unexpected');}),/deaktiviert/);
 assert.equal(calls,0);
 assert.match(marketSourcePlan({...p,isin:'WRONG',fmpSymbol:''},{fmpKey:'b'})[0].reason,/FMP-Börsenticker fehlt/);
});
test('FMP validated explicitly mapped ticker and actual exchange, rejects identity mismatch',async()=>{
 const p=position({fmpSymbol:'VWCE.DE'}),settings={fmpKey:'local-test',securitySource:'fmp'};
 const good=()=>ok([{symbol:'VWCE.DE',exchange:'XETRA',price:108.5,timestamp:Math.floor(Date.now()/1000)}]);
 const result=await fetchSecurityQuote(p,settings,good);
 assert.equal(result.price,108.5);assert.equal(result.quality,'configured-listing');
 for(const wrong of [{symbol:'OTHER.DE'},{exchange:'NYSE'},{currency:'USD'},{price:0},{timestamp:Date.parse('2020-01-01')/1000}]){
  await assert.rejects(()=>fetchSecurityQuote(p,settings,async()=>ok([{...(await good().json())[0],...wrong}])));
 }
 await assert.rejects(()=>fetchSecurityQuote(position({name:'short',isin:'IE0000000000'}),settings,good),/FMP-Börsenticker fehlt/);
});
test('FMP historical endpoint uses stable slash path and validates symbol, dates, currency',async()=>{
 const p=position({fmpSymbol:'VWCE.DE'});
 const mock=async url=>{assert.match(url,/historical-price-eod\/non-split-adjusted/);return ok([{symbol:'VWCE.DE',date:yday,close:102},{symbol:'VWCE.DE',date:older,close:101}]);};
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

test('FMP failure safely falls back to direct Twelve Data; no key-bearing error reaches UI',async()=>{
 const secret='SYNTHETIC_SECRET_LOCAL_ONLY',calls=[];
 const quote=await fetchSecurityQuote(position(),{fmpKey:secret,twelveKey:secret,eodhdKey:secret},async url=>{
  calls.push(new URL(url).hostname);
  if(url.includes('financialmodelingprep'))throw new TypeError('Failed to fetch '+url);
  return ok({symbol:'VWCE',exchange:'XETR',mic_code:'XETR',currency:'EUR',close:105,datetime:today});
 });
 assert.equal(quote.price,105);assert.equal(quote.source,'Twelve Data');
 assert.deepEqual(calls,['financialmodelingprep.com','api.twelvedata.com']);
 await assert.rejects(()=>fetchSecurityQuote(position(),{fmpKey:secret},async url=>{throw Error('Failed to fetch '+url);}),error=>!error.message.includes(secret)&&/CORS/.test(error.message));
});
test('Optional authenticated EODHD worker is a safe first-class market source without local EODHD key',async()=>{
 const token='SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012';
 const settings={eodhdWorkerEndpoint:'https://my-worker.workers.dev',eodhdWorkerAccessToken:token,securitySource:'eodhd'};
 assert.deepEqual(marketSourceOptions(position(),settings),['eodhd']);
 const visited=[];
 const fetcher=async(url,options={})=>{
  visited.push({url,options});
  assert.equal(url,'https://my-worker.workers.dev/api/market/eodhd');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.authorization,'Bearer '+token);
  const request=JSON.parse(options.body);
  assert.equal(request.symbol,'VWCE.XETRA');
  assert.equal(request.api_token,undefined,'Worker requests must never include an EODHD token');
  return ok({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:older,close:101.25},{date:yday,close:102.75}]});
 };
 const quote=await fetchSecurityQuote(position(),settings,fetcher);
 assert.equal(quote.price,102.75);
 assert.equal(quote.asOf,yday);
 const chart=await fetchSecurityHistory(position(),settings,30,fetcher);
 assert.deepEqual(chart.points.map(p=>p.total),[101.25,102.75]);
 assert.match(chart.source,/eigener Worker/);
 assert.equal(visited.length,2);
});
test('Worker endpoint and access key must be an explicitly configured HTTPS pair',async()=>{
 const p=position();
 const onlyUrl={eodhdWorkerEndpoint:'https://my-worker.workers.dev'};
 assert.deepEqual(marketSourceOptions(p,onlyUrl),[]);
 const onlyToken={eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012'};
 assert.deepEqual(marketSourceOptions(p,onlyToken),[]);
 assert.match(marketSourcePlan(p,{eodhdWorkerEndpoint:'http://insecure.example',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012'})[0].reason,/HTTPS/);
 assert.match(marketSourcePlan(p,{eodhdWorkerEndpoint:'https://my-worker.workers.dev/path',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012'})[0].reason,/Basisadresse/);
 assert.match(marketSourcePlan(p,{eodhdWorkerEndpoint:'https://my-worker.workers.dev',eodhdWorkerAccessToken:'short'})[0].reason,/Zugriffsschlüssel/);
});
test('No worker secrets can escape an unencrypted portfolio backup',()=>{
 const m=blankModel();
 m.settings.eodhdWorkerEndpoint='https://my-worker.workers.dev';
 m.settings.eodhdWorkerAccessToken='SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012';
 assert.doesNotMatch(backup(m),/my-worker|SYNTHETIC_WORKER/);
});

test('five year Twelve Data requests explicit dates instead of truncated outputsize',async()=>{
 const p=position(),calls=[];
 const data={meta:{symbol:'VWCE',currency:'EUR',exchange:'Xetra',mic_code:'XETR'},
  values:[{datetime:older,close:'103'},{datetime:yday,close:'104'}]};
 const mock=async url=>{calls.push(new URL(url));return ok(data);};
 const result=await fetchSecurityHistory(p,{securitySource:'twelve',twelveKey:'test'},1826,mock);
 assert.equal(result.points.length,2);
 assert.equal(calls[0].searchParams.get('outputsize'),null);
 assert.match(calls[0].searchParams.get('start_date'),/^\d{4}-\d{2}-\d{2}$/);
 assert.ok(calls[0].searchParams.get('end_date'));
});
test('five year EODHD chart extends real upstream date boundaries without inventing observations',async()=>{
 const p=position(),calls=[];
 const mock=async (url,options)=>{calls.push(JSON.parse(options.body));return ok({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:older,close:102},{date:yday,close:105}]});};
 const result=await fetchSecurityHistory(p,{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'},1826,mock);
 assert.equal(result.points.length,2);
 assert.ok(Date.parse(calls[0].from)<Date.now()-1700*864e5);
 assert.equal(result.points[0].date,older);
});
