import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,valueEUR} from '../src/model.js';
import {searchAndSortPositions} from '../src/position-search.js';
import {updatePositionSelection,positionSelectionSummary,previewPositionRemoval} from '../src/position-selection.js';

function fixture(count=3){
 const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic broker'}));
 for(const id of ['depot-a','depot-b'])m.accounts.push(createAccount({id,providerId:'provider',name:id,type:'securities'},m));
 for(let i=0;i<count;i++)m.positions.push(createPosition({id:'p-'+i,providerId:'provider',accountId:i%2?'depot-b':'depot-a',
  name:(i%2?'Other ':'Wanted ')+i,isin:'IE00B4L5Y983',symbol:'SAME',kind:'etf',quantityExact:'1.25',price:100},m));
 return m;
}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

test('Stable IDs distinguish same ISIN across accounts; toggles are immutable and ordered',()=>{
 const m=freeze(fixture()),previous=Object.freeze(['p-1']);
 assert.deepEqual(updatePositionSelection(m,previous,{type:'toggle',id:'p-0'}),['p-0','p-1']);
 assert.deepEqual(updatePositionSelection(m,['p-0','p-1'],{type:'toggle',id:'p-1'}),['p-0']);
 assert.deepEqual(previous,['p-1']);assert.equal(m.positions[0].isin,m.positions[1].isin);
});
test('Select filtered uses the complete existing search result, including 101st+ unrendered matches',()=>{
 const m=freeze(fixture(401));
 const matching=searchAndSortPositions(m.positions,m,'Wanted','name',valueEUR).map(p=>p.id);
 const selected=updatePositionSelection(m,[],{type:'filtered',matchingIds:matching});
 assert.equal(matching.length,201);assert.equal(selected.length,201);assert.ok(selected.includes('p-400'));
 assert.equal(matching.slice(0,100).length,100,'UI pagination is independent of the full query');
 assert.equal(m.positions.length,401);
});
test('All vs filtered requires explicit all intent and never mutates the portfolio',()=>{
 const m=freeze(fixture(401));assert.throws(()=>updatePositionSelection(m,[],{type:'all'}),/ausdrücklich/);
 assert.equal(updatePositionSelection(m,[],{type:'all',confirmed:true}).length,401);
 assert.deepEqual(updatePositionSelection(m,['p-1'],{type:'filtered',matchingIds:[]}),['p-1']);
});
test('Filter changes retain hidden selection and do not select new matches',()=>{
 const m=freeze(fixture(5)),selected=Object.freeze(['p-0','p-2','p-4']);
 const summary=positionSelectionSummary(m,selected,['p-1','p-3']);
 assert.equal(summary.selectedCount,3);assert.equal(summary.inFilterCount,0);assert.equal(summary.hiddenCount,3);
 assert.equal(summary.matchingCount,2);assert.deepEqual(summary.selectedIds,selected);assert.equal(summary.requiresRefresh,false);
});
test('Stale IDs remain explicit and block preview/actions until refresh or clear',()=>{
 const m=fixture(),selected=['p-0','p-2'];m.positions.pop();const before=JSON.stringify(m);
 const summary=positionSelectionSummary(m,selected,['p-0']);
 assert.deepEqual(summary.staleIds,['p-2']);assert.equal(summary.currentCount,1);assert.equal(summary.selectedCount,2);
 assert.equal(summary.requiresRefresh,true);
 assert.throws(()=>previewPositionRemoval(m,selected),/veraltet/);
 assert.throws(()=>updatePositionSelection(m,selected,{type:'toggle',id:'p-1'}),/veraltet/);
 assert.deepEqual(updatePositionSelection(m,selected,{type:'clear'}),[]);assert.equal(JSON.stringify(m),before);
});
test('Duplicate selection IDs never multiply candidates; ambiguous model IDs fail closed',()=>{
 const m=fixture();assert.equal(positionSelectionSummary(m,['p-0','p-0'],['p-0','p-0']).selectedCount,1);
 assert.equal(previewPositionRemoval(m,['p-0','p-0']).selectedCount,1);
 m.positions.push({...m.positions[0]});assert.throws(()=>previewPositionRemoval(m,['p-0']),/mehrdeutig/);
});
test('Invalid action, ID, matching scope and empty removal never become all-position actions',()=>{
 const m=fixture();
 for(const action of [{type:'unknown'},{type:'toggle',id:'missing'},{type:'filtered',matchingIds:['missing']}])
  assert.throws(()=>updatePositionSelection(m,[],action));
 assert.throws(()=>previewPositionRemoval(m,[]),/Keine Position/);
 assert.throws(()=>positionSelectionSummary(m,[null],[]));
});
test('Unreferenced preview lists own opening/price impacts without deleting or persisting anything',()=>{
 const m=fixture();m.openingPositions=[{positionId:'p-0',quantityExact:'1.25',asOf:'2023-01-01'}];
 m.priceHistories['p-0']={currency:'EUR',points:[{date:'2023-01-01',total:100}]};
 m.settings.eodhdKey='SYNTHETIC-SECRET-NEVER-IN-PREVIEW';const before=JSON.stringify(m);freeze(m);
 const preview=previewPositionRemoval(m,['p-0']);
 assert.equal(preview.unreferencedCount,1);assert.equal(preview.blockedCount,0);assert.equal(preview.writeEnabled,false);
 assert.deepEqual(preview.items[0].cleanup.map(x=>x.category),['openingPositions','priceHistories']);
 assert.equal(preview.items[0].quantityExact,'1.25');assert.match(preview.modelDigest,/^[a-f0-9]{64}$/);
 assert.ok(!JSON.stringify(preview).includes(m.settings.eodhdKey));assert.equal(JSON.stringify(m),before);
});
test('Existing booking/journal/DeFi guards are reused rather than replaced by a second delete engine',()=>{
 for(const kind of ['bookings','journalEntries','positions']){
  const m=fixture();
  if(kind==='bookings')m.bookings=[{id:'booking',positionId:'p-0'}];
  if(kind==='journalEntries')m.journalEntries=[{id:'entry',postings:[{positionId:'p-0'}]}];
  if(kind==='positions')m.positions[1].representedByPositionId='p-0';
  const before=JSON.stringify(m);freeze(m);const item=previewPositionRemoval(m,['p-0']).items[0];
  assert.equal(item.classification,'blocked');assert.ok(item.blockers.length);assert.ok(item.references.some(r=>r.category===kind));
  assert.equal(JSON.stringify(m),before);
 }
});
test('Retained snapshot keys and cash settlement references block proposed batch removal',()=>{
 const m=fixture();m.snapshots=[{id:'shot',date:'2023-01-01',byPosition:{'p-0':'125'}}];
 m.bookings=[{id:'other-trade',positionId:'p-1',cashPositionId:'p-0'}];freeze(m);
 const preview=previewPositionRemoval(m,['p-0']);assert.equal(preview.blockedCount,1);
 assert.deepEqual(new Set(preview.items[0].references.map(r=>r.category)),new Set(['bookings','snapshots']));
 assert.equal(m.snapshots[0].byPosition['p-0'],'125');
});
test('Wallet sessions, purchase evidence and enabled discovery cannot be silently cascaded',()=>{
 const m=fixture();m.positions[0].wallet={enabled:true,chain:'bitcoin',address:'SYNTHETIC'};
 m.walletHistory={sessions:[{id:'wallet-history:p-0',walletKey:'p-0'}]};
 m.purchaseEvidence={decisions:[{walletKey:'p-0',receiptIds:['receipt']} ]};freeze(m);
 const item=previewPositionRemoval(m,['p-0']).items[0];assert.equal(item.classification,'blocked');
 assert.ok(item.blockers.some(x=>x.includes('Wallet')));
 assert.ok(item.references.some(r=>r.category==='walletHistory'));assert.ok(item.references.some(r=>r.category==='purchaseEvidence'));
});
test('Serialized provenance and unknown future references are inspected conservatively',()=>{
 const m=fixture();m.futureLinks={'p-0':{positionId:'p-1'}};
 m.bookings=[{id:'other',positionId:'p-2',importSource:{ownedSnapshot:JSON.stringify({postings:[{positionId:'p-0'}]})}}];
 const result=previewPositionRemoval(freeze(m),['p-0','p-1']);assert.equal(result.blockedCount,2);
 assert.ok(result.items[0].references.some(r=>r.path.includes('(json)')));
 assert.ok(result.items.every(item=>item.references.some(r=>r.category==='futureLinks')));
});
test('A reference from another selected position stays blocked; selection is not cascade consent',()=>{
 const m=fixture();m.positions[1].representedByPositionId='p-0';const preview=previewPositionRemoval(freeze(m),['p-0','p-1']);
 assert.equal(preview.items[0].classification,'blocked');assert.equal(preview.items[1].classification,'unreferenced');
 assert.equal(preview.writeEnabled,false);assert.equal(m.positions.length,3);
});
test('Malformed opaque JSON, unsupported objects, cycles and limits never yield partial clearance',()=>{
 const malformed=fixture();malformed.future='{"positionId":';assert.equal(previewPositionRemoval(malformed,['p-0']).blockedCount,1);
 const cyclic=fixture();cyclic.future=cyclic;assert.throws(()=>previewPositionRemoval(cyclic,['p-0']),/Zyklisch/);
 const unsupported=fixture();unsupported.future=new Map();assert.throws(()=>previewPositionRemoval(unsupported,['p-0']),/nicht prüfbar/);
 assert.throws(()=>previewPositionRemoval(fixture(),['p-0'],{maxNodes:1}),/begrenzt/);
 assert.throws(()=>previewPositionRemoval(fixture(),['p-0'],{maxBytes:20}),/zu groß/);
 const incomplete=fixture();delete incomplete.journalEntries;assert.throws(()=>previewPositionRemoval(incomplete,['p-0']),/nicht vollständig/);
});
test('Any later model change, including an unselected quote, invalidates the preview digest',()=>{
 const m=fixture(),first=previewPositionRemoval(m,['p-0']);m.positions[2].priceExact='101';
 assert.notEqual(previewPositionRemoval(m,['p-0']).modelDigest,first.modelDigest);
 assert.equal(first.writeEnabled,false);assert.equal(m.positions.length,3);
});
