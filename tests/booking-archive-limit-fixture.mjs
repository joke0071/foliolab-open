import {blankModel,createProvider,createAccount,createPosition,safeImport,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';

export function bookingArchiveLimitFixture(){
 const m=blankModel();m.settings.autoRefresh=false;
 m.providers.push(createProvider({id:'limit-provider',name:'SYNTHETIC archive limit'}));
 m.accounts.push(createAccount({id:'limit-account',providerId:'limit-provider',name:'SYNTHETIC cash account',type:'checking'},m));
 m.positions.push(createPosition({id:'limit-cash',providerId:'limit-provider',accountId:'limit-account',name:'SYNTHETIC cash',kind:'cash',quantity:100,price:1},m));
 const booking=executeTransaction(m,{id:'limit-template',positionId:'limit-cash',date:'2020-01-01',type:'deposit',quantity:1,unitPrice:1}),entry=m.journalEntries.find(e=>e.id===booking.journalEntryId);
 m.bookings=[];m.journalEntries=[];m.externalCashFlows=[];
 for(let i=0;i<5001;i++){const id='limit-'+String(i).padStart(5,'0');m.bookings.push({...structuredClone(booking),id,journalEntryId:id,notes:'SYNTHETIC archive limit '+i});const journal={...structuredClone(entry),id,sequence:i+1};journal.postings.forEach((p,j)=>p.id=id+'-posting-'+j);m.journalEntries.push(journal);m.externalCashFlows.push({id,date:'2020-01-01',amountEUR:1,amountExactEUR:'1'});}
 m.positions[0].quantity=5101;m.positions[0].quantityExact='5101';
 const model=safeImport(m);if(totalExactEUR(model)!=='5101'||!ledgerQuantityAudit(model).ok)throw Error('Independent archive-limit fixture oracle failed');
 return model;
}
