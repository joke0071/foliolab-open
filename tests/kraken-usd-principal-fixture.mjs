import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
// Entirely invented identifiers, date and 18-decimal amounts. Decimal100 oracle:
// 0.000000000000000005 + 17.000000000000000005 = 17.00000000000000001.
export const usdPrincipalRows=()=>[
 {txid:'INVENTED-USD-OUT',refid:'INVENTED-USD-PRINCIPAL',time:'1999-02-03 12:00:00',type:'earn',subtype:'autoallocation',aclass:'currency',subclass:'fiat',asset:'USD',wallet:'spot / main',amount:'-17.000000000000000005',fee:'0',balance:'0',amountusd:'-17.000000000000000005',feeusd:'0',balanceusd:'0',feecurrency:''},
 {txid:'INVENTED-USD-IN',refid:'INVENTED-USD-PRINCIPAL',time:'1999-02-03 12:00:00',type:'earn',subtype:'autoallocation',aclass:'currency',subclass:'fiat',asset:'USD',wallet:'earn / liquid',amount:'17.000000000000000005',fee:'0',balance:'17.00000000000000001',amountusd:'17.000000000000000005',feeusd:'0',balanceusd:'17.00000000000000001',feecurrency:''}
];
export function usdPrincipalFixture(rows=usdPrincipalRows()){
 const text=krakenCSV(rows),m=blankModel();m.version=5;m.flatexNetRemovals=[];m.settings.autoRefresh=false;m.providers.push(createProvider({id:'synthetic-kraken',name:'Invented Kraken'}));
 for(const [id,wallet,quantity] of [['spot','spot / main','17.000000000000000005'],['earn','earn / liquid','0.000000000000000005']]){
  m.accounts.push(createAccount({id:'usd-'+id,providerId:'synthetic-kraken',name:'USD '+wallet,currency:'USD',type:'exchange'},m));
  m.positions.push(createPosition({id,providerId:'synthetic-kraken',accountId:'usd-'+id,name:'USD '+wallet,kind:'cash',currency:'USD',quantityExact:quantity,price:1},m));
 }
 captureOpenings(m);const assignments={};for(const row of prepareKrakenSourcePlan([text]).observations)assignments[row.streamId]=row.values.wallet==='spot / main'?'spot':'earn';
 return {m,text,assignments,options:{openingConfirmed:true}};
}
