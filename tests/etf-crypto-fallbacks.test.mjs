import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';globalThis.crypto??=webcrypto;
import {knownReferenceListing,enhanceKnownReferenceListing} from '../src/reference-listings.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,totalExactEUR} from '../src/model.js';
import {coinPaprikaMapping,coinPaprikaCurrentQuote,coinPaprikaHistoricalQuote,defiLlamaContractKey,defiLlamaCurrentQuote,cryptoFallbackQuote} from '../src/crypto-fallbacks.js';
import {fetchPositionMarketHistory} from '../src/position-history.js';
const day=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10);
const timestamp=n=>new Date(Date.now()-n*86400000).toISOString();
const ok=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
const coins={
 bitcoin:{kind:'crypto',coinId:'bitcoin',symbol:'BTC'},
 chainlink:{kind:'crypto',coinId:'chainlink',symbol:'LINK'},
 wrong:{kind:'crypto',coinId:'bitcoin',symbol:'BCH'}
};
function base(){
 const m=blankModel(),provider=createProvider({name:'Flatex'});m.providers.push(provider);
 const acc=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);m.accounts.push(acc);
 return {m,provider,acc};
}
test('Only precisely matched familiar ETF EUR listings enrich legacy imports without mutating values or historic snapshots',()=>{
 const {m,provider,acc}=base();
 for(const [symbol,name,isin] of [
  ['5MVL','iShares Edge MSCI EM Value','IE00BG0SKF03'],
  ['VWCE','Vanguard FTSE All-World','IE00BK5BQT80'],
  ['XDEM','Xtrackers MSCI World Momentum','IE00BL25JP72'],
  ['XDEQ','Xtrackers MSCI World Quality','IE00BL25JL35']
 ]){
  const p=createPosition({providerId:provider.id,accountId:acc.id,kind:'etf',name,symbol,quantity:'3.1415',price:99.91,currency:'EUR'},m);
  m.positions.push(p);
  assert.equal(knownReferenceListing(p)?.isin,isin);
 }
 m.snapshots.push({id:'snap',date:day(2),total:1234,totalEURExact:'1234',source:'manual',recordedAt:timestamp(2)});
 const before=totalExactEUR(m),restored=safeImport(JSON.parse(backup(m)));
 assert.equal(totalExactEUR(restored),before);
 assert.equal(restored.snapshots.length,1);
 assert.equal(restored.snapshots[0].totalEURExact,'1234');
 assert.equal(restored.snapshots[0].date,day(2));
 for(const p of restored.positions){
  assert.ok(/^IE00/.test(p.isin));
  assert.equal(p.mic,'XETR');
  assert.equal(p.exchange,'Xetra');
  assert.equal(p.tradingViewSymbol,'XETR:'+p.symbol);
  assert.equal(p.eodhdSymbol,p.symbol+'.XETRA');
 }
});
test('Ambiguous symbols or existing different venue/ISIN never silently reassign',()=>{
 const p={kind:'etf',symbol:'VWCE',name:'Vanguard FTSE All-World',currency:'EUR'};
 for(const changes of [{name:'Other fund'}, {currency:'USD'},{isin:'IE0000000000'},{mic:'XAMS'},{exchange:'Amsterdam'},{tradingViewSymbol:'XETR:OTHER'},{eodhdSymbol:'VWCE.F'}]){
  const orig={...p,...changes};
  assert.strictEqual(enhanceKnownReferenceListing(orig),orig);
 }
 assert.equal(knownReferenceListing({...p,isIn:'IE00BK5BQT80'})?.symbol,'VWCE');
});
test('CoinPaprika uses curated source identity, EUR currency, valid provider timestamp',async()=>{
 assert.deepEqual(coinPaprikaMapping(coins.bitcoin),{id:'btc-bitcoin',symbol:'BTC'});
 assert.equal(coinPaprikaMapping(coins.wrong),null);
 const called=[];
 const fetcher=async url=>{called.push(url);return ok({id:'btc-bitcoin',symbol:'BTC',last_updated:timestamp(0),quotes:{EUR:{price:60000},USD:{price:70000}}});};
 const q=await coinPaprikaCurrentQuote(coins.bitcoin,fetcher);
 assert.equal(q.price,60000);assert.equal(q.source,'CoinPaprika');
 assert.match(called[0],/quotes=EUR/);
 for(const data of [
  {id:'wrong',symbol:'BTC',last_updated:timestamp(0),quotes:{EUR:{price:9}}},
  {id:'btc-bitcoin',symbol:'BTC',last_updated:timestamp(12),quotes:{EUR:{price:9}}},
  {id:'btc-bitcoin',symbol:'BTC',last_updated:timestamp(0),quotes:{USD:{price:9}}},
  {id:'btc-bitcoin',symbol:'BTC',last_updated:timestamp(0),quotes:{EUR:{price:-1}}}
 ])await assert.rejects(()=>coinPaprikaCurrentQuote(coins.bitcoin,async()=>ok(data)));
});
test('CoinPaprika historical URL specifies EUR explicitly and rejects conflicting daily values',async()=>{
 const seen=[];
 const good=async url=>{
  seen.push(url);
  if(url.includes('frankfurter'))return ok({base:'USD',rates:{[day(3)]:{EUR:.9},[day(2)]:{EUR:.9},[day(1)]:{EUR:.9}}});
  return ok([{timestamp:timestamp(3),price:98},{timestamp:timestamp(2),price:100},{timestamp:timestamp(1),price:101}]);
 };
 const r=await coinPaprikaHistoricalQuote(coins.bitcoin,good);
 assert.equal(r.currency,'EUR');assert.match(r.source,/CoinPaprika/);
 assert.deepEqual(r.points.map(p=>Number(p.total.toFixed(2))),[88.2,90,90.9]);
 assert.ok(!seen[0].includes('quote=')&&seen[0].includes('interval=1d'));
 assert.ok(seen[1].includes('frankfurter')&&seen[1].includes('base=USD'));
 await assert.rejects(()=>coinPaprikaHistoricalQuote(coins.chainlink,async()=>ok([{timestamp:timestamp(2),price:2},{timestamp:timestamp(2),price:3}])),/widersprüchliche/);
});
test('Failed CoinGecko historical chart safely uses CoinPaprika EUR, not guessed token',async()=>{
 const calls=[];
 const mock=async url=>{
  calls.push(url);
  if(url.includes('coingecko'))return {ok:false,status:429,headers:{get:()=>null},json:async()=>({})};
  if(url.includes('frankfurter'))return ok({base:'USD',rates:{[day(4)]:{EUR:.9},[day(2)]:{EUR:.9},[day(1)]:{EUR:.9}}});
  return ok([{timestamp:timestamp(4),price:100},{timestamp:timestamp(2),price:103},{timestamp:timestamp(1),price:104}]);
 };
 const out=await fetchPositionMarketHistory(coins.bitcoin,{},30,mock);
 assert.match(out.source,/CoinPaprika/);assert.equal(out.points.length,3);
 assert.ok(calls.some(url=>url.includes('coinpaprika')));
 await assert.rejects(()=>fetchPositionMarketHistory(coins.wrong,{},30,async()=>({ok:false,status:429,headers:{get:()=>null},json:async()=>({})})),/CoinPaprika/);
});
test('DefiLlama fallback demands contract, supported chain, strong confidence, matching token, and dated USD/EUR reference',async()=>{
 const p={kind:'crypto',name:'Liquid staking',symbol:'STETH',economicRole:'liquid-staking',
  wallet:{enabled:true,chain:'erc20',chainId:1,contract:'0x'+'A'.repeat(40)}};
 const token='ethereum:0x'+'a'.repeat(40);
 assert.equal(defiLlamaContractKey(p),token);
 assert.equal(defiLlamaContractKey({...p,wallet:{...p.wallet,chainId:9999}}),null);
 assert.equal(defiLlamaContractKey({...p,wallet:null}),null);
 let calls=0;
 const mock=async url=>{calls++;
  if(url.includes('llama.fi'))return ok({coins:{[token]:{price:2500,timestamp:Math.floor(Date.now()/1000),symbol:'STETH',confidence:.98}}});
  if(url.includes('frankfurter.dev'))return ok({date:day(1),rates:{EUR:.9}});
  throw Error('Unexpected URL');
 };
 const price=await cryptoFallbackQuote(p,mock);
 assert.equal(price.price,2250);assert.match(price.source,/DefiLlama/);assert.equal(calls,2);
 await assert.rejects(()=>defiLlamaCurrentQuote(p,async url=>ok(url.includes('llama.fi')?{coins:{[token]:{price:100,timestamp:Math.floor(Date.now()/1000),confidence:.2,symbol:'STETH'}}}:{date:day(1),rates:{EUR:1}})),/Datenqualität/);
});
