/** Read-only v289 boundary diagnostic. Entirely synthetic; no import capability. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {nativeFlatexCSV} from '../../tests/flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../../src/flatex-native.js';
import {inspectFlatexNetPairs} from '../../src/flatex-net-settlement.js';
import {inspectNativeFlatexOrderLinks} from '../../src/flatex-settlements.js';
const rows=(n,{sell=false,equal=false,currency='EUR'}={})=>Array.from({length:n},(_,i)=>({5:String((sell?-1:1)*(equal?1:i+1)),9:'10',8:'SYN-NEXT-FILL-'+i,10:currency,7:'ORDER '+(sell?'Verkauf':'Kauf')+' IE00SYNTH001 991'}));
const cash=(n,{sell=false,currency='EUR'}={})=>Array.from({length:n},(_,i)=>({5:'SYN-NEXT-CASH-'+i,6:String((sell?1:-1)*(i===0?63:5)),7:currency,4:'ORDER '+(sell?'Verkauf':'Kauf')+' IE00SYNTH001 991'}));
const specs=[
 {name:'three-buy-one-cash',n:3,m:1},
 {name:'three-sell-one-cash',n:3,m:1,sell:true},
 {name:'three-equal-distinct-bank-identities',n:3,m:1,equal:true},
 {name:'four-buy-one-cash',n:4,m:1},
 {name:'three-buy-two-cash',n:3,m:2},
 {name:'two-buy-three-cash',n:2,m:3},
 {name:'three-usd-one-eur-cash',n:3,m:1,currency:'USD'},
 {name:'three-buy-one-cash-exact-export-overlap',n:3,m:1,overlap:true},
 {name:'three-buy-one-cash-conflicting-bank-payload',n:3,m:1,conflict:true}
];
const results=[];
for(const spec of specs){
 const dr=rows(spec.n,spec),cr=cash(spec.m,{sell:spec.sell});
 let docs=[parseFlatexNativeCSV(nativeFlatexCSV('depot',dr)),parseFlatexNativeCSV(nativeFlatexCSV('account',cr))];
 if(spec.overlap)docs.push(...docs);
 if(spec.conflict)docs.push(parseFlatexNativeCSV(nativeFlatexCSV('depot',[{...dr[0],9:'11'}])));
 for(const reverse of [false,true]){
  const input=reverse?[...docs].reverse():docs,before=JSON.stringify(input);
  const inspection=inspectFlatexNetPairs(input),links=inspectNativeFlatexOrderLinks(input,{maxDays:0});
  assert.equal(inspection.pairs.length,0,spec.name+' must remain unoffered');
  assert.equal(JSON.stringify(input),before,'source mutation');
  results.push({name:spec.name,reverse,offered:0,reviewCount:inspection.reviewCount,diagnostic:links.groups.map(g=>g.status),identityConflicts:inspection.identities.rows.filter(r=>r.status==='conflict').length,result:'PASS'});
 }
}
const report={main:'652e80bcb31aec13c85a0457332bdf53cf98a521',scope:'SYNTHETIC read-only missing-capability diagnosis; no supported N:M/FX import, no production or private-original acceptance',cases:results.length,results,result:'PASS'};
writeFileSync(new URL('../release-evidence/uh05-next-nm-boundary-2026-11-06.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
