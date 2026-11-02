import {bitpandaCSV} from './bitpanda-fixture.mjs';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {prepareBitpandaSourcePlan} from '../src/bitpanda-import.js';
export const source=()=>bitpandaCSV([
 {'Transaction ID':'SYN-BUY','Transaction Type':'buy','In/Out':'outgoing','Amount Asset':'3','Amount Fiat':'101',Asset:'ETH','Asset market price':'99999',Fee:'1','Fee asset':'EUR','Product ID':'SYN-ETH'},
 {'Transaction ID':'SYN-REWARD',Timestamp:'1999-01-03T12:00:00+01:00','Transaction Type':'reward','In/Out':'incoming','Amount Asset':'0.1','Amount Fiat':'4',Asset:'ETH','Asset market price':'22',Fee:'-','Fee asset':'-','Product ID':'SYN-ETH',omitTax:true}
]);
export function fixture(text=source()){
 const m=blankModel(),provider=createProvider({id:'bitpanda',name:'Synthetic Bitpanda'});m.providers.push(provider);
 const assignments={},feeModes={},expectedClosing={},streams=new Map();
 for(const r of prepareBitpandaSourcePlan([text]).groups){streams.set(r.streamId,{asset:r.asset,cash:r.values['Asset class']==='Fiat'});if(r.cashStreamId)streams.set(r.cashStreamId,{asset:r.values.Fiat,cash:true});if(r.numbers.Fee!==null&&Number(r.numbers.Fee)>0)feeModes[r.id]='included';}
 for(const [key,s]of streams){const id='bp'+Object.keys(assignments).length,a=createAccount({id:'a'+id,providerId:provider.id,name:s.asset,type:s.cash?'checking':'crypto'},m);m.accounts.push(a);m.positions.push(createPosition({id,providerId:provider.id,accountId:a.id,name:s.asset,symbol:s.asset,coinId:s.cash?'':'ethereum',kind:s.cash?'cash':'crypto',currency:'EUR',quantity:s.cash?'200':'0',price:1},m));assignments[key]=id;expectedClosing[id]=s.cash?'99':'3.1';}
 captureOpenings(m);return {m,assignments,options:{netConfirmed:true,openingConfirmed:true,feeModes,expectedClosing}};
}
