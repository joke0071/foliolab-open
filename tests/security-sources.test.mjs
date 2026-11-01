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

test('five year EODHD chart extends real upstream date boundaries without inventing observations',async()=>{
 const p=position(),calls=[];
 const mock=async (url,options)=>{calls.push(JSON.parse(options.body));return ok({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:older,close:102},{date:yday,close:105}]});};
 const result=await fetchSecurityHistory(p,{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'},1826,mock);
 assert.equal(result.points.length,2);
 assert.ok(Date.parse(calls[0].from)<Date.now()-1700*864e5);
 assert.equal(result.points[0].date,older);
});

test('Explicit provider mapping cannot override conflicting Xetra venue or curated ISIN',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('must not request');};
 for(const patch of [{exchange:'NYSE'},{exchange:'Frankfurt'},{mic:'XNYS'},{isin:'IE0000000000'}])
  await assert.rejects(()=>fetchSecurityQuote(position({fmpSymbol:'VWCE.DE',...patch}),{alphaVantageKey:'SYNTHETIC'},fetcher),/widerspr/);
 assert.equal(calls,0);
});
