import {parseFlatexNativeCSV,bindNativeFlatexSourceContext,FLATEX_DEPOT13_COLUMNS,FLATEX_ACCOUNT8_COLUMNS} from '../src/flatex-native.js';
import {fixture} from './flatex-net-fixture.mjs';
import {inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
export const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
export function contextDocuments(documents,{bound=true}={}){
 return documents.map(doc=>{
  const depot=doc.type==='depot',columns=depot?FLATEX_DEPOT13_COLUMNS:FLATEX_ACCOUNT8_COLUMNS;
  const rows=doc.rows.map(({values:v})=>depot?[v.bookingDate,v.valueDate,v.description,v.isin,v.nominal,'Stück','20','EUR',v.rate,v.priceCurrency,'1',v.transactionReference,v.details]:[v.bookingDate,v.valueDate,'Synthetic recipient','Synthetic payer',v.transactionReference,v.details,v.amount,v.amountCurrency]);
  const d=parseFlatexNativeCSV([columns.map(c=>quote(c.header)).join(';'),...rows.map(r=>r.map(quote).join(';'))].join('\n'));
  return bound?bindNativeFlatexSourceContext(d,{scope:depot?'SYN-DECLARED-DEPOT':'SYN-DECLARED-CASH',confirmed:true}):d;
 });
}
export function contextFixture(){
 const f=fixture();f.documents=contextDocuments(f.documents);f.inspection=inspectFlatexNetPairs(f.documents);f.assignments={};
 for(const r of f.inspection.identities.rows)f.assignments[r.sourceId]={accountId:r.sourceType==='depot'?'d':'c'};
 for(const c of reviewNativeFlatexBindings(f.model,f.inspection.identities,f.assignments).contexts)Object.assign(f.assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});
 f.options.selectedIds=f.inspection.pairs.map(p=>p.id);return f;
}
