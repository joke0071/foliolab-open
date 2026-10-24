import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFlatexSettlementAmounts} from '../src/flatex-settlement-audit.js';

const isin='IE00BK5BQT80', eur={id:'p',accountId:'dep',isin,currency:'EUR'};
const base={accounts:[{id:'dep',type:'securities',providerId:'f'}],positions:[eur]};
const trade={reference:'K1',date:'2026-10-20',isin,type:'buy',quantity:'2',unitPrice:'100.25',externalId:'f-1'};
const cash={reference:'K1',date:'2026-10-22',account:'AT1000',amount:'-202',kind:'settlement',details:'ORDER Kauf IE00BK5BQT80'};
const prepared={sourceTrades:[trade],cashItems:[cash]};
test('unknown source currency blocks numeric comparison even if a trade looks EUR',()=>{
 const r=auditFlatexSettlementAmounts(prepared,base,'dep');
 assert.equal(r.entries.length,1);
 assert.equal(r.entries[0].status,'review');
 assert.equal(r.entries[0].differenceExact,null);
 assert.match(r.entries[0].message,/Währung der Kontoumsätze/);
});
test('exact fixed-point gross-to-net comparison labels only unexplained residual',()=>{
 const r=auditFlatexSettlementAmounts(prepared,base,'dep',{accountAmountsEUR:true});
 assert.equal(r.entries[0].status,'unexplained-difference');
 assert.equal(r.entries[0].grossExact,'200.5');
 assert.equal(r.entries[0].cashExact,'-202');
 assert.equal(r.entries[0].differenceExact,'-1.5');
 assert.equal(r.counts.unexplained,1);
 assert.equal(r.distinctAccountIdentifiers[0],'AT1000');
 assert.match(r.entries[0].message,/Differenz nicht aufteilbar/);
});
test('zero difference does not imply proven fees, tax or complete history',()=>{
 const p={sourceTrades:[trade],cashItems:[{...cash,amount:'-200.5'}]};
 const r=auditFlatexSettlementAmounts(p,base,'dep',{accountAmountsEUR:true});
 assert.equal(r.entries[0].status,'gross-equal');
 assert.equal(r.entries[0].differenceExact,'0');
 assert.match(r.note,/Keine automatische/);
});
test('foreign-currency position and missing account are refused, no false EUR assumption',()=>{
 const foreign={...base,positions:[{...eur,currency:'USD'}]};
 const r=auditFlatexSettlementAmounts(prepared,foreign,'dep',{accountAmountsEUR:true});
 assert.equal(r.entries[0].status,'review');
 assert.match(r.entries[0].message,/Handelswährung USD/);
 assert.throws(()=>auditFlatexSettlementAmounts(prepared,base,'else'),/Wertpapierdepot/);
});
test('multiple bank-account references remain visible and are never merged into cash ledgers',()=>{
 const mixed={sourceTrades:[trade,{...trade,reference:'K2',externalId:'f-2',date:'2026-10-23'}],
 cashItems:[cash,{...cash,reference:'K2',date:'2026-10-24',account:'AT2000'}]};
 const before=JSON.stringify(mixed),modelBefore=JSON.stringify(base);
 const r=auditFlatexSettlementAmounts(mixed,base,'dep',{accountAmountsEUR:true});
 assert.equal(r.entries.length,2);
 assert.deepEqual(r.distinctAccountIdentifiers,['AT1000','AT2000']);
 assert.equal(JSON.stringify(mixed),before);
 assert.equal(JSON.stringify(base),modelBefore);
});
