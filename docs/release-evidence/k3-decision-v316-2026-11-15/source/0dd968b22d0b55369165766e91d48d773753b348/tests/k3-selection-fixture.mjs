import {blankModel,createProvider,createAccount,createPosition,snapshot,safeImport,totalExactEUR} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {prepareBookingArchive} from '../src/booking-management.js';
import {prepareReferenceArchive} from '../src/reference-management.js';

// Existing parity/booking/archive fixture APIs; independent fixed economic oracle.
export function k3SelectionFixture(category){
 let m=blankModel();m.settings.autoRefresh=false;
 m.providers.push(createProvider({id:'provider',name:'SYNTHETIC K3'}));
 for(const id of ['a','b'])m.accounts.push(createAccount({id,providerId:'provider',name:'SYNTHETIC account '+id,type:'checking'},m));
 const cash=id=>createPosition({id,providerId:'provider',accountId:id==='cash-b'?'b':'a',name:'SYNTHETIC cash '+id,kind:'cash',quantity:100,price:1},m);
 if(category==='bookings')m.positions.push(cash('cash-a'),cash('cash-b'));
 if(category==='references')m.positions.push(cash('cash-a'));
 const prefix={positions:'p',bookings:'b',references:'r'}[category],id=i=>prefix+String(i).padStart(3,'0');
 for(let i=0;i<104;i++){
  const date=new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10),label='SYNTHETIC '+(i<3?'Other ':'Wanted ')+String(i).padStart(3,'0');
  if(category==='positions')m.positions.push(createPosition({id:id(i),providerId:'provider',accountId:i%2?'b':'a',name:label,kind:'cash',quantity:2,price:1,notes:'SYNTHETIC original',...(i<3?{archived:true}:{})},m));
  if(category==='bookings')executeTransaction(m,{id:id(i),positionId:i%2?'cash-b':'cash-a',type:'deposit',date,quantity:1,unitPrice:1,notes:label});
  if(category==='references'){snapshot(m,date,label,{manualTotalEUR:'100'});m.snapshots.find(s=>s.date===date).id=id(i);}
 }
 const already=[id(0),id(1),id(2)];
 if(category==='bookings')m=prepareBookingArchive(m,{ids:already,archived:true},{expectedModel:JSON.stringify(m),confirmed:true}).candidate;
 if(category==='references')m=prepareReferenceArchive(m,{ids:already,archived:true},{expectedModel:JSON.stringify(m),confirmed:true});
 m=safeImport(m);
 const total={positions:'208',bookings:'304',references:'100'}[category];
 if(totalExactEUR(m)!==total)throw Error('Fixture economic oracle mismatch');
 return {model:m,expected:{category,total,selected:[id(103),id(3)],rowTarget:id(1),initialArchived:already,newNote:'SYNTHETIC independently reviewed',count:104}};
}
