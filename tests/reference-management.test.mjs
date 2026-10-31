import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,snapshot,safeImport,backup} from '../src/model.js';
import {captureOpenings,executeTransaction} from '../src/transactions.js';
import {historicalWealthView} from '../src/historical-portfolio-value.js';
import {portfolioXirr,portfolioTwr,performanceIssues} from '../src/performance.js';
import {capitalReferenceSeries} from '../src/capital-flows.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
import {prepareBookingArchive,prepareBookingChange} from '../src/booking-management.js';
import {validateBookingArchive} from '../src/booking-history.js';
import {referencePermissions,referenceOrigin,referenceRows,updateReferenceSelection,referenceSelectionSummary,previewReferenceArchive,prepareReferenceArchive,previewReferenceEdit,prepareReferenceEdit,prepareReferenceAdd,previewReferenceRemoval,prepareReferenceRemoval} from '../src/reference-management.js';
const raw=m=>JSON.stringify(m),clone=m=>structuredClone(m);
const consent=m=>({expectedModel:raw(m),confirmed:true});
function fixture(){
 const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'Synthetic references'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic cash account',type:'checking'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'Synthetic cash',kind:'cash',quantity:100,price:1},m));captureOpenings(m);m.openingPositions[0].asOf='2023-01-01';snapshot(m,'2023-01-01','Synthetic start',{manualTotalEUR:'100'});snapshot(m,'2024-01-01','Synthetic end',{manualTotalEUR:'110'});m.performanceFlowTrackingSince='2023-01-01';return safeImport(m);
}
const financial=m=>JSON.parse(raw({positions:m.positions,bookings:m.bookings,journal:m.journalEntries,openings:m.openingPositions,flows:m.externalCashFlows,shots:m.snapshots,tracking:m.performanceFlowTrackingSince,prices:m.priceHistories,views:['auto','observed','partial'].map(basis=>historicalWealthView(m,{basis})),twr:portfolioTwr(m,'2023-01-01','2024-01-01'),xirr:portfolioXirr(m,'2023-01-01','2024-01-01'),issues:performanceIssues(m,'2023-01-01','2024-01-01'),capital:capitalReferenceSeries(m,m.snapshots)}));
test('reference archive is visibility only, including actual non-null TWR/XIRR and every original byte',()=>{
 const m=fixture(),before=raw(m),metrics=financial(m);assert.equal(metrics.twr,0.10000000000000009);assert.ok(Math.abs(metrics.xirr-0.1)<0.001);const id=m.snapshots[0].id;
 const a=prepareReferenceArchive(m,{ids:[id],archived:true},consent(m));assert.equal(raw(m),before);assert.equal(a.version,4);assert.deepEqual(a.bookingPresentation,{version:2,archivedIds:[],referenceArchivedIds:[id]});assert.deepEqual(financial(a),metrics);assert.equal(referenceRows(a).length,1);assert.equal(referenceRows(a,'archived')[0].id,id);assert.equal(referenceRows(a,'all').length,2);
 const restored=prepareReferenceArchive(a,{ids:[id],archived:false},consent(a));assert.equal(restored.version,3);assert.equal(restored.bookingPresentation,undefined);assert.deepEqual(financial(restored),metrics);assert.equal(raw(restored),before);
});
test('archive retains legacy, automatic, unknown and partial originals without promoting their quality',()=>{
 const m=fixture();for(const [source,valuationStatus] of [['legacy','legacy-unverified'],['current','partial'],['unproved','unknown']]){const s=m.snapshots[0];s.source=source;s.valuationStatus=valuationStatus;s.quoteTimes=[{source:'SYNTHETIC original'}];const before=clone(s),a=prepareReferenceArchive(m,{ids:[s.id],archived:true},consent(m));assert.deepEqual(a.snapshots[0],before);assert.ok(referencePermissions(a,s.id).editReason);assert.notEqual(referenceOrigin(s),'Manuell bestätigt');}
});
test('archive rejects mixed states, stale/duplicate/unknown IDs and missing consent without partial changes',()=>{
 const m=fixture(),id=m.snapshots[0].id,a=prepareReferenceArchive(m,{ids:[id],archived:true},consent(m)),before=raw(a);
 assert.throws(()=>previewReferenceArchive(a,a.snapshots.map(s=>s.id),true),/aktive und archivierte/);
 for(const ids of [[],[id,id],['missing']])assert.throws(()=>prepareReferenceArchive(a,{ids,archived:false},consent(a)));
 for(const options of [{}, {...consent(a),confirmed:false},{...consent(a),expectedModel:raw(m)}])assert.throws(()=>prepareReferenceArchive(a,{ids:[id],archived:false},options));assert.equal(raw(a),before);
});
test('one strict archive envelope rejects malformed reference metadata in both import and backup',()=>{
 const m=fixture(),id=m.snapshots[0].id;
 const invalid=[{version:2,archivedIds:[],referenceArchivedIds:[]},{version:2,archivedIds:[],referenceArchivedIds:[id,id]},{version:2,archivedIds:[],referenceArchivedIds:['missing']},{version:2,archivedIds:[],referenceArchivedIds:[id],extra:true},{version:2,referenceArchivedIds:[id]},{version:1,archivedIds:[],referenceArchivedIds:[id]},{version:9,archivedIds:[],referenceArchivedIds:[id]}];
 for(const bookingPresentation of invalid){const bad={...clone(m),version:4,bookingPresentation};assert.throws(()=>safeImport(bad));assert.throws(()=>backup(bad));}
 assert.throws(()=>safeImport({...clone(m),bookingPresentation:{version:2,archivedIds:[],referenceArchivedIds:[id]}}),/neue Datenversion/);
 const tooMany={version:2,archivedIds:[],referenceArchivedIds:Array(15001).fill(id)};assert.throws(()=>validateBookingArchive(tooMany,m));
});
test('plain, complete and password encrypted roundtrips preserve reference and original data',async()=>{
 const m=fixture(),a=prepareReferenceArchive(m,{ids:[m.snapshots[1].id],archived:true},consent(m)),plain=backup(a,{includeHistory:true});
 const restored=safeImport(JSON.parse(plain));assert.deepEqual(restored.bookingPresentation,a.bookingPresentation);assert.deepEqual(restored.snapshots,a.snapshots);
 const complete=createCompleteBackup(JSON.parse(plain));const envelope=await encryptBackup(JSON.stringify(complete),'Synthetic reference 2026!');const unpacked=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(envelope),'Synthetic reference 2026!')));const again=safeImport(unpacked.data);assert.deepEqual(again.bookingPresentation,a.bookingPresentation);assert.deepEqual(again.snapshots,a.snapshots);assert.deepEqual(financial(again),financial(a));
});
test('old v1/v2/v3 imports gain no archive flags and preserve unverified history',()=>{
 const m=fixture();assert.equal(safeImport(clone(m)).bookingPresentation,undefined);
 for(const version of [1,2]){const old={...clone(m),version,bookings:[],journalEntries:[]};if(version===1)for(const p of old.positions)delete p.accountId;const restored=safeImport(old);assert.equal(restored.version,3);assert.equal(restored.bookingPresentation,undefined);assert.equal(restored.snapshots[0].valuationStatus,'legacy-unverified');}
});
test('booking and reference archives retain each other in both directions and use the old format when possible',()=>{
 const m=fixture();executeTransaction(m,{positionId:'cash',date:'2024-06-01',type:'deposit',quantity:'5',unitPrice:1});const bid=m.bookings[0].id,sid=m.snapshots[1].id;
 const b=prepareBookingArchive(m,{ids:[bid],archived:true},consent(m)).candidate;assert.equal(b.bookingPresentation.version,1);
 const both=prepareReferenceArchive(b,{ids:[sid],archived:true},consent(b));assert.equal(both.bookingPresentation.version,2);assert.deepEqual(both.bookingPresentation.archivedIds,[bid]);
 const refs=prepareBookingArchive(both,{ids:[bid],archived:false},consent(both)).candidate;assert.deepEqual(refs.bookingPresentation,{version:2,archivedIds:[],referenceArchivedIds:[sid]});assert.equal(refs.version,4);
 const again=prepareBookingArchive(refs,{ids:[bid],archived:true},consent(refs)).candidate;assert.deepEqual(again.bookingPresentation,both.bookingPresentation);
 const onlyBookings=prepareReferenceArchive(again,{ids:[sid],archived:false},consent(again));assert.deepEqual(onlyBookings.bookingPresentation,b.bookingPresentation);
 const removed=prepareBookingChange(refs,{ids:[bid],action:'remove',reason:'Synthetic independent manual cash removal'},consent(refs)).candidate;assert.deepEqual(removed.bookingPresentation,refs.bookingPresentation);assert.equal(removed.version,4);
});
test('reference selection preserves hidden IDs, cycles page then full filter, and exposes stale IDs without writes',()=>{
 const m=fixture(),before=raw(m),ids=m.snapshots.map(s=>s.id),page=[ids[0]];
 let selected=updateReferenceSelection(m,[],{type:'cycle',pageIds:page,matchingIds:ids},ids);assert.deepEqual(selected,page);
 selected=updateReferenceSelection(m,selected,{type:'cycle',pageIds:page,matchingIds:ids},ids);assert.deepEqual(selected,ids);
 assert.equal(referenceSelectionSummary(m,selected,page).hiddenCount,1);
 selected=updateReferenceSelection(m,selected,{type:'toggle',id:ids[0]},page);assert.deepEqual(selected,[ids[1]]);
 assert.throws(()=>updateReferenceSelection(m,[],{type:'toggle',id:ids[1]},page),/außerhalb/);
 assert.throws(()=>updateReferenceSelection(m,[],{type:'all',confirmed:true},page),/gefilterte/);
 assert.throws(()=>updateReferenceSelection(m,[],{type:'filtered',matchingIds:ids},page),/außerhalb/);
 assert.throws(()=>updateReferenceSelection(m,[],{type:'cycle',pageIds:ids,matchingIds:page},page),/außerhalb/);
 assert.equal(referenceSelectionSummary(m,['missing'],ids).requiresRefresh,true);
 assert.throws(()=>updateReferenceSelection(m,['missing'],{type:'toggle',id:ids[0]},ids),/veraltet/);
 assert.deepEqual(updateReferenceSelection(m,['missing'],{type:'clear'},ids),[]);
 assert.equal(raw(m),before);
});
test('manual correction previews actual before/after values and preserves original revisions, archive and start',()=>{
 const m=fixture(),id=m.snapshots[1].id,a=prepareReferenceArchive(m,{ids:[id],archived:true},consent(m)),before=raw(a);const values={date:'2024-01-02',totalEUR:'111.25',note:'Synthetic reviewed correction'};
 const preview=previewReferenceEdit(a,id,values);assert.equal(preview.correction,true);assert.equal(preview.before.totalEURExact,'110');assert.equal(preview.after.totalEURExact,'111.25');assert.match(preview.impact,/Renditen/);
 const edited=prepareReferenceEdit(a,id,values,consent(a)),s=edited.snapshots[1];assert.equal(raw(a),before);assert.equal(s.totalEURExact,'111.25');assert.equal(s.revisions.at(-1).totalEURExact,'110');assert.equal(s.revisions.at(-1).date,'2024-01-01');assert.equal(edited.performanceFlowTrackingSince,m.performanceFlowTrackingSince);assert.deepEqual(edited.bookingPresentation,a.bookingPresentation);assert.deepEqual(edited.positions,a.positions);
});
test('automatic, legacy, unknown and contradictory manual sources block correction at runtime',()=>{
 for(const kind of ['current','legacy','unknown','contradictory']){const m=fixture(),s=m.snapshots[1];if(kind==='contradictory')s.byAccount={a:110};else{s.source=kind;s.valuationStatus=kind==='legacy'?'legacy-unverified':'observed';}const before=raw(m);assert.ok(referencePermissions(m,s.id).editReason);assert.throws(()=>prepareReferenceEdit(m,s.id,{note:'Changed'},consent(m)),/Herkunft/);assert.equal(raw(m),before);}
});
test('performance start and duplicate dates stay guarded; note edits retain all financial values',()=>{
 const m=fixture(),id=m.snapshots[0].id;assert.equal(referencePermissions(m,id).startProtected,true);assert.throws(()=>prepareReferenceEdit(m,id,{totalEUR:'99'},consent(m)),/Startstichtag/);assert.throws(()=>prepareReferenceEdit(m,m.snapshots[1].id,{date:m.snapshots[0].date},consent(m)),/existiert/);
 const edited=prepareReferenceEdit(m,id,{note:'Synthetic start annotation'},consent(m));assert.equal(edited.performanceFlowTrackingSince,m.performanceFlowTrackingSince);assert.equal(edited.snapshots[0].totalEURExact,'100');assert.deepEqual(edited.snapshots[0].revisions[0],{recordedAt:m.snapshots[0].recordedAt,date:'2023-01-01',note:m.snapshots[0].note,totalEURExact:'100',valuationStatus:'manual',source:'manual'});
});
test('adding never overwrites an existing or archived original and never resets performance tracking',()=>{
 const m=fixture(),s=m.snapshots[0],a=prepareReferenceArchive(m,{ids:[s.id],archived:true},consent(m));assert.throws(()=>prepareReferenceAdd(a,{date:s.date,manualTotalEUR:'1'},consent(a)),/Originalwert/);assert.throws(()=>prepareReferenceAdd(a,{manualTotalEUR:'1'},consent(a)),/ausdrücklich/);assert.throws(()=>prepareReferenceAdd(a,{date:'2023-06-01'},consent(a)),/historische Stichtage/);
 const added=prepareReferenceAdd(a,{date:'2023-06-01',manualTotalEUR:'104',note:'Synthetic additional observation'},consent(a));assert.equal(added.snapshots.length,3);assert.deepEqual(added.snapshots.find(x=>x.id===s.id),s);assert.deepEqual(added.bookingPresentation,a.bookingPresentation);assert.equal(added.performanceFlowTrackingSince,a.performanceFlowTrackingSince);
});
test('manual endpoint removal preserves finance and start but reports lost boundary returns as unknown',()=>{
 const m=fixture(),id=m.snapshots[1].id,before=raw(m),preview=previewReferenceRemoval(m,[id]);
 assert.equal(referencePermissions(m,id).deleteReason,'');assert.equal(preview.before.twr,0.10000000000000009);assert.equal(preview.after.twr,null);assert.equal(preview.after.xirr,null);assert.ok(preview.after.issues.includes('Start- oder Endbewertung fehlt'));
 const after=prepareReferenceRemoval(m,[id],consent(m));assert.equal(raw(m),before);assert.equal(after.snapshots.length,1);assert.deepEqual(after.snapshots,[m.snapshots[0]]);
 const omit=x=>{const v=clone(x);delete v.snapshots;return v;};assert.deepEqual(omit(after),omit(m));assert.equal(after.performanceFlowTrackingSince,m.performanceFlowTrackingSince);
});
test('manual intermediate removal uses existing projections without inventing a replacement observation',()=>{
 const m=fixture();snapshot(m,'2023-06-01','Synthetic independent control',{manualTotalEUR:'104'});const s=m.snapshots[1],before=raw(m),p=previewReferenceRemoval(m,[s.id]),after=prepareReferenceRemoval(m,[s.id],consent(m));
 assert.equal(p.before.views.find(v=>v.basis==='observed').dates.length,3);assert.deepEqual(p.after.views.find(v=>v.basis==='observed').dates,['2023-01-01','2024-01-01']);assert.ok(Math.abs(p.after.twr-0.1)<1e-12);assert.ok(Math.abs(p.after.xirr-0.1)<0.001);assert.equal(raw(m),before);assert.deepEqual(after.snapshots,[m.snapshots[0],m.snapshots[2]]);
});
test('removal blocks start, original-source dependencies and unknown fields, never partially deletes',()=>{
 const m=fixture(),start=m.snapshots[0].id,id=m.snapshots[1].id;
 assert.ok(referencePermissions(m,start).deleteReason);assert.throws(()=>previewReferenceRemoval(m,[start,id]),/Startstichtag/);
 for(const mutate of [s=>s.source='current',s=>s.source='legacy',s=>s.byAccount={a:110},s=>s.quoteTimes=[{source:'synthetic'}],s=>s.extra='unknown',s=>s.revisions=[{source:'current',valuationStatus:'observed'}],s=>s.revisions=[{source:'manual',valuationStatus:'manual',extra:'unknown'}]]){
  const bad=clone(m);mutate(bad.snapshots[1]);const before=raw(bad);assert.throws(()=>previewReferenceRemoval(bad,[id]));assert.throws(()=>prepareReferenceRemoval(bad,[id],consent(bad)));assert.equal(raw(bad),before);
 }
});
test('reference dependencies include opaque/serialized metadata, other originals and duplicate dates',()=>{
 const m=fixture(),id=m.snapshots[1].id;
 for(const attach of [x=>x.settings.synthetic={snapshotId:id},x=>x.settings.synthetic=JSON.stringify({reference:id}),x=>x.snapshots[0].note=id,x=>x.snapshots[0].byAccount={[id]:100},x=>x.settings.synthetic='truncated { '+id,x=>x.settings.synthetic=JSON.stringify({snapshotId:id.replace(/./g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))}).replace(/\\\\u/g,'\\u')]){
  const bad=clone(m);attach(bad);const before=raw(bad);assert.throws(()=>previewReferenceRemoval(bad,[id]),/verweisen/);assert.equal(raw(bad),before);
 }
 const duplicate=clone(m);duplicate.snapshots[1].date=duplicate.snapshots[0].date;duplicate.performanceFlowTrackingSince=null;assert.throws(()=>previewReferenceRemoval(duplicate,[id]),/nicht eindeutig/);
});
test('removal requires exact consent and rejects stale, invalid or duplicate selection without mutation',()=>{
 const m=fixture(),id=m.snapshots[1].id,before=raw(m);
 for(const options of [{},{...consent(m),confirmed:false},{...consent(m),expectedModel:before+' '}])assert.throws(()=>prepareReferenceRemoval(m,[id],options),/Bestätigung/);
 for(const ids of [[],[id,id],['missing']])assert.throws(()=>prepareReferenceRemoval(m,ids,consent(m)));assert.equal(raw(m),before);
});
test('removal cleans only selected reference archive IDs and preserves booking archive format',()=>{
 let m=fixture();executeTransaction(m,{positionId:'cash',date:'2024-06-01',type:'deposit',quantity:'5',unitPrice:1});const bid=m.bookings[0].id,id=m.snapshots[1].id;
 m=prepareBookingArchive(m,{ids:[bid],archived:true},consent(m)).candidate;const both=prepareReferenceArchive(m,{ids:[id],archived:true},consent(m));const after=prepareReferenceRemoval(both,[id],consent(both));assert.deepEqual(after.bookingPresentation,m.bookingPresentation);assert.equal(after.version,4);assert.deepEqual(after.bookings,both.bookings);assert.deepEqual(after.journalEntries,both.journalEntries);
 const plain=fixture(),sid=plain.snapshots[1].id,only=prepareReferenceArchive(plain,{ids:[sid],archived:true},consent(plain)),removed=prepareReferenceRemoval(only,[sid],consent(only));assert.equal(removed.version,3);assert.equal(removed.bookingPresentation,undefined);
});
test('removed originals retain exact session undo and plain/encrypted backup recovery',async()=>{
 const {csvUndoReceipt,canUndoCSV,undoCSV}=await import('../src/csv-batch.js');const m=fixture(),id=m.snapshots[1].id,original=raw(m),payload=backup(m,{includeHistory:true});const candidate=prepareReferenceRemoval(m,[id],consent(m)),receipt=csvUndoReceipt(original,candidate);
 assert.equal(canUndoCSV(candidate,receipt),true);const changed=clone(candidate);changed.settings.autoRefresh=!candidate.settings.autoRefresh;assert.equal(canUndoCSV(changed,receipt),false);assert.throws(()=>undoCSV(changed,receipt));undoCSV(candidate,receipt);assert.equal(raw(candidate),original);
 const envelope=await encryptBackup(JSON.stringify(createCompleteBackup(JSON.parse(payload))),'Synthetic reference removal 2026!');const unpacked=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(envelope),'Synthetic reference removal 2026!')));for(const restored of [safeImport(JSON.parse(payload)),safeImport(unpacked.data)])assert.deepEqual(restored.snapshots,m.snapshots);
});
test('today observation cannot be silently regenerated by an automatic current capture after removal',()=>{
 const m=fixture();snapshot(m,new Date().toISOString().slice(0,10),'Synthetic current manual',{manualTotalEUR:'123'});const id=m.snapshots.at(-1).id,before=raw(m);assert.throws(()=>previewReferenceRemoval(m,[id]),/automatisch neu erfasst/);assert.equal(raw(m),before);
});

test('10,000 reference IDs retain exact explicit scope across pagination and stale records',()=>{
 const m={snapshots:Array.from({length:10000},(_,i)=>({id:'synthetic-ref-'+i}))},before=raw(m),all=m.snapshots.map(s=>s.id),page=all.slice(0,100);
 let selected=updateReferenceSelection(m,[],{type:'cycle',pageIds:page,matchingIds:all},all);assert.equal(selected.length,100);
 selected=updateReferenceSelection(m,selected,{type:'cycle',pageIds:page,matchingIds:all},all);assert.deepEqual(selected,all);
 const narrow=all.slice(-1),summary=referenceSelectionSummary(m,selected,narrow);assert.equal(summary.hiddenCount,9999);assert.equal(summary.currentCount,10000);
 assert.deepEqual(updateReferenceSelection(m,selected,{type:'toggle',id:narrow[0]},narrow),all.slice(0,-1));
 const stale=structuredClone(m);stale.snapshots.pop();assert.equal(referenceSelectionSummary(stale,selected,all.slice(0,-1)).requiresRefresh,true);assert.throws(()=>updateReferenceSelection(stale,selected,{type:'cycle',pageIds:page,matchingIds:all.slice(0,-1)},all.slice(0,-1)),/veraltet/);assert.equal(raw(m),before);
});
