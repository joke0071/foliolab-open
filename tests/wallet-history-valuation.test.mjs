import test from 'node:test';import assert from 'node:assert/strict';
import {valueHistoryRows,validateHistoryQuotes,loadHistoryQuotes,historyChartSeries} from '../src/wallet-history-valuation.js';
import {stream} from './wallet-history-fixtures.mjs';
const asset=stream(),row={...asset,date:'2026-10-23',quantityBaseUnits:'7000000000000000000000000',coverage:'verified'},quote={...asset,date:row.date,currency:'EUR',priceExact:'2.5',source:'CSV',binding:'user-confirmed-asset'};
test('WH07 exact 24-decimal quantity and dated EUR arithmetic; missing/partial never zero',()=>{
 assert.equal(valueHistoryRows([row],[quote])[0].eurExact,'17.5');
 for(const q of [[],[{...quote,date:'2026-10-22'}],[{...quote,contract:'wrong'}],[{...quote,priceExact:'0'}],[{...quote,currency:'USD'}]])assert.equal(valueHistoryRows([row],q)[0].eurExact,null);
 assert.equal(valueHistoryRows([{...row,coverage:'partial'}],[quote])[0].eurExact,null);assert.equal(valueHistoryRows([{...row,quantityBaseUnits:'0'}],[quote])[0].eurExact,'0');
});
test('WH07 contract/mint/currency/date conflicts rejected and no chart bridging gaps',()=>{
 assert.doesNotThrow(()=>validateHistoryQuotes([quote],[asset]));
 for(const patch of [{contract:'wrong'},{mint:'wrong'},{currency:'USD'},{date:'2026-02-30'},{priceExact:'0'}])assert.throws(()=>validateHistoryQuotes([{...quote,...patch}],[asset]));
 const rows=[{...row,eurExact:'17.5'},{...row,date:'2026-10-24',eurExact:'18'}];assert.equal(historyChartSeries(rows).length,2);assert.deepEqual(historyChartSeries([rows[0],{...rows[1],date:'2026-10-25'}]),[]);assert.deepEqual(historyChartSeries([rows[0],{...rows[1],eurExact:null}]),[]);
});
test('WH07 local CSV needs explicit asset binding; no token ticker guessing',async()=>{
 const p={id:'token',wallet:{chain:'erc20',chainId:1,contract:asset.contract}},session={streams:[asset]},model={priceHistories:{token:{currency:'EUR',source:'CSV',points:[{date:row.date,total:2.5}]}},settings:{}};
 await assert.rejects(loadHistoryQuotes(session,p,model));const q=await loadHistoryQuotes(session,p,model,{confirmLocal:true});assert.equal(q[0].contract,asset.contract);assert.equal(q[0].binding,'user-confirmed-asset');model.priceHistories.token.currency='USD';await assert.rejects(loadHistoryQuotes(session,p,model,{confirmLocal:true}));
});
