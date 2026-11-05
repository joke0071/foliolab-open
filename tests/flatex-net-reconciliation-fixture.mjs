import {fixture,laterDocuments,nativeBatchDocuments} from './flatex-net-fixture.mjs';
import {contextDocuments} from './flatex-context-fixture.mjs';
import {inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {flatexReconciliationScope} from '../src/flatex-net-reconciliation.js';
import {importCSV} from '../src/csv-import.js';
import {snapshot} from '../src/model.js';
export function reconciliationFixture({context=false,earlier=false}={}){
 const f=fixture(),convert=docs=>context?contextDocuments(docs):docs;
 function bind(documents){const inspection=inspectFlatexNetPairs(documents),assignments={};for(const r of inspection.identities.rows)assignments[r.sourceId]={accountId:r.sourceType==='depot'?'d':'c'};for(const c of reviewNativeFlatexBindings(f.model,inspection.identities,assignments).contexts)Object.assign(assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});return {inspection,assignments};}
 const first=convert(earlier?laterDocuments():f.documents),initial=bind(first),p=prepareNativeFlatexPreview(f.model,first,initial.assignments,{...f.options,selectedIds:initial.inspection.pairs.map(p=>p.id),mode:'net'});if(!p.eligible)throw Error(p.reason);importCSV(f.model,p.preview);
 f.documents=convert(earlier?[...fixture().documents,...laterDocuments()]:nativeBatchDocuments());
 const b=bind(f.documents);f.assignments=b.assignments;const selectedIds=b.inspection.pairs.map(p=>p.id),scope=flatexReconciliationScope(f.model,b.inspection,f.assignments,selectedIds);
 const end=earlier?{etf:['3','10','30'],cash:['66','1','66']}:{etf:['1','10','10'],cash:['90','1','90']},start={etf:['0','10','0'],cash:['100','1','100']};
 snapshot(f.model);const s=f.model.snapshots[0];s.byPosition={etf:end.etf[2],cash:end.cash[2]};s.byAccount={d:Number(end.etf[2]),c:Number(end.cash[2])};s.total=Number(end.etf[2])+Number(end.cash[2]);s.totalEURExact=String(s.total);
 const observations=[];for(const role of ['opening','closing','reference'])for(const id of scope.ids){const v=role==='opening'?start[id]:end[id],pos=f.model.positions.find(p=>p.id===id);observations.push({role,snapshotId:role==='reference'?s.id:null,date:role==='opening'?'1999-01-01':s.date,positionId:id,accountId:pos.accountId,sourceId:scope.sourceIds[id],sourceReference:'SYNTHETIC independent '+role+' '+id,quantityExact:v[0],priceExact:v[1],valueEURExact:v[2],currency:'EUR'});}
 f.options={mode:'net-reconcile',selectedIds,observations,confirmed:true};f.expected=end;return f;
}
