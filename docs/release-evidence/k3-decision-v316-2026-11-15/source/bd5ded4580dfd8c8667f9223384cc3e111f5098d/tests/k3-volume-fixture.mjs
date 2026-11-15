import {k3SelectionFixture} from './k3-selection-fixture.mjs';
import {createPosition,safeImport,totalExactEUR} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
export function k3VolumeFixture(category){
 const m=k3SelectionFixture(category).model,count=category==='positions'?5000:10000;
 const id=i=>({positions:'p',bookings:'b',references:'r'}[category])+String(i).padStart(5,'0');
 const date=i=>new Date(Date.UTC(1990,0,i+1)).toISOString().slice(0,10);delete m.bookingPresentation;
 if(category==='positions'){
  m.positions=[];
  for(let i=0;i<count;i++)m.positions.push(createPosition({id:id(i),providerId:'provider',accountId:i%2?'b':'a',name:'SYNTHETIC volume '+String(i).padStart(5,'0'),kind:'cash',quantity:2,price:1,...(i<3?{archived:true}:{})},m));
 }
 if(category==='references'){
  const template=structuredClone(m.snapshots[0]);m.snapshots=Array.from({length:count},(_,i)=>({...structuredClone(template),id:id(i),date:date(i),note:'SYNTHETIC reference '+i}));m.bookingPresentation={version:2,archivedIds:[],referenceArchivedIds:[id(0),id(1),id(2)]};
 }
 if(category==='bookings'){
  const templates=[0,1].map(i=>{const b=m.bookings.find(x=>x.id==='b00'+i);return {b,e:m.journalEntries.find(e=>e.id===b.journalEntryId)};});m.bookings=[];m.journalEntries=[];m.externalCashFlows=[];
  for(let i=0;i<count;i++){const t=templates[i%2],booking={...structuredClone(t.b),id:id(i),date:date(i),journalEntryId:id(i),notes:'SYNTHETIC booking '+i},entry={...structuredClone(t.e),id:id(i),date:date(i),sequence:i+1};entry.postings.forEach((p,j)=>p.id=id(i)+'-posting-'+j);m.bookings.push(booking);m.journalEntries.push(entry);m.externalCashFlows.push({id:id(i),date:date(i),amountEUR:1,amountExactEUR:'1'});}
  for(const p of m.positions){p.quantity=5100;p.quantityExact='5100';}m.bookingPresentation={version:1,archivedIds:[id(0),id(1),id(2)]};
 }
 const normalized=safeImport(m),total={positions:'10000',bookings:'10200',references:'100'}[category];
 if(totalExactEUR(normalized)!==total)throw Error('Volume total oracle mismatch');if(category==='bookings'&&!ledgerQuantityAudit(normalized).ok)throw Error('Volume ledger oracle mismatch');
 let oversizedPositionRejection=null;
 if(category==='positions'){const invalid=structuredClone(normalized);invalid.positions=Array.from({length:10000},(_,i)=>({...structuredClone(normalized.positions[0]),id:'too-many-'+i}));try{safeImport(invalid);throw Error('Unexpected 10000-position acceptance');}catch(e){if(!/Größenlimits/.test(e.message))throw e;oversizedPositionRejection=e.message;}}
 return {model:normalized,expected:{count,active:count-3,total,oversizedPositionRejection}};
}
