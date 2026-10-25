import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
export function historyFixture(){
 let m=blankModel();const provider=createProvider({name:'Synthetic Broker',type:'broker'});m.providers.push(provider);
 const a=createAccount({providerId:provider.id,name:'Depot A',type:'securities'},m),b=createAccount({providerId:provider.id,name:'Depot B',type:'securities'},m);m.accounts.push(a,b);
 for(let i=0;i<4;i++)m.positions.push(createPosition({providerId:provider.id,accountId:a.id,name:'Synthetic ETF '+i+' langes Instrument zur Prüfung schmaler Ansichten',kind:'etf',symbol:'SYN'+i,quantity:0,price:100,currency:'EUR'},m));
 const ids=m.positions.map(p=>p.id);
 for(let i=0;i<245;i++){
  const date=new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10);
  executeTransaction(m,{id:'trade-'+i,type:'buy',date,positionId:ids[i%4],quantity:'1',unitPrice:'100',notes:i===0?'Beleg <script> & lange Quellinformation':'Synthetischer Beleg'});
 }
 for(let i=0;i<4;i++)executeTransaction(m,{id:'correction-'+i,type:'correction',date:'2026-01-01',positionId:ids[i],targetQuantity:String(m.positions.find(p=>p.id===ids[i]).quantity+2)});
 return {model:m,ids,accountB:b};
}
