import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,csv,preview} from './p0-import-fixture.mjs';
import {blankModel,createProvider,createPosition,backup,safeImport,totalExactEUR} from '../src/model.js';
import {setPositionArchived} from '../src/portfolio-edit-actions.js';
import {positionListScope,searchAndSortPositions} from '../src/position-search.js';
import {updatePositionSelection,positionSelectionSummary,previewPositionRemoval} from '../src/position-selection.js';
import {importCSV} from '../src/csv-import.js';
import {csvUndoReceipt,undoCSV,canUndoCSV} from '../src/csv-batch.js';
import {historicalWealthView} from '../src/historical-portfolio-value.js';
import {updateScannedWalletPosition} from '../src/wallet-scan-update.js';

test('archiving a linked positive holding changes only visibility and never economics/history',()=>{
 const m=fixture();importCSV(m,preview(m,csv()));const before=structuredClone(m),total=totalExactEUR(m),wealth=historicalWealthView(m);
 setPositionArchived(m,m.positions[0].id,true);
 assert.equal(m.positions[0].archived,true);assert.equal(totalExactEUR(m),total);assert.deepEqual(historicalWealthView(m),wealth);
 const withoutFlag=structuredClone(m);delete withoutFlag.positions[0].archived;assert.deepEqual(withoutFlag,before);
 assert.equal(previewPositionRemoval(m,[m.positions[0].id]).items[0].classification,'blocked','archive does not grant deletion of referenced finances');
 setPositionArchived(m,m.positions[0].id,false);assert.deepEqual(m,before);
});
test('legacy optional archive field roundtrips and invalid types fail closed',()=>{
 const m=fixture();assert.equal(Object.hasOwn(m.positions[0],'archived'),false);
 const legacy=safeImport(JSON.parse(backup(m)));assert.equal(Object.hasOwn(legacy.positions[0],'archived'),false);
 setPositionArchived(m,m.positions[0].id,true);const restored=safeImport(JSON.parse(backup(m,{includeHistory:true})));
 assert.equal(restored.positions[0].archived,true);assert.equal(totalExactEUR(restored),totalExactEUR(m));
 for(const bad of ['true',1,null,{}]){const raw=JSON.parse(backup(m));raw.positions[0].archived=bad;assert.throws(()=>safeImport(raw),/Archiv/);}
});
test('same-ISIN positions remain independent; zero and nonzero holdings can be restored',()=>{
 const m=fixture();for(const p of m.positions)p.isin='IE00B4L5Y983';
 setPositionArchived(m,m.positions[0].id,true);assert.deepEqual(positionListScope(m.positions).map(p=>p.id),[m.positions[1].id]);
 assert.equal(positionListScope(m.positions,{includeArchived:true}).length,2);
 setPositionArchived(m,m.positions[0].id,false);assert.equal(positionListScope(m.positions).length,2);
});
test('archived identity survives exact CSV replay and additional imported transactions',()=>{
 const m=fixture(),p=m.positions[0];importCSV(m,preview(m,csv('first')));setPositionArchived(m,p.id,true);
 const replay=preview(m,csv('first'));assert.equal(replay.ready,0);assert.equal(replay.duplicates,1);
 importCSV(m,preview(m,csv('second','20')));assert.equal(m.positions.length,2);assert.equal(m.positions[0].archived,true);assert.equal(m.positions[0].quantityExact,'120');
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.positions[0].id,p.id);assert.equal(restored.positions[0].archived,true);
});
test('confirmed wallet refresh retains archive/identity and changes only existing scan facts',()=>{
 const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic'}));
 const p=createPosition({id:'wallet',providerId:'provider',kind:'crypto',name:'Synthetic ETH',symbol:'ETH',coinId:'ethereum',quantity:1,price:10,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'1'.repeat(40)}},m);m.positions.push(p);setPositionArchived(m,p.id,true);
 updateScannedWalletPosition(p,{quantityExact:'2.000000000000000001',price:20});
 assert.equal(p.id,'wallet');assert.equal(p.archived,true);assert.equal(p.quantityExact,'2.000000000000000001');assert.equal(m.positions.length,1);
 assert.equal(safeImport(JSON.parse(backup(m))).positions[0].archived,true);
});
test('full filtered selection precedes pagination, hidden archives stay explicit and all remains total',()=>{
 const m=fixture();m.positions=Array.from({length:401},(_,i)=>({...m.positions[0],id:'p'+i,name:'Wanted '+i,...(i%2?{archived:true}:{})}));
 const active=searchAndSortPositions(positionListScope(m.positions),m,'Wanted','name',()=>1),ids=active.map(p=>p.id);
 let selected=updatePositionSelection(m,[],{type:'filtered',matchingIds:ids});assert.equal(selected.length,201);
 selected=updatePositionSelection(m,selected,{type:'all',confirmed:true});assert.equal(selected.length,401);
 assert.equal(positionSelectionSummary(m,selected,ids).hiddenCount,200);
 assert.equal(positionListScope(m.positions,{includeArchived:true}).length,401);
});
test('unknown/duplicate identities and invalid archive intent are atomic failures',()=>{
 for(const intent of ['unknown','duplicate','wrong-type']){
  const m=fixture();if(intent==='duplicate')m.positions.push({...m.positions[0]});const before=JSON.stringify(m);
  assert.throws(()=>setPositionArchived(m,intent==='unknown'?'missing':m.positions[0].id,intent==='wrong-type'?'true':true));assert.equal(JSON.stringify(m),before);
 }
});
test('editing through the shared factory can retain the same archived economic identity',()=>{
 const m=fixture(),p=m.positions[0];setPositionArchived(m,p.id,true);
 const edited=createPosition({...p,name:'Renamed archived holding'},m);
 assert.equal(edited.archived,true);assert.equal(edited.id,p.id);assert.equal(edited.accountId,p.accountId);assert.equal(edited.quantityExact,p.quantityExact);
});

test('undo of a later import retains the existing archive and prior financial state',()=>{
 const m=fixture();setPositionArchived(m,m.positions[0].id,true);const before=structuredClone(m),p=preview(m,csv('after-archive','25'));
 importCSV(m,p);const receipt=csvUndoReceipt(JSON.stringify(before),m);assert.equal(canUndoCSV(m,receipt),true);undoCSV(m,receipt);
 assert.equal(m.positions[0].archived,true);assert.equal(m.positions[0].quantityExact,'0');assert.deepEqual(m.bookings,before.bookings);assert.deepEqual(m.journalEntries,before.journalEntries);
});

test('archiving preserves excluded representations and liabilities without double counting',()=>{
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic economic scope'}));
 for(const v of [{id:'included',name:'Counted holding',quantity:10},{id:'excluded',name:'Representation',quantity:10,valuationMode:'excluded',representedByPositionId:'included',economicRole:'wrapped'},{id:'debt',name:'Liability',quantity:3,valuationMode:'liability',economicRole:'borrowed'}])m.positions.push(createPosition({providerId:'p',kind:'other',price:1,...v},m));
 assert.equal(totalExactEUR(m),'7');const before=JSON.stringify(m);
 for(const p of m.positions)setPositionArchived(m,p.id,true);
 assert.equal(totalExactEUR(m),'7');assert.equal(totalExactEUR(safeImport(JSON.parse(backup(m)))),'7');
 for(const p of m.positions)setPositionArchived(m,p.id,false);
 assert.equal(JSON.stringify(m),before);
});
