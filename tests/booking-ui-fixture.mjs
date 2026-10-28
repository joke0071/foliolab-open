import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {prepareCSVBatch} from '../src/csv-batch.js';
import {previewCSV,inferMapping,importCSV} from '../src/csv-import.js';
export const syntheticBookingCSV='date,type,position,quantity,price,id\n2025-01-03,deposit,cash-a,5,1,import-1';
export function bookingUIFixture(){
 const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'Synthetic booking provider'}));
 for(const id of ['a','b']){m.accounts.push(createAccount({id:'account-'+id,providerId:'p',name:'Account '+id,type:'checking'},m));m.positions.push(createPosition({id:'cash-'+id,providerId:'p',accountId:'account-'+id,name:'Cash '+id,kind:'cash',quantity:1000,price:1},m));}
 for(let i=0;i<247;i++)executeTransaction(m,{id:'manual-'+String(i).padStart(3,'0'),type:'deposit',positionId:'cash-'+(i%2?'b':'a'),date:'2025-01-01',quantity:1,unitPrice:1,notes:'Synthetic manual '+i});
 const batch=prepareCSVBatch([{name:'synthetic.csv',text:syntheticBookingCSV}]);importCSV(m,previewCSV(m,batch.parsed,inferMapping(batch.parsed.headers)));
 executeTransaction(m,{id:'technical',type:'correction',positionId:'cash-b',date:'2025-01-04',quantity:1125,unitPrice:1});
 return m;
}
