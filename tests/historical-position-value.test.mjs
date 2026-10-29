import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {projectHistoricalPosition,historicalQuantityRows,historicalProviderCapability} from '../src/historical-position-value.js';
import {parseHistoricalPriceCSV} from '../src/historical-csv.js';
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));m.positions.push(createPosition({id:'etf',providerId:'provider',name:'Synthetic ETF',kind:'etf',currency:'EUR',quantity:'0',price:'100'},m));for(const [date,type,quantity,unitPrice] of [['2023-01-02','buy','2','100'],['2023-01-04','buy','3','110'],['2023-01-06','sell','1','120']])executeTransaction(m,{positionId:'etf',date,type,quantity,unitPrice,feeEUR:'0',taxEUR:'0'});return m;}
const prices={currency:'EUR',source:'synthetic raw EOD',priceType:'close',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:105},{date:'2023-01-04',total:110},{date:'2023-01-05',total:115},{date:'2023-01-06',total:120}]};
test('EOD historical quantity, never current quantity times old price; zero mutation',()=>{const m=fixture(),before=JSON.stringify(m),result=projectHistoricalPosition(m,'etf',{marketHistory:prices});assert.deepEqual(result.rows.map(r=>r.quantityExact),['2','2','5','5','4']);assert.deepEqual(result.rows.map(r=>r.valueEURExact),['200','210','550','575','480']);assert.equal(JSON.stringify(m),before);});
test('unknown opening, unjournalled booking, missing historical FX or incompatible series stays unknown',()=>{
 const m=fixture();m.openingPositions[0].quantityExact='1';m.positions[0].quantityExact='5';m.positions[0].quantity=5;assert.ok(projectHistoricalPosition(m,'etf',{marketHistory:prices}).rows.every(r=>r.valueEURExact===null));
 const n=fixture();n.bookings.push({id:'gap',date:'2023-01-03',positionId:'etf',type:'buy'});assert.ok(historicalQuantityRows(n,'etf',['2023-01-06']).every(r=>r.quantityExact===null));
 const f=fixture();f.positions[0].currency='USD';const usd={...prices,currency:'USD'};assert.ok(projectHistoricalPosition(f,'etf',{marketHistory:usd}).rows.every(r=>r.valueEURExact===null));
 const converted=projectHistoricalPosition(f,'etf',{marketHistory:usd,fxPoints:prices.points.map(p=>({date:p.date,currency:'USD',rate:'0.9',source:'Frankfurter'}))});assert.equal(converted.rows[0].valueEURExact,'180');
 assert.throws(()=>projectHistoricalPosition(f,'etf',{marketHistory:prices}));assert.throws(()=>projectHistoricalPosition(f,'etf',{marketHistory:{...usd,priceType:'adjusted_close'}}));
});
test('known zero before first evidenced purchase is not invented; absent and long price intervals split',()=>{const m=fixture();const r=projectHistoricalPosition(m,'etf',{marketHistory:prices,dates:['2023-01-01','2023-01-02','2023-01-03','2023-01-04','2023-01-05','2023-01-06']});assert.equal(r.rows[0].valueEURExact,null);assert.equal(r.segments.length,1);const g=projectHistoricalPosition(m,'etf',{marketHistory:{...prices,points:[prices.points[0],{date:'2023-02-01',total:200}]}});assert.equal(g.segments.length,2);});
test('corrected quantities and multiple transactions in a day respect journal sequence',()=>{const m=fixture();assert.equal(projectHistoricalPosition(m,'etf',{marketHistory:prices}).rows.at(-1).quantityExact,'4');executeTransaction(m,{type:'correction',positionId:'etf',date:'2023-01-06',targetQuantity:'7'});const r=projectHistoricalPosition(m,'etf',{marketHistory:prices});assert.equal(r.rows.at(-1).quantityExact,'7');assert.equal(r.rows.at(-1).valueEURExact,'840');});
test('canonical historical days retain strict calendar checks after reuse and cache pressure',()=>{
 const m=fixture(),before=JSON.stringify(m),expected=projectHistoricalPosition(m,'etf',{marketHistory:prices});
 const invalid=['1900-02-29','2023-02-29','2024-02-30','2024-00-10','2024-13-01','2024-01-00','2024-01-32','2024-2-01','2024-01-01T00:00:00Z',' 2024-01-01',null,undefined,20240101];
 for(let pass=0;pass<2;pass++){
  for(const date of invalid)assert.throws(()=>historicalQuantityRows(m,'etf',[date]),/Ungültiger Bewertungstag/);
  assert.equal(historicalQuantityRows(m,'etf',['2000-02-29'])[0].coverage,'unknown');
  assert.equal(historicalQuantityRows(m,'etf',['2024-02-29'])[0].quantityExact,'4');
 }
 const dates=Array.from({length:16410},(_,i)=>new Date(Date.UTC(1970,0,1+i)).toISOString().slice(0,10));
 assert.equal(historicalQuantityRows(m,'etf',dates).length,dates.length);
 assert.deepEqual(projectHistoricalPosition(m,'etf',{marketHistory:prices}),expected);
 for(const date of invalid)assert.throws(()=>historicalQuantityRows(m,'etf',[date]),/Ungültiger Bewertungstag/);
 assert.equal(JSON.stringify(m),before);
});
test('a reused valid day never approves invalid prices, FX or source evidence',()=>{
 const m=fixture();projectHistoricalPosition(m,'etf',{marketHistory:prices});const before=JSON.stringify(m);
 for(const total of [0,-1])assert.throws(()=>projectHistoricalPosition(m,'etf',{marketHistory:{...prices,points:[{date:'2023-01-02',total}]}}),/Historischer Kurs ungültig/);
 assert.equal(JSON.stringify(m),before);
 const usd=structuredClone(m);usd.positions[0].currency='USD';const history={...prices,currency:'USD'},fx=prices.points.map(p=>({date:p.date,currency:'USD',source:'Frankfurter',rate:'0.9'}));
 assert.equal(projectHistoricalPosition(usd,'etf',{marketHistory:history,fxPoints:fx}).rows[0].valueEURExact,'180');const usdBefore=JSON.stringify(usd);
 for(const change of [{rate:'0'},{rate:'-1'},{source:'unverified'}])assert.throws(()=>projectHistoricalPosition(usd,'etf',{marketHistory:history,fxPoints:fx.map((p,i)=>i===0?{...p,...change}:p)}),/Historischer FX-Nachweis ungültig/);
 assert.equal(JSON.stringify(usd),usdBefore);
});
test('close wins over adjusted_close; adjusted-only CSV is rejected',()=>{const p=fixture().positions[0],h=parseHistoricalPriceCSV('Date,Close,Adjusted Close\n2023-01-02,100,70\n2023-01-03,110,80',p);assert.deepEqual(h.points.map(p=>p.total),[100,110]);assert.throws(()=>parseHistoricalPriceCSV('Date,Adjusted Close\n2023-01-02,70\n2023-01-03,80',p),/Bereinigte/);});
test('unproven provider entitlement, quota, license, browser transport and historical range are not capabilities',()=>{const baseline={provider:'eodhd',currency:'EUR',listingConfirmed:true,browserTransport:true,licenseState:'confirmed',quotaStatus:'available',symbolAllowed:true,rangeDays:1826,availableDays:365};assert.equal(historicalProviderCapability(baseline).canFetchRange,false);assert.equal(historicalProviderCapability({...baseline,availableDays:2000}).canFetchRange,true);assert.equal(historicalProviderCapability({...baseline,licenseState:'unknown'}).canFetchSymbol,false);assert.equal(historicalProviderCapability({...baseline,provider:'cmc',availableDays:2000}).canFetchSymbol,false);});
