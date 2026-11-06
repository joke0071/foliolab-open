/** Read-only v292 capability boundary. Entirely synthetic; no new import implementation. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {nativeFlatexCSV} from '../../tests/flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../../src/flatex-native.js';
import {inspectFlatexNetPairs} from '../../src/flatex-net-settlement.js';
import {inspectNativeFlatexOrderLinks} from '../../src/flatex-settlements.js';
const rows=(n,{sell=false,equal=false,currency='EUR'}={})=>Array.from({length:n},(_,i)=>({5:String((sell?-1:1)*(equal?1:i+1)),9:'10',8:'SYN-V292-FILL-'+i,10:currency,7:'ORDER '+(sell?'Verkauf':'Kauf')+' IE00SYNTH001 991'}));
const cash=(n,{sell=false,currency='EUR'}={})=>Array.from({length:n},(_,i)=>({5:'SYN-V292-CASH-'+i,6:String((sell?1:-1)*(i===0?63:5)),7:currency,4:'ORDER '+(sell?'Verkauf':'Kauf')+' IE00SYNTH001 991'}));
const specs=[
 {name:'three-buy-one-cash',n:3,m:1,expected:1},
 {name:'three-sell-one-cash',n:3,m:1,sell:true,expected:1},
 {name:'three-equal-distinct-bank-identities',n:3,m:1,equal:true,expected:1},
 {name:'four-buy-one-cash',n:4,m:1,expected:0},
 {name:'three-buy-two-cash',n:3,m:2,expected:0},
 {name:'two-buy-three-cash',n:2,m:3,expected:0},
 {name:'three-usd-one-eur-cash',n:3,m:1,currency:'USD',expected:0},
 {name:'three-buy-one-cash-exact-export-overlap',n:3,m:1,overlap:true,expected:1},
 {name:'three-buy-one-cash-conflicting-bank-payload',n:3,m:1,conflict:true,expected:0},
 {name:'one-buy-two-cash',n:1,m:2,expected:0},
 {name:'one-sell-two-cash',n:1,m:2,sell:true,expected:0},
 {name:'two-buy-two-cash',n:2,m:2,expected:0},
 {name:'three-usd-one-usd-cash',n:3,m:1,currency:'USD',cashCurrency:'USD',expected:0}
];
const results=[];
for(const spec of specs){
 const dr=rows(spec.n,spec),cr=cash(spec.m,{sell:spec.sell,currency:spec.cashCurrency||'EUR'});
 const docs=[parseFlatexNativeCSV(nativeFlatexCSV('depot',dr)),parseFlatexNativeCSV(nativeFlatexCSV('account',cr))];
 if(spec.overlap)docs.push(...docs);
 if(spec.conflict)docs.push(parseFlatexNativeCSV(nativeFlatexCSV('depot',[{...dr[0],9:'11'}])));
 let proofId=null;
 for(const reverse of [false,true]){
  const input=reverse?[...docs].reverse():docs,before=JSON.stringify(input),inspection=inspectFlatexNetPairs(input),links=inspectNativeFlatexOrderLinks(input,{maxDays:0});
  assert.equal(inspection.pairs.length,spec.expected,spec.name+' boundary changed');
  assert.equal(JSON.stringify(input),before,'source mutation');
  if(spec.expected){const p=inspection.pairs[0];assert.equal(p.version,3);assert.equal(p.executions.length,3);assert.equal(p.fills.length,3);if(proofId)assert.equal(p.id,proofId,'document order changes identity');proofId=p.id;}
  if(spec.conflict)assert.ok(inspection.identities.rows.some(r=>r.status==='conflict'));
  results.push({name:spec.name,reverse,expectedOffers:spec.expected,actualOffers:inspection.pairs.length,proofVersion:inspection.pairs[0]?.version??null,reviewCount:inspection.reviewCount,documentaryStatus:links.groups.map(g=>g.status),identityConflicts:inspection.identities.rows.filter(r=>r.status==='conflict').length,sourceBytesUnchanged:true,result:'PASS'});
 }
}
const report={main:'2ca2e03ca1ba203f587f79444fdb43fc4ea62b36',tree:'129c9cac1391f7a306087395c6fc42a01e8d0d4b',version:'v292 LIVE_ACCEPTED',scope:'SYNTHETIC read-only proof-inspection boundary only; no new N:M/FX import, model/IDB writes, private-original or production acceptance',cases:results.length,offeredCases:results.filter(r=>r.actualOffers===1).length,blockedCases:results.filter(r=>r.actualOffers===0).length,results,result:'PASS'};
writeFileSync(new URL('../release-evidence/uh05-v292-remaining-boundary-2026-11-06.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,cases:report.cases,offeredCases:report.offeredCases,blockedCases:report.blockedCases,sourceBytesUnchanged:true}));
