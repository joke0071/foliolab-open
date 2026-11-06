/** Synthetic no-write boundary check on exact v291; no new import capability. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fixture} from '../../tests/flatex-net-fixture.mjs';
import {nativeFlatexCSV} from '../../tests/flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../../src/flatex-native.js';
import {inspectFlatexNetPairs,prepareFlatexNetPreview} from '../../src/flatex-net-settlement.js';
const oracle=JSON.parse(readFileSync(new URL('../release-evidence/uh05-three-fill-oracle-2026-11-06.json',import.meta.url),'utf8'));
const results=[];
for(const c of oracle.cases)for(const reverse of [false,true]){
 const f=fixture(),details='ORDER '+(c.direction==='buy'?'Kauf':'Verkauf')+' IE00SYNTH001 993';
 const rows=c.quantities.map((q,i)=>({5:(c.direction==='sell'?'-':'')+q.replace('.',','),9:c.prices[i].replace('.',','),8:c.members[i].bankIdentity,7:details}));
 let documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',rows)),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:c.cashExact.replace('.',','),5:'SYN-THREE-CASH',4:details}]))];
 if(reverse)documents.reverse();
 f.model.positions[0].quantity=Number(c.opening.asset);f.model.positions[0].quantityExact=c.opening.asset;
 f.model.positions[1].quantity=Number(c.opening.cash);f.model.positions[1].quantityExact=c.opening.cash;
 const sourceBefore=JSON.stringify(documents),before=JSON.stringify(f.model),inspection=inspectFlatexNetPairs(documents);
 assert.equal(inspection.pairs.length,0,c.name);
 const preview=prepareFlatexNetPreview(f.model,documents,f.assignments,{...f.options,selectedIds:['fn-'+'0'.repeat(64)]});
 assert.equal(preview.eligible,false);assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(documents),sourceBefore);
 results.push({name:c.name,reverse,offered:0,eligible:false,canonicalModelUnchanged:true,documentsUnchanged:true,result:'BLOCKED_AS_DESIGNED'});
}
const report={main:oracle.main,tree:oracle.tree,scope:'Synthetic 3:1 baseline on unchanged v291; independent future oracle is not an implemented capability',cases:results.length,results,result:'PASS'};
writeFileSync(new URL('../release-evidence/uh05-three-fill-v291-baseline-2026-11-06.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,result:report.result}));
