import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFundCatalogCSV,saveFundCatalog,loadFundCatalog,searchFundCatalog,loadTopCrypto,loadAllCrypto,cryptoChoices} from '../src/instrument-catalog.js';
test('OeKB-like CSV with BOM, German header, semicolon, quotes and aliases is importable',()=>{
 const csv='\uFEFFISIN;Fondsbezeichnung;Kommentar\r\nIE00BK5BQT80;"Vanguard FTSE All-World UCITS ETF";"Test; Test"\r\nIE00BL25JL35;"Xtrackers MSCI World Quality UCITS ETF";ok\r\nAT0000000000;Testfonds;ok\r\nIE00BK5BQT80;Duplikat;ok\r\n';
 const c=parseFundCatalogCSV(csv,{filename:'Liste_KESt-Meldefonds.csv'});
 assert.equal(c.entries.length,3);
 assert.equal(c.skipped.duplicate,1);
 assert.equal(c.entries.find(x=>x.isin==='IE00BK5BQT80').kind,'etf');
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.equal(saveFundCatalog(c,storage),3);
 assert.equal(loadFundCatalog(storage).entries.length,3);
 const hits=searchFundCatalog('vanguard','etf',c);
 assert.equal(hits.total,1);assert.equal(hits.results[0].currency,'');
 assert.equal(searchFundCatalog('testfonds','fund',c).total,1);
});
test('Rejects spreadsheets, unknown columns, malformed quotes and empty/untrusted tables',()=>{
 assert.throws(()=>parseFundCatalogCSV('Not a valid file'),/CSV|gültige/);
 assert.throws(()=>parseFundCatalogCSV('Ticker;Fonds\nAAA;Some fund name'),/ISIN/);
 assert.throws(()=>parseFundCatalogCSV('ISIN;Fondsbezeichnung\nIE00BK5BQT80;"unfinished quote'),/Anführungszeichen/);
});
test('Top100 CoinGecko metadata, rate-efficient request and unique Coin IDs',async()=>{
 const rows=Array.from({length:100},(_,i)=>({id:'coin-'+i,symbol:'C'+i,name:'Coin '+i,market_cap_rank:i+1}));
 let count=0,lastURL='';
 const mock=async url=>{count++;lastURL=url;return {ok:true,status:200,headers:{get:()=>null},json:async()=>rows}};
 const leaders=await loadTopCrypto({fetcher:mock,now:1770000000000});
 assert.equal(leaders.length,100);assert.equal(new URL(lastURL).searchParams.get('per_page'),'100');
 assert.equal(new URL(lastURL).searchParams.get('order'),'market_cap_desc');
 await loadTopCrypto({fetcher:mock,now:1770000001000});
 assert.equal(count,1);
 const all=await loadAllCrypto({fetcher:async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>[{id:'remote-token-unique',symbol:'ZZZ',name:'Additional asset'}]})});
 assert.equal(all[0].id,'remote-token-unique');
 assert.equal(cryptoChoices('ZZZ').some(x=>x.id==='remote-token-unique'),true);
 assert.equal(cryptoChoices('COIN ',{leaders,all,limit:100}).length,100);
});
