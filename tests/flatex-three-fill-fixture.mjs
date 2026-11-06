import {fixture} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV,bindNativeFlatexSourceContext,FLATEX_DEPOT13_COLUMNS,FLATEX_ACCOUNT8_COLUMNS} from '../src/flatex-native.js';
import {inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
export const defaultCase={direction:'buy',quantities:['1','2','3'],prices:['10','10','10'],cashExact:'-63',opening:{asset:'20',cash:'1000'}};
export function threeFixture({spec=defaultCase,reverse=false,context=false}={}){
 const f=fixture(),details='ORDER '+(spec.direction==='buy'?'Kauf':'Verkauf')+' IE00SYNTH001 993',decimal=s=>s.replace('.',',');
 const rows=spec.quantities.map((q,i)=>({1:'04.01.1999',2:'06.01.1999',5:(spec.direction==='sell'?'-':'')+decimal(q),9:decimal(spec.prices[i]),8:'SYN-THREE-FILL-'+i,7:details}));
 f.files=[{name:'flatex-depot.csv',text:nativeFlatexCSV('depot',rows)},{name:'flatex-cash.csv',text:nativeFlatexCSV('account',[{0:'04.01.1999',1:'06.01.1999',6:decimal(spec.cashExact),5:'SYN-THREE-CASH',4:details}])}];
 f.documents=f.files.map(file=>parseFlatexNativeCSV(file.text));
 if(context)f.documents=f.documents.map(doc=>{
  const depot=doc.type==='depot',columns=depot?FLATEX_DEPOT13_COLUMNS:FLATEX_ACCOUNT8_COLUMNS;
  const rows=doc.rows.map(({values:v,numbers:n},i)=>depot?[v.bookingDate,v.valueDate,v.description,v.isin,v.nominal,'Stück',decimal((spec.direction==='buy'?'-':'')+(spec.members?.[i].grossExact??['10','20','30'][i])),'EUR',v.rate,v.priceCurrency,'1',v.transactionReference,v.details]:[v.bookingDate,v.valueDate,'Synthetic recipient','Synthetic payer',v.transactionReference,v.details,v.amount,v.amountCurrency]);
  const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
  const text=[columns.map(c=>quote(c.header)).join(';'),...rows.map(r=>r.map(quote).join(';'))].join('\n');
  f.files[depot?0:1].text=text;
  return bindNativeFlatexSourceContext(parseFlatexNativeCSV(text),{scope:depot?'SYN-THREE-DEPOT':'SYN-THREE-CASH',confirmed:true});
 });
 if(reverse){f.documents.reverse();f.files.reverse();}
 for(const [i,key]of [[0,'asset'],[1,'cash']]){f.model.positions[i].quantity=Number(spec.opening[key]);f.model.positions[i].quantityExact=spec.opening[key];}
 f.assignments={};f.inspection=inspectFlatexNetPairs(f.documents);
 for(const r of f.inspection.identities.rows)f.assignments[r.sourceId]={accountId:r.sourceType==='depot'?'d':'c'};
 for(const c of reviewNativeFlatexBindings(f.model,f.inspection.identities,f.assignments).contexts)Object.assign(f.assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});
 f.options.selectedIds=f.inspection.pairs.map(p=>p.id);return f;
}
