import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHistoricalPriceCSV,validateImportedPriceHistory,importedHistoryForPeriod} from '../src/historical-csv.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,totalExactEUR} from '../src/model.js';
const day=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10);
function fixture(){
 const m=blankModel(),provider=createProvider({name:'Test'});m.providers.push(provider);
 const account=createAccount({providerId:provider.id,name:'Depot'},m);m.accounts.push(account);
 const p=createPosition({name:'EM Value',kind:'etf',symbol:'5MVL',isin:'IE00BG0SKF03',currency:'EUR',quantity:'2',price:'86.19',providerId:provider.id,accountId:account.id},m);m.positions.push(p);
 return {m,p};
}
test('German CSV with semicolon, comma decimals, reversed rows and BOM imports exactly',()=>{
 const {m,p}=fixture();
 const input='\uFEFFDatum;Schlusskurs;Währung;ISIN\n'+
  day(1)+';86,20;EUR;IE00BG0SKF03\n'+day(5)+';85,12;EUR;IE00BG0SKF03\n';
 const result=parseHistoricalPriceCSV(input,p);
 assert.equal(result.points.length,2);
 assert.equal(result.points[0].total,85.12);
 assert.equal(result.points[1].total,86.20);
 m.priceHistories[p.id]=result;
 assert.equal(importedHistoryForPeriod(m,p,30).points.length,2);
 assert.equal(importedHistoryForPeriod(m,p,7).points.length,2);
});
test('US export with Date,Close and CSV quoted fields selects actual close, not adjusted close',()=>{
 const {p}=fixture();const input='Date,Open,High,Low,Close,Adj Close,Volume\n'+day(2)+',80,86,79,"85.1",86.2,100\n'+day(1)+',81,87,78,86.5,87,200';
 const result=parseHistoricalPriceCSV(input,p);
 assert.deepEqual(result.points.map(x=>x.total),[85.1,86.5]);
});
test('Historical CSV errors reject invalid identity currency dates conflicting duplicates and bad prices',()=>{
 const {p}=fixture();
 for(const text of [
 'Datum;Schlusskurs;Währung\n'+day(3)+';85,1;USD\n'+day(2)+';86,1;USD',
 'Datum;Schlusskurs;ISIN\n'+day(3)+';85,1;US0000000000\n'+day(2)+';86,1;US0000000000',
 'Datum;Schlusskurs;Ticker\n'+day(3)+';85,1;WRONG\n'+day(2)+';86,1;WRONG',
 'Datum;Schlusskurs\n'+day(3)+';85,1\n'+day(3)+';86,1',
 'Datum;Schlusskurs\n'+day(3)+';0\n'+day(2)+';86,1',
 'Datum;Schlusskurs\n'+day(3)+';-85\n'+day(2)+';86,1',
 'Datum;Schlusskurs\n2099-01-01;88\n'+day(2)+';86,1',
 'Datum;Schlusskurs\nnot-a-date;88\n'+day(2)+';86,1',
 'Preis;Wert\n100;200\n101;300',
 'Datum;Schlusskurs\n'+day(3)+';85\n'+day(2)+';garbage'
 ])assert.throws(()=>parseHistoricalPriceCSV(text,p));
});
test('CSV no identifier requires caller confirmation, but cannot silently change portfolio values',()=>{
 const {m,p}=fixture(),before=totalExactEUR(m);
 const history=parseHistoricalPriceCSV('Date,Close\n'+day(10)+',80\n'+day(1)+',82',p);
 m.priceHistories[p.id]=history;
 assert.equal(totalExactEUR(m),before);
 const imported=safeImport(JSON.parse(backup(m)));
 assert.equal(imported.priceHistories[p.id].points.length,2);
 assert.equal(totalExactEUR(imported),before);
});
test('Malicious and oversized histories cannot be imported from backup',()=>{
 const {m,p}=fixture();m.priceHistories[p.id]=parseHistoricalPriceCSV('Date,Close\n'+day(3)+',81\n'+day(1)+',82',p);
 const cases=[
  entry=>entry.points.push({date:day(1),total:99}),
  entry=>entry.points[0].total=-2,
  entry=>entry.points[1].date='2099-01-01',
  entry=>entry.currency='USD',
  entry=>entry.source='<script>'
 ];
 for(const edit of cases){
  const raw=JSON.parse(backup(m));edit(raw.priceHistories[p.id]);assert.throws(()=>safeImport(raw));
 }
 const raw=JSON.parse(backup(m));raw.priceHistories.invalid=raw.priceHistories[p.id];
 assert.throws(()=>safeImport(raw),/Positionsbezug/);
});
test('Local CSV selection does not fill nonexistent dates or extend beyond selected range',()=>{
 const {m,p}=fixture();
 m.priceHistories[p.id]=parseHistoricalPriceCSV('Date,Close\n'+day(35)+',80\n'+day(25)+',81\n'+day(1)+',82',p);
 assert.deepEqual(importedHistoryForPeriod(m,p,7).points.map(x=>x.total),[82]);
 assert.deepEqual(importedHistoryForPeriod(m,p,30).points.map(x=>x.total),[81,82]);
 assert.equal(importedHistoryForPeriod(m,p,90).points.length,3);
 assert.throws(()=>importedHistoryForPeriod(m,p,999),/Diagrammzeitraum/);
});
