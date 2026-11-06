import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {parseFlatexNativeCSV} from '../../src/flatex-native.js';
import {inspectNativeFlatexOrderLinks} from '../../src/flatex-settlements.js';
import {inspectFlatexNetPairs} from '../../src/flatex-net-settlement.js';
import {nativeFlatexCSV} from '../../tests/flatex-native-fixture.mjs';
const D=(rows,currency='EUR')=>parseFlatexNativeCSV(nativeFlatexCSV('depot',rows.map((r,i)=>({5:String(i+1),8:'SYN-NM-EXEC-'+i,9:'10',10:currency,...r}))));
const C=(rows,currency='EUR')=>parseFlatexNativeCSV(nativeFlatexCSV('account',rows.map((r,i)=>({5:'SYN-NM-CASH-'+i,6:String(-(i+1)*10-1),7:currency,...r}))));
const one=D([{}]),two=D([{},{}]),cash=C([{}]),cashTwo=C([{},{}]);
const cases=[
 ['single EUR', [one,cash], 'possible-single',1,2],
 ['one execution two cash legs',[one,cashTwo],'multiple-cash-review',0,3],
 ['two executions one cash leg',[two,cash],'multiple-depot-review',0,3],
 ['two executions two cash legs',[two,cashTwo],'multiple-depot-review',0,4],
 ['equal distinct executions and cash legs',[D([{}, {5:'1'}]),C([{}, {6:'-11'}])],'multiple-depot-review',0,4],
 ['same-currency USD N:M',[D([{},{}],'USD'),C([{},{}],'USD')],'multiple-depot-review',0,4],
 ['mixed USD executions EUR cash',[D([{},{}],'USD'),cashTwo],'source-review',0,4],
 ['identical repeated export is not a second execution',[one,one,cash],'overlap-review',1,3],
 ['same bank identity changed payload',[one,D([{5:'2'}]),cash],'conflict',0,3],
];
const results=[];
for(const [name,docs,status,pairCount,rowCount]of cases){
 const orders=[docs,[...docs].reverse()];
 for(const [order,documents]of orders.entries()){
  const before=JSON.stringify(documents),links=inspectNativeFlatexOrderLinks(documents),net=inspectFlatexNetPairs(documents);
  assert.deepEqual(links.groups.map(x=>x.status),[status],name);
  assert.equal(links.rows.length,rowCount,name+' all source occurrences retained');
  assert.equal(net.pairs.length,pairCount,name+' no guessed allocation');
  assert.equal(JSON.stringify(documents),before,name+' read-only');
  if(pairCount===0)assert.ok(net.reviewCount>0,name+' visible unresolved group');
  results.push({name,order,status,sourceOccurrences:links.rows.length,netPairs:net.pairs.length,reviewCount:net.reviewCount,inputUnchanged:true});
 }
}
const q=1n+2n,gross=q*10n,cashSum=-11n-21n,difference=cashSum+gross;
assert.equal(q,3n);assert.equal(gross,30n);assert.equal(cashSum,-32n);assert.equal(difference,-2n);
const report={result:'PASS',main:'cef91b3a8b2baa0c9598178a4fa486877283df45',scope:'Read-only boundary diagnostic, not N:M import implementation, production UI or private-original N:M evidence',cases:results.length,results,independentIntegerControl:{quantity:String(q),grossEUR:String(gross),documentaryCashEUR:String(cashSum),unallocatedDifferenceEUR:String(difference),classification:'Unallocated difference, never inferred fee/tax/FX or per-fill cost basis'},conclusion:'Current order grouping retains distinct fills but intentionally blocks N:M net pairs. Repeated exact export is deduplicated only by retained source identity/payload. Same-currency USD and documentary mixed-currency N:M remain unsupported. Existing FIN-E2E generic USD partial-fill/FX PASS does not imply native Flatex N:M support.'};
writeFileSync(new URL('./uh05-nm-diagnostic.json',import.meta.url),JSON.stringify(report,null,2));
console.log('UH05 N:M boundary: '+results.length+' cases PASS; no product changes or persistence');
