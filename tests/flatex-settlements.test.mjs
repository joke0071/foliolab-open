import test from 'node:test';
import assert from 'node:assert/strict';
import {pairFlatexSettlements} from '../src/flatex-settlements.js';

const trade={reference:'T-1',date:'2026-10-20',isin:'IE00BK5BQT80',type:'buy',quantity:'2',unitPrice:'100',externalId:'x'};
const cash={reference:'T-1',date:'2026-10-22',account:'AT00',amount:'-201',kind:'settlement',details:'ORDER Kauf IE00BK5BQT80'};
test('strict reference and ISIN can suggest one correspondence without journal changes',()=>{
 const input={sourceTrades:[trade],cashItems:[cash]};
 const original=JSON.stringify(input),result=pairFlatexSettlements(input);
 assert.equal(result.paired.length,1);
 assert.equal(result.paired[0].status,'possible');
 assert.equal(result.paired[0].evidence,'Referenz und ISIN');
 assert.equal(result.unmatchedCash.length,0);
 assert.equal(JSON.stringify(input),original);
});
test('wrong cash direction does not match a purchase',()=>{
 const result=pairFlatexSettlements({sourceTrades:[trade],cashItems:[{...cash,amount:'201'}]});
 assert.equal(result.paired.length,0);
 assert.equal(result.unmatched.length,1);
});
test('ambiguous one-to-many and many-to-one combinations never claim a pair',()=>{
 const twoCash=pairFlatexSettlements({sourceTrades:[trade],cashItems:[cash,{...cash,date:'2026-10-21'}]});
 assert.equal(twoCash.paired.length,0);
 assert.equal(twoCash.uncertain.length,1);
 const twoTrades=pairFlatexSettlements({sourceTrades:[trade,{...trade,externalId:'y'}],cashItems:[cash]});
 assert.equal(twoTrades.paired.length,0);
 assert.equal(twoTrades.uncertain.length,2);
});
test('unrelated settlements and non-settlement cash flows remain separate',()=>{
 const result=pairFlatexSettlements({sourceTrades:[trade],cashItems:[
  {...cash,reference:'OTHER',details:'ORDER Kauf ohne Wertpapier',date:'2026-09-01'},
  {kind:'dividend',amount:'20',date:'2026-10-20',details:'Dividendenzahlung'}
 ]});
 assert.equal(result.paired.length,0);
 assert.equal(result.otherCash.length,1);
 assert.equal(result.unmatchedCash.length,1);
});
test('ISIN can suggest a link without shared reference but cannot prove execution costs',()=>{
 const result=pairFlatexSettlements({sourceTrades:[trade],cashItems:[{...cash,reference:'other'}]});
 assert.equal(result.paired[0].evidence,'ISIN im Buchungstext');
 assert.equal(result.paired[0].accountMovement.amount,'-201');
});
