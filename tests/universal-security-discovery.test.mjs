import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';globalThis.crypto??=webcrypto;
import {discoverSecurityListings,queryProviderListings,normalizeListing,rankListings,listingCompatibility,mergeConfirmedListing} from '../src/security-discovery.js';
import {blankModel,createProvider,createAccount,createPosition,snapshot,backup,safeImport,totalExactEUR} from '../src/model.js';
const mockOK=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
const EOD=[
 {Code:'SPYY',Exchange:'XETRA',Name:'SPDR MSCI World UCITS ETF',Type:'ETF',Currency:'EUR',ISIN:'IE00BFY0GT14'},
 {Code:'SPYY',Exchange:'LSE',Name:'SPDR MSCI World UCITS ETF',Type:'ETF',Currency:'GBP',ISIN:'IE00BFY0GT14'}
];
test('EODHD supports arbitrary ETFs by ISIN with distinct listing currencies and venue-specific ticker',async()=>{
 const url=[];
 const mock=async x=>{url.push(new URL(x));return mockOK(EOD);};
 const out=await queryProviderListings('eodhd','IE00BFY0GT14',{eodhdKey:'test-key'},mock);
 assert.equal(out.length,2);
 assert.equal(out[0].symbol,'SPYY');assert.equal(out[0].isin,'IE00BFY0GT14');
 assert.equal(out[0].currency,'EUR');assert.equal(out[0].mic,'XETR');
 assert.equal(out[0].eodhdSymbol,'SPYY.XETRA');assert.equal(out[0].tradingViewSymbol,undefined,'catalog should not generate active legacy widget identifiers');
 assert.equal(out[1].currency,'GBP');assert.equal(out[1].tradingViewSymbol,undefined);
 assert.match(url[0].pathname,/\/api\/search\/IE00BFY0GT14/);
 assert.equal(url[0].searchParams.get('api_token'),'test-key');
});
test('FMP uses ISIN, name and ticker endpoints; missing currency results cannot become price listings',async()=>{
 const seen=[];
 const fetcher=async url=>{seen.push(url);return mockOK([{symbol:'GLBL.DE',name:'Another Global ETF',currency:'EUR',exchange:'XETRA'}]);};
 const key={fmpKey:'demo'};
 const byIsin=await queryProviderListings('fmp','IE00TEST1234',key,fetcher);
 await queryProviderListings('fmp','global ETF',key,fetcher);
 await queryProviderListings('fmp','GLBL',key,fetcher);
 assert.match(seen[0],/search-isin\?isin=/);assert.match(seen[1],/search-name\?query=/);
 assert.match(seen[2],/search-symbol\?query=/);
 assert.equal(byIsin[0].symbol,'GLBL');
 assert.equal(byIsin[0].fmpSymbol,'GLBL.DE');
 assert.equal(byIsin[0].tradingViewSymbol,undefined);
 assert.equal(normalizeListing({symbol:'GLBL',name:'Unknown',exchange:'XETRA'},'fmp'),null);
});
test('Twelve Data supports general instrument name/ticker with explicit MIC and currency',async()=>{
 const mock=async()=>mockOK({data:[{symbol:'CSPX',instrument_name:'iShares S&P 500 ETF',exchange:'London Stock Exchange',mic_code:'XLON',currency:'USD',instrument_type:'ETF'}]});
 const found=await queryProviderListings('twelve','CSPX',{twelveKey:'demo'},mock);
 assert.equal(found.length,1);assert.equal(found[0].mic,'XLON');
 assert.equal(found[0].currency,'USD');assert.equal(found[0].isin,'');
});
test('Provider priority falls back on API errors or missing results without guessing source',async()=>{
 const calls=[];
 const mock=async url=>{
  calls.push(url);
  if(url.includes('eodhd'))return {ok:false,status:403,headers:{get:()=>null},json:async()=>({})};
  if(url.includes('financialmodelingprep'))return mockOK(EOD.map(x=>({symbol:x.Code,name:x.Name,exchange:x.Exchange,currency:x.Currency,isin:x.ISIN})));
  return mockOK({data:[]});
 };
 const result=await discoverSecurityListings('SPYY',{eodhdKey:'bad',fmpKey:'good',twelveKey:'ok'},mock);
 assert.equal(result.provider,'fmp');
 assert.equal(result.results[0].symbol,'SPYY');
 assert.ok(result.failures.some(x=>x.startsWith('eodhd:')));
 assert.equal(calls.length,2);
 await assert.rejects(()=>discoverSecurityListings('ETF',{},mock),/API-Schlüssel/);
});
test('Same symbol with different ISIN or currency cannot overwrite an existing holding',()=>{
 const c={...normalizeListing(EOD[0],'eodhd')},existing={isin:'IE00ANOTHER01',currency:'EUR',price:100,quantityExact:'250'};
 assert.equal(listingCompatibility(c,existing).ok,false);
 assert.throws(()=>mergeConfirmedListing(existing,c),/ISIN/);
 const other={...c,isin:existing.isin,currency:'USD'};
 assert.equal(listingCompatibility(other,existing).ok,false);
 const unverified={...c,isin:''};
 const check=listingCompatibility(unverified,existing);
 assert.equal(check.ok,true);assert.equal(check.identityConfirmed,false);
 assert.match(check.warning,/ISIN/);
});
test('A confirmed listing updates ONLY identity metadata; backup and exact holdings remain stable',()=>{
 const model=blankModel(),provider=createProvider({name:'Testbank'});model.providers.push(provider);
 const account=createAccount({providerId:provider.id,name:'Depot',type:'securities'},model);model.accounts.push(account);
 const p=createPosition({kind:'etf',symbol:'OLD',name:'SPDR MSCI World UCITS ETF',
   currency:'EUR',quantity:'123.456789',price:100,providerId:provider.id,accountId:account.id},model);
 model.positions.push(p);snapshot(model);
 const amount=totalExactEUR(model),snap=JSON.stringify(model.snapshots);
 const legacy={...p,tradingViewSymbol:'XETR:OLD'};
 const result=mergeConfirmedListing(legacy,normalizeListing(EOD[0],'eodhd'));
 assert.equal(result.tradingViewSymbol,'XETR:OLD','legacy-only field must not be silently overwritten by a listing update');
 assert.equal(result.quantityExact,p.quantityExact);
 assert.equal(result.priceExact,p.priceExact);
 assert.equal(result.isin,'IE00BFY0GT14');
 assert.equal(result.eodhdSymbol,'SPYY.XETRA');
 assert.equal(totalExactEUR({...model,positions:[result]}),amount);
 assert.equal(JSON.stringify(model.snapshots),snap);
 model.positions[0]=createPosition(result,model);
 const next=safeImport(JSON.parse(backup(model)));
 assert.equal(next.positions[0].mic,'XETR');
 assert.equal(next.positions[0].isin,'IE00BFY0GT14');
 assert.equal(next.positions[0].quantityExact,'123.456789');
});
test('Result ordering prioritizes confirmed ISIN over popularity and unrelated ticker',()=>{
 const out=rankListings([
 {symbol:'SAME',isin:'US0000000001',currency:'USD',name:'Other',mic:'XNAS'},
 {symbol:'SPYY',isin:'IE00BFY0GT14',currency:'EUR',name:'SPDR',mic:'XETR'}
 ],'SAME',{isin:'IE00BFY0GT14',currency:'EUR'});
 assert.equal(out[0].isin,'IE00BFY0GT14');
});
