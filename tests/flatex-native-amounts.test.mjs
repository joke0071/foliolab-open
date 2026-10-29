import test from 'node:test';
import assert from 'node:assert/strict';
import {auditNativeFlatexSettlementAmounts as audit,auditFlatexSettlementAmounts as legacy} from '../src/flatex-settlement-audit.js';
import {parseFlatexNativeCSV as parse} from '../src/flatex-native.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const D=(changes=[{}])=>parse(csv('depot',changes.map(c=>({5:'2',9:'3,25',...c}))));
const C=(changes=[{}])=>parse(csv('account',changes.map(c=>({6:'-6,5',...c}))));
const entry=(d=D(),c=C())=>audit([d,c]).entries[0];
const order=(type='Kauf',ref='0009007199254740993')=>'ABR ORDER '+type+' IE00SYNTH001 '+ref;
const amounts=e=>[e.grossExact,e.cashExact,e.differenceExact,e.currency];
const noAmounts=e=>{assert.equal(e.status,'review');assert.deepEqual(amounts(e),[null,null,null,null]);};

test('native documents expose the legacy input gap and exact native comparison without a fake portfolio',()=>{
 const docs=[D(),C()],before=JSON.stringify(docs);
 assert.deepEqual(legacy(docs,{accounts:[{id:'s',type:'securities'}]},'s').entries,[]);
 const r=audit(docs),e=r.entries[0];assert.equal(e.status,'gross-equal');assert.deepEqual(amounts(e),['6.5','-6.5','0','EUR']);
 assert.equal(e.groupStatus,'possible-single');assert.equal(e.orderReference,'0009007199254740993');assert.notEqual(e.depot[0].bankReference,e.cash[0].bankReference);
 assert.equal(JSON.stringify(docs),before);assert.equal(r.ready,false);assert.equal(r.writeEnabled,false);assert.equal(r.costsVerified,false);assert.equal('commit' in r,false);
 assert.match(e.reasons.join(' '),/Buchungswirkung bleiben ungeprüft/);assert.doesNotMatch(JSON.stringify(r),/feeEUR|taxEUR|positionId|cashPosition/);
});
test('buy residuals of either sign stay unexplained rather than being inferred as charges',()=>{
 for(const [raw,diff]of [['-6,75','-0.25'],['-6,25','0.25']]){const e=entry(D(),C([{6:raw}]));assert.equal(e.status,'unexplained-difference');assert.equal(e.differenceExact,diff);assert.match(e.reasons.join(' '),/keine automatische Gebühren/);}
});
test('signed sale sources compare a positive proceeds amount using magnitude only for documentary gross',()=>{
 for(const [raw,diff]of [['6,5','0'],['6,25','-0.25'],['6,75','0.25']]){
  const e=entry(D([{5:'-2',7:order('Verkauf')}]),C([{4:order('Verkauf'),6:raw}]));
  assert.deepEqual(amounts(e),['6.5',raw.replace(',','.'),diff,'EUR']);assert.equal(e.status,diff==='0'?'gross-equal':'unexplained-difference');
 }
 noAmounts(entry(D([{5:'-2'}])));noAmounts(entry(D([{5:'2',7:order('Verkauf')}]),C([{4:order('Verkauf'),6:'6,5'}])));
});
test('native product precision never turns a rounded 18-place product into equal evidence',()=>{
 for(const rate of ['0,1','0,9']){const e=entry(D([{5:'0,000000000000000001',9:rate}]),C([{6:'-0,000000000000000001'}]));noAmounts(e);assert.match(e.reasons.join(' '),/keine gerundete Gleichheit/);}
 const exact=entry(D([{5:'0,000000000000000001',9:'1'}]),C([{6:'-0,000000000000000001'}]));assert.deepEqual(amounts(exact),['0.000000000000000001','-0.000000000000000001','0','EUR']);
 const old=legacy({sourceTrades:[{type:'buy',date:'1999-01-02',reference:'SYN',isin:'IE00SYNTH001',quantity:'0.000000000000000001',unitPrice:'0.9'}],cashItems:[{kind:'settlement',date:'1999-01-02',reference:'SYN',details:order(),amount:'-0.000000000000000001'}]},
  {accounts:[{id:'s',type:'securities'}],positions:[{accountId:'s',isin:'IE00SYNTH001',currency:'EUR'}]},'s',{accountAmountsEUR:true});
 assert.equal(old.entries[0].status,'gross-equal');assert.equal(old.entries[0].grossExact,'0.000000000000000001','legacy fixed-point rounding remains unchanged');
});
test('large and fractional decimal products remain exact without Number arithmetic',()=>{
 const e=entry(D([{5:'9007199254740993,125',9:'2'}]),C([{6:'-18014398509481986,25'}]));assert.equal(e.status,'gross-equal');assert.equal(e.grossExact,'18014398509481986.25');
 const f=entry(D([{5:'0,000000003',9:'0,000000007'}]),C([{6:'-0,000000000000000021'}]));assert.equal(f.status,'gross-equal');assert.equal(f.grossExact,'0.000000000000000021');
});
test('declared identical foreign currencies can be compared but never converted or defaulted to EUR',()=>{
 assert.deepEqual(amounts(entry(D([{10:'CHF'}]),C([{7:'CHF'}]))),['6.5','-6.5','0','CHF']);
 for(const currency of ['','-','CHF'])noAmounts(entry(D(),C([{7:currency}])));
});
test('only explicit Stk. and clean native source evidence permit numerical comparison',()=>{
 for(const unit of ['%','STK','Stück',''])noAmounts(entry(D([{6:unit}])));
 // The existing order helper can still see this group, but identity review must block it.
 const issue=entry(D([{4:'x'.repeat(301)}]));assert.equal(issue.groupStatus,'possible-single');noAmounts(issue);assert.match(issue.reasons.join(' '),/Quellevidenz ungeklärt/);
});
test('missing sides, multiple legs/executions, overlap, conflicting evidence and scope never produce partial amounts',()=>{
 const cases=[[D()],[C()],[D(),C([{5:'SYN-A'},{5:'SYN-B'}])],[D([{8:'SYN-A'},{8:'SYN-B'}]),C()],
  [D(),D([{0:'999'}]),C()],[D(),D([{1:'03.01.1999'}]),C()],
  [D(),C([{5:'SYN-A'},{5:'SYN-B',9:'SYN-SECOND'}])],
  [D(),C(),C([{4:'Storno '+order(),5:'SYN-CANCEL'}])]];
 for(const docs of cases){const r=audit(docs);assert.equal(r.rows.length,docs.reduce((n,d)=>n+d.rows.length,0));r.entries.forEach(noAmounts);}
});
test('source direction, missing IDs, invalid dates/prices and bounded horizon stay blocked',()=>{
 for(const d of [D([{5:'0'}]),D([{9:'0'}]),D([{8:'-'}]),D([{1:'29.02.1900'}]),D([{7:'Thesaurierung'}])])audit([d,C()]).entries.forEach(noAmounts);
 for(const c of [C([{6:'0'}]),C([{6:'6,5'}]),C([{5:''}]),C([{1:'20.01.1999'}])])noAmounts(entry(D(),c));
 noAmounts(audit([D(),C([{0:'03.01.1999'}])],{maxDays:0}).entries[0]);
});
test('non-order sources remain unassigned and separate context groups do not borrow amounts',()=>{
 const d=D([{7:'Lagerstellenwechsel',8:'SYN-CUSTODY'},{7:order()},{7:order('Kauf','9002'),8:'SYN-SECOND',11:'SYN-OTHER'}]);
 const r=audit([d,C()]);assert.equal(r.rows.length,4);assert.equal(r.unassigned.length,1);assert.equal(r.entries.length,2);assert.equal(r.entries[0].status,'gross-equal');noAmounts(r.entries[1]);
});
test('document reordering preserves arithmetic and deeply frozen outputs retain every source locator',()=>{
 const docs=[D(),C()],before=JSON.stringify(docs),a=audit(docs),b=audit([...docs].reverse());assert.deepEqual(amounts(a.entries[0]),amounts(b.entries[0]));assert.equal(JSON.stringify(docs),before);
 const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};frozen(a);assert.throws(()=>{a.entries[0].grossExact='0';},TypeError);
});
test('native validation and row limits remain fail closed without relaxing legacy behavior',()=>{
 for(const docs of [null,[],Array(21).fill(D()),[{...D()}]])assert.throws(()=>audit(docs));
 for(const maxDays of [-1,31,NaN,0.5])assert.throws(()=>audit([D(),C()],{maxDays}));
 const big=D(Array.from({length:5000},(_,i)=>({8:'SYN-'+i,7:order('Kauf',String(i))})));assert.equal(audit([big]).rows.length,5000);assert.throws(()=>audit([big,C()]));
});
