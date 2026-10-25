import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
export function transferFixture({currency='EUR',split=true}={}){
 const m=blankModel();m.settings.autoRefresh=false;
 const p=createProvider({name:'Synthetic Bank A',type:'bank'}),q=createProvider({name:'Synthetic Bank B',type:'bank'});m.providers.push(p,q);
 for(let i=0;i<3;i++){const providerId=i===0?p.id:q.id,a=createAccount({providerId,name:'Konto '+i,type:'savings',currency},m);m.accounts.push(a);m.positions.push(createPosition({providerId,accountId:a.id,name:'Guthaben '+i,kind:'cash',currency,quantity:i===0?'1000':'0',price:1},m));}
 executeTransaction(m,{id:'out',type:'withdraw',date:'2026-01-01',positionId:m.positions[0].id,quantity:'100',fxRate:'0.9'});
 executeTransaction(m,{id:'in',type:'deposit',date:'2026-01-02',positionId:m.positions[1].id,quantity:split?'60':'100',fxRate:'0.91'});
 if(split)executeTransaction(m,{id:'in2',type:'deposit',date:'2026-01-03',positionId:m.positions[2].id,quantity:'40',fxRate:'0.92'});
 return m;
}
