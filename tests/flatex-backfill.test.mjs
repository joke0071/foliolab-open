import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {prepareFlatexImport} from '../src/flatex-import.js';
import {prepareFlatexBackfillPreview} from '../src/flatex-backfill.js';
import {importCSV,previewCSV} from '../src/csv-import.js';
import {ledgerQuantityAudit} from '../src/transactions.js';

const ISIN='IE00BK5BQT80';
const file=(lines)=>[{name:'Flatex-Depot.csv',text:[
 'Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Buchungsinformationen;TA-Nr.;Kurs;Depot',
 ...lines].join('\n')}];
const buy='20.10.2026;21.10.2026;'+ISIN+';All World;10;ORDER Kauf;K10;101,00;D1';
const sell='22.10.2026;23.10.2026;'+ISIN+';All World;-3;ORDER Verkauf;V3;102,00;D1';
function portfolio({quantity=7,basis=null,otherQuantity=9}={}){
 const m=blankModel();
 const f=createProvider({name:'Flatex Österreich',type:'broker'});
 const o=createProvider({name:'Fremdbroker',type:'broker'});
 m.providers.push(f,o);
 const a=createAccount({providerId:f.id,name:'Depot',type:'securities'},m);
 const b=createAccount({providerId:o.id,name:'Zweitdepot',type:'securities'},m);
 m.accounts.push(a,b);
 const p=createPosition({providerId:f.id,accountId:a.id,kind:'etf',name:'All World',isin:ISIN,quantity,
  price:123,costBasisEUR:basis},m);
 const q=createPosition({providerId:o.id,accountId:b.id,kind:'etf',name:'All World',isin:ISIN,quantity:otherQuantity,price:123},m);
 m.positions.push(p,q);
 return {m,a,p,q};
}
test('replaces only exact matching observed manual opening with historical journal, atomically',()=>{
 const {m,a,p,q}=portfolio();
 const before=JSON.stringify(m);
 const prepared=prepareFlatexImport(file([buy,sell]));
 const check=prepareFlatexBackfillPreview(m,prepared,a.id);
 assert.equal(check.eligible,true,check.reason);
 assert.equal(check.preview.ready,2);
 assert.equal(check.preview.issues.length,0);
 assert.equal(check.preview.simulated.positions.find(x=>x.id===p.id).quantityExact,'7');
 assert.equal(check.preview.simulated.positions.find(x=>x.id===q.id).quantityExact,'9');
 assert.equal(check.preview.simulated.positions.find(x=>x.id===p.id).costBasisExact,null);
 assert.equal(check.preview.simulated.positions.find(x=>x.id===p.id).realizedPnLExact,null);
 assert.equal(JSON.stringify(m),before,'read-only preview cannot touch user model');
 const imported=importCSV(m,check.preview);
 assert.equal(imported.imported,2);
 assert.equal(m.positions.find(x=>x.id===p.id).quantityExact,'7');
 assert.equal(m.positions.find(x=>x.id===q.id).quantityExact,'9');
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(m.openingPositions.find(x=>x.positionId===p.id).quantityExact,'0');
 assert.equal(m.bookings.length,2);
 assert.equal(m.journalEntries.length,2);
 assert.equal(ledgerQuantityAudit(m).ok,true);
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.positions.find(x=>x.id===p.id).quantityExact,'7');
 assert.equal(restored.positions.find(x=>x.id===p.id).costBasisExact,null);
 assert.equal(restored.journalEntries.length,2);
});
test('same Flatex export cannot be imported twice after historical reconstruction',()=>{
 const {m,a}=portfolio(),prepared=prepareFlatexImport(file([buy,sell]));
 const check=prepareFlatexBackfillPreview(m,prepared,a.id);
 importCSV(m,check.preview);
 const before=JSON.stringify(m);
 const again=previewCSV(m,prepared.parsed,prepared.mapping,{allowedAccountId:a.id});
 assert.equal(again.ready,0);
 assert.equal(again.duplicates,2);
 assert.equal(prepareFlatexBackfillPreview(m,prepared,a.id).eligible,false);
 assert.equal(JSON.stringify(m),before);
});
test('rejects opening mismatch, unknown price basis and existing journal',()=>{
 const {m,a,p}=portfolio();
 const prepared=prepareFlatexImport(file([buy,sell]));
 p.quantityExact='8';p.quantity=8;
 assert.equal(prepareFlatexBackfillPreview(m,prepared,a.id).eligible,false);
 p.quantityExact='7';p.quantity=7;
 p.costBasisExact='500';p.costBasisEUR=500;
 assert.match(prepareFlatexBackfillPreview(m,prepared,a.id).reason,/Anschaffungskosten/);
 p.costBasisExact=null;p.costBasisEUR=null;
 m.bookings.push({id:'legacy',type:'buy',date:'2026-01-01',positionId:p.id,quantity:1});
 assert.match(prepareFlatexBackfillPreview(m,prepared,a.id).reason,/bereits Buchungen/);
});
test('rejects sales occurring before ownership, even if final quantity agrees',()=>{
 const {m,a}=portfolio({quantity:7});
 const prepared=prepareFlatexImport(file([sell,buy]));
 // The prepared rows have actual dates: convert the sale to an earlier date
 prepared.parsed.rows[0].date='2026-01-01';
 assert.equal(prepareFlatexBackfillPreview(m,prepared,a.id).eligible,false);
});
test('refuses skipped bookings and unexplained corporate actions',()=>{
 const {m,a}=portfolio(),prepared=prepareFlatexImport(file([buy,sell]));
 assert.equal(prepareFlatexBackfillPreview(m,prepared,a.id,{skippedLines:[2]}).eligible,false);
 const withSplit=prepareFlatexImport(file([buy,sell,'23.10.2026;24.10.2026;'+ISIN+';ETF;2;Split 1:2;S1;0;D1']));
 assert.equal(prepareFlatexBackfillPreview(m,withSplit,a.id).eligible,false);
});
test('invalidates stale model baseline at commit, leaving original unmodified',()=>{
 const {m,a}=portfolio(),prepared=prepareFlatexImport(file([buy,sell]));
 const check=prepareFlatexBackfillPreview(m,prepared,a.id);
 m.settings.autoRefresh=false;
 const before=JSON.stringify(m);
 assert.throws(()=>importCSV(m,check.preview),/seit der CSV-Vorschau verändert/);
 assert.equal(JSON.stringify(m),before);
});

test('previously documented opening acquisition cost cannot be erased by backfill',()=>{
 const {m,a,p}=portfolio();
 m.openingPositions.push({positionId:p.id,quantityExact:'7',costBasisExact:'900',realizedPnLExact:null,asOf:null});
 const prepared=prepareFlatexImport(file([buy,sell]));
 const result=prepareFlatexBackfillPreview(m,prepared,a.id);
 assert.equal(result.eligible,false);
 assert.match(result.reason,/Anschaffungskosten/);
});
test('an earlier observed positive holding in snapshot prevents inconsistent historical rewrite',()=>{
 const {m,a,p}=portfolio();
 m.snapshots.push({id:'snapshot-1',date:'2026-09-01',total:840,valuationStatus:'observed',byPosition:{[p.id]:'840'}});
 const prepared=prepareFlatexImport(file([buy,sell]));
 const result=prepareFlatexBackfillPreview(m,prepared,a.id);
 assert.equal(result.eligible,false);
 assert.match(result.reason,/älterer Stichtag/);
});
