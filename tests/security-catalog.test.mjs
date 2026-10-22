import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSecurityDirectory,searchSecurityDirectories,directoryAge,MAX_DIRECTORY_BYTES} from '../src/security-catalog.js';
test('Xetra reference format: preamble, header, MIC, instrument metadata and inactive filtering',()=>{
 const sample=['Market: XETR','Date Last Update: 22.10.2026',
  'Product Status;Instrument Status;Instrument;ISIN;Mnemonic;Currency;Instrument Type',
  'Active;Active;Vanguard FTSE All-World ETF;IE00BK5BQT80;VWCE;EUR;ETF',
  'Active;Active;Example Share AG;DE0001234567;TEST;EUR;Shares',
  'Active;Pending deletion;Bad ETF;IE0000000111;BAD;EUR;ETF'].join('\n');
 const parsed=parseSecurityDirectory(sample,{source:'auto',filename:'t7-xetr-allTradableInstruments.csv'});
 assert.equal(parsed.source,'xetra');assert.equal(parsed.entries.length,2);
 assert.equal(parsed.entries[0].isin,'IE00BK5BQT80');
 assert.equal(parsed.entries[0].currency,'EUR');
 assert.equal(parsed.entries[0].kind,'etf');
 assert.equal(parsed.entries[1].kind,'stock');
 assert.equal(parsed.entries[0].mic,'XETR');
 assert.equal(parsed.sourceAsOf,'2026-10-22');
 assert.equal(searchSecurityDirectories('VWCE','etf',[parsed]).total,1);
 assert.equal(searchSecurityDirectories('example share','stock',[parsed]).total,1);
});
test('Nasdaq pipe directory: ETF flags, test issue exclusion, tickers without fictitious ISIN or currency',()=>{
 const sample='Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares\n'+
  'AAPL|Apple Inc. Common Stock|Q|N|N|100|N|N\n'+
  'QQQM|Invesco Nasdaq 100 ETF|Q|N|N|100|Y|N\n'+
  'FAKE|Test Issuer|Q|Y|N|100|N|N\n'+
  'File Creation Time: 1022202619:00|||||||\n';
 const parsed=parseSecurityDirectory(sample,{filename:'nasdaqlisted.txt'});
 assert.equal(parsed.source,'nasdaq');assert.equal(parsed.entries.length,2);assert.equal(parsed.testIssues,1);
 assert.equal(parsed.entries[0].currency,'');assert.equal(parsed.entries[0].isin,'');
 assert.equal(parsed.entries[0].kind,'stock');assert.equal(parsed.entries[1].kind,'etf');
});
test('Other-listed directory retains explicit exchange-to-MIC map and separate listing identity',()=>{
 const raw='ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol\n'+
 'VOO|Vanguard S&P 500 ETF|P|VOO|Y|100|N|VOO\n'+
 'IBM|International Business Machines|N|IBM|N|100|N|IBM';
 const found=parseSecurityDirectory(raw);
 assert.equal(found.entries[0].mic,'ARCX');assert.equal(found.entries[1].mic,'XNYS');
 assert.equal(found.entries[0].kind,'etf');
});
test('Generic and ESMA CSV cannot fabricate fields or promote unverified IDs',()=>{
 const text='ISIN;FullNm;CFI Code;Currency\nIE00BK5BQT80;Global Index ETF;CEOGEU;EUR\nDE0000123456;Equity Corp;ESVUFR;USD';
 const c=parseSecurityDirectory(text,{source:'esma'});
 assert.equal(c.entries.length,2);assert.equal(c.entries[0].symbol,'');
 assert.equal(c.entries[0].exchange,'');assert.equal(c.entries[0].kind,'etf');
 assert.equal(c.entries[1].kind,'stock');
 assert.throws(()=>parseSecurityDirectory('random data;with delimiter\none;two'),/Kopfzeile|Name/);
 assert.throws(()=>parseSecurityDirectory('x'.repeat(MAX_DIRECTORY_BYTES+1)),/24 MB/);
});
test('Source timestamp triggers explicit refresh after 30d without network traffic',()=>{
 const catalog=parseSecurityDirectory('Symbol;Security Name;ETF\nTST;Test Security;N',{filename:'test.csv',importedAt:'2026-08-01T00:00:00Z'});
 assert.equal(directoryAge(catalog,Date.parse('2026-09-05T00:00:00Z')).stale,true);
 assert.equal(directoryAge(catalog,Date.parse('2026-08-03T00:00:00Z')).stale,false);
});
