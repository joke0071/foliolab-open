import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {parseCSV,inferMapping,previewCSV} from '../src/csv-import.js';
export function fixture(){
 const m=blankModel(),provider=createProvider({name:'Synthetic broker'});m.providers.push(provider);
 for(const name of ['A','B']){const a=createAccount({providerId:provider.id,name,type:'checking'},m);m.accounts.push(a);m.positions.push(createPosition({providerId:provider.id,accountId:a.id,name:'Cash '+name,symbol:name,kind:'cash',quantity:0,price:1},m));}
 return m;
}
export const csv=(id='tx-1',quantity='100',position='A')=>parseCSV(`date;type;position;quantity;price;id\n2025-01-01;deposit;${position};${quantity};1;${id}`);
export const preview=(m,p)=>previewCSV(m,p,inferMapping(p.headers));
