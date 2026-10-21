import test from 'node:test';import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';globalThis.crypto??=webcrypto;
import {deriveBitcoinAddress,scanBitcoinAccount} from '../src/bitcoin-hd.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {readTrustLines,readTrustLineBalance} from '../src/xrpl-assets.js';
import {economicSummary,validateEconomicPosition} from '../src/defi.js';
import {blankModel,createProvider,createAccount,createPosition,totalEUR,backup,safeImport} from '../src/model.js';
const ZPUB='zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';
const addr='rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn';
function fixture(){
 const m=blankModel(),p=createProvider({name:'Broker'});m.providers.push(p);
 const d=createAccount({providerId:p.id,name:'Depot',type:'securities'},m),c=createAccount({providerId:p.id,name:'Verrechnung',type:'checking'},m);m.accounts.push(d,c);
 const etf=createPosition({providerId:p.id,accountId:d.id,name:'Global ETF',symbol:'VWCE',isin:'IE00BK5BQT80',quantity:0,price:100,kind:'etf'},m);
 const cash=createPosition({providerId:p.id,accountId:c.id,name:'Cash',quantity:3000,price:1,kind:'cash'},m);
 m.positions.push(etf,cash);return {m,etf,cash};
}
test('RFC4180-style CSV, quoted fields, BOM, semicolon and European decimal',()=>{
 const csv=parseCSV('\uFEFFDatum;Typ;ISIN;Menge;Kurs;Gebühr;Notiz\r\n2026-10-21;Kauf;IE00BK5BQT80;10;100;5;"ETF; mit Ausschüttung"\r\n');
 assert.equal(csv.rows.length,1);assert.equal(csv.rows[0].Notiz,'ETF; mit Ausschüttung');
 assert.equal(inferMapping(csv.headers).quantity,'Menge');
 assert.equal(inferMapping(csv.headers).feeEUR,'Gebühr');
});
test('CSV previews and commits balanced journal only after confirmation; reimport dedupes',()=>{
 const {m,etf,cash}=fixture(),original=JSON.stringify(m);
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs;Gebühr\n2026-10-21;Kauf;IE00BK5BQT80;10;100;5');
 const options={defaultPositionId:etf.id,cashPositionId:cash.id};
 const p=previewCSV(m,csv,inferMapping(csv.headers),options);
 assert.equal(p.ready,1);assert.equal(p.issues.length,0);assert.equal(JSON.stringify(m),original);
 const result=importCSV(m,p);assert.equal(result.imported,1);
 assert.equal(totalEUR(m),2995);assert.equal(cash.quantity,3000,'external old references are not mutated by atomic import');
 assert.equal(m.positions.find(x=>x.id===cash.id).quantityExact,'1995');
 assert.equal(m.bookings[0].importFingerprint!=null,true);
 const again=previewCSV(m,csv,inferMapping(csv.headers),options);
 assert.equal(again.duplicates,1);assert.equal(again.ready,0);
 assert.equal(importCSV(m,again).imported,0);
 assert.equal(safeImport(JSON.parse(backup(m))).bookings[0].importFingerprint,m.bookings[0].importFingerprint);
});
test('CSV invalid input does not partly modify portfolio',()=>{
 const {m,etf,cash}=fixture();
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-21;Kauf;IE00BK5BQT80;1;100\n2026-10-21;Kauf;IE00BK5BQT80;100;100');
 const preview=previewCSV(m,csv,inferMapping(csv.headers),{defaultPositionId:etf.id,cashPositionId:cash.id});
 assert.equal(preview.ready,1);assert.equal(preview.issues.length,1);
 const old=JSON.stringify(m);assert.throws(()=>importCSV(m,preview),/fehlerhafte/);assert.equal(JSON.stringify(m),old);
});
test('CSV duplicate column identifiers and malformed quoted rows are rejected',()=>{
 assert.throws(()=>parseCSV('Datum;Datum\n1;2'),/doppelte/);
 assert.throws(()=>parseCSV('a;b\n"hi;unterminated'),/Anführungszeichen/);
});
test('BIP84 official vector: first receive, second receive and change chain',async()=>{
 assert.equal(await deriveBitcoinAddress(ZPUB,0,0),'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
 assert.equal(await deriveBitcoinAddress(ZPUB,0,1),'bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g');
 assert.equal(await deriveBitcoinAddress(ZPUB,1,0),'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el');
});
test('Extended private keys and corrupted account xpub are rejected',async()=>{
 await assert.rejects(()=>deriveBitcoinAddress('xprvExamplePrivateKey',0,0),/Private/);
 await assert.rejects(()=>deriveBitcoinAddress(ZPUB.slice(0,-1)+'A',0,0),/Prüfsumme|Format/);
 await assert.rejects(()=>deriveBitcoinAddress(ZPUB,2,0),/Index/);
});
test('BIP44 watch-only gap scan checks both branches and does not invent balances',async()=>{
 let queries=0;const mock=async url=>{
  queries++;assert.ok(url.includes('blockstream.info/api/address/'));
  return {ok:true,status:200,headers:{get:()=>null},json:async()=>({chain_stats:{funded_txo_count:0,funded_txo_sum:0,spent_txo_sum:0},mempool_stats:{funded_txo_count:0,funded_txo_sum:0,spent_txo_sum:0}})};
 };
 const result=await scanBitcoinAccount(ZPUB,{fetcher:mock,gapLimit:2,maxAddressesPerBranch:3});
 assert.equal(result.complete,true);assert.equal(result.quantityExact,'0');assert.equal(queries,4);
});
test('Failed Bitcoin address read never becomes a verified empty wallet',async()=>{
 await assert.rejects(()=>scanBitcoinAccount(ZPUB,{fetcher:async()=>({ok:false,status:403,headers:{get:()=>null}}),gapLimit:1,maxAddressesPerBranch:1}),/Abruf|HTTP/);
});
test('Trust-lines paginate and preserve identical symbols from different issuers',async()=>{
 const second='r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';let queries=0;
 const mock=async(url,opts)=>{const d=JSON.parse(opts.body);assert.equal(d.method,'account_lines');queries++;
  return {ok:true,status:200,headers:{get:()=>null},json:async()=>({result:queries===1?{validated:true,ledger_index:999,marker:'next',lines:[{account:addr,currency:'USD',balance:'2.5'}]}:{validated:true,ledger_index:999,lines:[{account:second,currency:'USD',balance:'3.75'}]}})};
 };
 const result=await readTrustLines(addr,mock);
 assert.equal(result.length,2);assert.notEqual(result[0].contract,result[1].contract);
 assert.equal(result[0].quantityExact,'2.5');assert.equal(result[1].quantityExact,'3.75');
 assert.equal(queries,2);
});
test('Unverified XRPL reads and marker loops cannot silently claim completeness',async()=>{
 const fail=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({result:{validated:false,lines:[]}})});
 await assert.rejects(()=>readTrustLines(addr,fail),/validiert/);
 const partial=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({result:{validated:true,ledger_index:999,marker:'next',lines:[]}})});
 await assert.rejects(()=>readTrustLines(addr,partial,{maxPages:1}),/Scanlimit/);
});
test('Economic links explicitly exclude representation and count liabilities once',()=>{
 const {m,etf}=fixture();
 const linked=createPosition({providerId:etf.providerId,accountId:etf.accountId,name:'Staking Token',kind:'crypto',quantity:1,price:300,
  economicRole:'liquid-staking',valuationMode:'excluded',representedByPositionId:etf.id},m);
 validateEconomicPosition(linked,{positions:[...m.positions,linked]});
 m.positions.push(linked);assert.equal(totalEUR(m),3000);
 assert.equal(economicSummary(m).excluded,1);
 assert.equal(safeImport(JSON.parse(backup(m))).positions.find(p=>p.id===linked.id).valuationMode,'excluded');
});
test('Cycles and unlinked excluded DeFi assets are rejected',()=>{
 const {m,etf}=fixture();etf.valuationMode='excluded';etf.representedByPositionId='';
 assert.throws(()=>validateEconomicPosition(etf,m),/Referenz/);
});

test('CSV rejects malformed quote placement instead of silently changing data',()=>{
 assert.throws(()=>parseCSV('a;b\nfoo"bar;2'),/Anführungszeichen/);
 assert.throws(()=>parseCSV('a;b\n"quoted"suffix;2'),/Anführungszeichen/);
 assert.throws(()=>parseCSV('a;b\n"quoted" "again";2'),/Anführungszeichen/);
});
test('CSV preserves escaped quotes, embedded line breaks and trailing empty fields',()=>{
 const csv=parseCSV('a;b;c\r\n"Line 1\nLine 2";"say ""hello""";\r\n');
 assert.equal(csv.rows.length,1);
 assert.equal(csv.rows[0].a,'Line 1\nLine 2');
 assert.equal(csv.rows[0].b,'say "hello"');
 assert.equal(csv.rows[0].c,'');
});

test('CSV preview rejects stale portfolio modifications',()=>{
 const {m,etf,cash}=fixture();
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-21;Kauf;IE00BK5BQT80;1;100');
 const preview=previewCSV(m,csv,inferMapping(csv.headers),{defaultPositionId:etf.id,cashPositionId:cash.id});
 m.positions.find(p=>p.id===cash.id).price=2;
 assert.throws(()=>importCSV(m,preview),/seit der CSV-Vorschau/);
 assert.equal(m.bookings.length,0);
});

test('XRP trust-line pagination rejects inconsistent or unverified ledger pages',async()=>{
 let count=0;
 const mock=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({result:++count===1?{validated:true,ledger_index:999,marker:'next',lines:[]}:{validated:true,ledger_index:1000,lines:[]}})});
 await assert.rejects(()=>readTrustLines(addr,mock),/Ledger wechselte/);
 const unproven=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({result:{ledger_index:999,lines:[]}})});
 await assert.rejects(()=>readTrustLines(addr,unproven),/nicht nachweislich validiert/);
});

const B58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function decode58(value){
 let n=0n;for(const c of value)n=n*58n+BigInt(B58.indexOf(c));
 const raw=Buffer.alloc(82);for(let i=81;i>=0;i--){raw[i]=Number(n&255n);n>>=8n;}return raw;
}
function encode58(raw){
 let n=BigInt('0x'+raw.toString('hex')),encoded='';
 while(n){encoded=B58[Number(n%58n)]+encoded;n/=58n;}return encoded;
}
function checksumKey(input,version,publicX){
 const raw=decode58(input);raw.set(version,0);
 if(publicX!==undefined){raw[45]=2;let x=publicX;for(let i=77;i>=46;i--){raw[i]=Number(x&255n);x>>=8n;}}
 const h=x=>createHash('sha256').update(x).digest();
 h(h(raw.subarray(0,78))).copy(raw,78,0,4);
 return encode58(raw);
}
test('All supported extended public key versions derive legacy, nested and native SegWit addresses',async()=>{
 const xpub=checksumKey(ZPUB,[0x04,0x88,0xb2,0x1e]);
 const ypub=checksumKey(ZPUB,[0x04,0x9d,0x7c,0xb2]);
 assert.match(await deriveBitcoinAddress(xpub,0,0),/^1[1-9A-HJ-NP-Za-km-z]+$/);
 assert.match(await deriveBitcoinAddress(ypub,0,0),/^3[1-9A-HJ-NP-Za-km-z]+$/);
 assert.equal(await deriveBitcoinAddress(ZPUB,0,0),'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
});
test('A checksummed extended key with out-of-range secp256k1 X coordinate is rejected',async()=>{
 const prime=(1n<<256n)-(1n<<32n)-977n;
 const key=checksumKey(ZPUB,[0x04,0xb2,0x47,0x46],prime+1n);
 await assert.rejects(()=>deriveBitcoinAddress(key),/Kurvenfeld/);
});

test('Two identical broker CSV rows are distinct if both occur in one file, but repeat imports dedupe',()=>{
 const {m,etf,cash}=fixture();
 const file='Datum;Typ;ISIN;Menge;Kurs\n2026-10-21;Kauf;IE00BK5BQT80;1;100\n2026-10-21;Kauf;IE00BK5BQT80;1;100';
 const csv=parseCSV(file),mapping=inferMapping(csv.headers),options={defaultPositionId:etf.id,cashPositionId:cash.id};
 const first=previewCSV(m,csv,mapping,options);
 assert.equal(first.ready,2);assert.equal(first.duplicates,0);
 importCSV(m,first);assert.equal(m.bookings.length,2);
 const repeated=previewCSV(m,csv,mapping,options);
 assert.equal(repeated.ready,0);assert.equal(repeated.duplicates,2);
});
