import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV} from '../src/csv-import.js';
import {parseKrakenLedgerCSV,looksLikeKrakenLedgerCSV,KRAKEN_LEDGER_HEADERS} from '../src/kraken-ledger.js';
import {krakenLedgerMarkup} from '../src/kraken-ledger-ui.js';
import {krakenCSV,krakenHeaders} from './kraken-ledger-fixture.mjs';
test('confirmed native schema reuses CSV parser, BOM/quotes and explicit exact source values',()=>{
 const d=parseKrakenLedgerCSV('\uFEFF'+krakenCSV([{wallet:'Synthetic, wallet',amount:'9007199254740993.000000000000000001',balance:'-0.000000000000000001'}]));
 assert.deepEqual(KRAKEN_LEDGER_HEADERS,krakenHeaders);assert.equal(looksLikeKrakenLedgerCSV(parseCSV(krakenCSV())),true);
 assert.equal(d.rows[0].values.wallet,'Synthetic, wallet');assert.equal(d.rows[0].numbers.amount,'9007199254740993.000000000000000001');assert.equal(d.rows[0].numbers.balance,'-0.000000000000000001');
 assert.equal(d.writeEnabled,false);assert.equal(d.ready,false);assert.equal(d.rows[0].values.time,'1999-01-02 12:00:00');
 assert.deepEqual(parseKrakenLedgerCSV(krakenCSV([{}],[...krakenHeaders].reverse())).rows[0],parseKrakenLedgerCSV(krakenCSV()).rows[0]);
});
test('recognizable partial ledgers quarantine native fields before generic EUR-fee mapping',()=>{
 assert.equal(looksLikeKrakenLedgerCSV({headers:['txid','refid','feecurrency']}),true);assert.equal(looksLikeKrakenLedgerCSV({headers:['date','type','quantity','fee']}),false);
 for(const headers of [krakenHeaders.slice(1),[...krakenHeaders,'future'],krakenHeaders.map(h=>h==='wallet'?'future':h),krakenHeaders.map(h=>h==='wallet'?'asset':h)])assert.throws(()=>parseKrakenLedgerCSV(krakenCSV([{}],headers)));
 assert.throws(()=>parseKrakenLedgerCSV('x'.repeat(2000001)));assert.throws(()=>parseKrakenLedgerCSV(null));
});
test('unknown or invalid rows remain visible with precise issues, never become zero values',()=>{
 const d=parseKrakenLedgerCSV(krakenCSV([{txid:'',refid:'',time:'1999-02-30 12:00:00',type:'__proto__',subtype:'future',amount:'',fee:'1e-3',balance:'0.0000000000000000001',feecurrency:''},{type:'trade',subtype:'reward',fee:'-1'},{type:'earn',subtype:'autoallocation'}]));
 assert.equal(d.rows.length,3);assert.equal(d.rows[0].numbers.amount,null);assert.equal(d.rows[0].numbers.fee,null);assert.equal(d.rows[0].numbers.balance,null);assert.match(d.rows[0].issues.join(' '),/Zeitpunkt|Ledger-Typ|Ledger-Subtyp/);assert.equal(typeof d.rows[0].meaning,'string');
 assert.match(d.rows[1].issues.join(' '),/Kombination/);assert.match(d.rows[1].issues.join(' '),/Negatives/);assert.equal(d.rows[2].values.subtype,'autoallocation');
});
test('calendar and clock checks preserve raw time without local-zone conversion',()=>{
 for(const time of ['2000-02-29 23:59:59','1999-01-02 00:00:00'])assert.doesNotMatch(parseKrakenLedgerCSV(krakenCSV([{time}])).rows[0].issues.join(' '),/Zeitpunkt/);
 for(const time of ['1900-02-29 00:00:00','1999-01-02 24:00:00','1999-13-01 00:00:00','1999-01-02T00:00:00Z','1999-01-02 00:00:60','not a time'])assert.match(parseKrakenLedgerCSV(krakenCSV([{time}])).rows[0].issues.join(' '),/Zeitpunkt/);
});
test('refid grouping retains every leg, while missing references never merge unrelated rows',()=>{
 const d=parseKrakenLedgerCSV(krakenCSV([{},{asset:'EUR',amount:'-500',feecurrency:'EUR'},{asset:'FEE',amount:'0',fee:'1',feecurrency:'FEE'},{refid:''},{refid:''}]));
 assert.deepEqual(d.groups.map(g=>g.lines),[[2,3,4],[5],[6]]);assert.equal(d.rows.length,5);assert.equal(d.rows[2].numbers.fee,'1');assert.equal(d.rows[2].values.feecurrency,'FEE');assert.equal('total' in d,false);
});
test('duplicate and conflicting txids flag all originals without dropping or netting rows',()=>{
 const d=parseKrakenLedgerCSV(krakenCSV([{txid:'SAME'},{txid:'SAME'},{txid:'CONFLICT'},{txid:'CONFLICT',fee:'2'}]));
 assert.equal(d.rows.length,4);assert.ok(d.rows.slice(0,2).every(r=>r.issues.some(i=>i.includes('Identische txid'))));assert.ok(d.rows.slice(2).every(r=>r.issues.some(i=>i.includes('Widersprüchliche txid'))));
});
test('fee currency and USD observations remain documentary without asset/EUR/price inference',()=>{
 const row=parseKrakenLedgerCSV(krakenCSV([{asset:'XXBT',feecurrency:'USD',fee:'2.5',amountusd:'',feeusd:'',balanceusd:''}])).rows[0];
 assert.equal(row.values.asset,'XXBT');assert.equal(row.values.feecurrency,'USD');assert.equal(row.numbers.fee,'2.5');assert.equal(row.numbers.amountusd,null);assert.equal('feeEUR' in row,false);assert.equal('unitPrice' in row,false);
});
test('preview output is deeply immutable and cannot mutate original text or manufacture write APIs',()=>{
 const csv=krakenCSV(),d=parseKrakenLedgerCSV(csv);assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.rows)&&Object.isFrozen(d.rows[0])&&Object.isFrozen(d.rows[0].values)&&Object.isFrozen(d.rows[0].numbers)&&Object.isFrozen(d.rows[0].issues)&&Object.isFrozen(d.groups[0].lines));
 assert.throws(()=>{d.rows[0].values.fee='0';},TypeError);assert.equal(csv,krakenCSV());assert.equal(d.writeEnabled,false);assert.equal(d.ready,false);
});
test('all declared event types remain observations, with unsupported subtype combinations visible',()=>{
 const types=['trade','deposit','withdrawal','transfer','spend','receive','earn','margin trade','future'];
 const d=parseKrakenLedgerCSV(krakenCSV(types.map(type=>({type,subtype:''}))));assert.deepEqual(d.rows.map(r=>r.values.type),types);assert.equal(d.rows.length,types.length);assert.ok(d.rows.slice(-2).every(r=>r.issues.some(i=>i.includes('Unbekannter Ledger-Typ'))));
});
test('existing disclosure markup escapes hostile source strings and bounds visible rows',()=>{
 const d=parseKrakenLedgerCSV(krakenCSV(Array.from({length:55},()=>({wallet:'<img src=x onerror=alert(1)>',refid:'<svg onload=alert(2)>'}))));
 const html=krakenLedgerMarkup(d);assert.doesNotMatch(html,/<img|<svg/);assert.match(html,/&lt;img/);assert.equal((html.match(/class="performance-details"/g)||[]).length,50);assert.match(html,/krakenShowMore/);assert.match(html,/USD-Zusatzwerte/);assert.doesNotMatch(krakenLedgerMarkup(d,{limit:100}),/krakenShowMore/);assert.throws(()=>krakenLedgerMarkup(d,{limit:0}));
});
