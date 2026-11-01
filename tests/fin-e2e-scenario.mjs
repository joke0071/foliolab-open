// FIN-E2E01 bounded synthetic scenario. Only production contracts perform mutations.
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR} from '../src/model.js';
import {executeTransaction,confirmTransferMatch,previewTransferMatch,ledgerQuantityAudit} from '../src/transactions.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {prepareBookingChange,prepareBookingUndo,prepareBookingArchive} from '../src/booking-management.js';
import {setPositionArchived} from '../src/portfolio-edit-actions.js';
import {exact,units} from '../src/decimal.js';
export const cashCSV='date,type,position,quantity,price,fee,tax,id\n2026-01-02,interest,a,2,1,0,0,SYN-INTEREST';
export const transferCSV='date,type,position,quantity,price,fee,tax,id\n2026-01-03,withdraw,a,100,1,0,0,SYN-OUT\n2026-01-04,deposit,b,100,1,0,0,SYN-IN';
export const password='Synthetic FIN-E2E01 password!';
export const steps=['import','correct','match','remove','undo','reimport','archive','restore-archive','trade','remove-again','history'];
export function seed(){
 const m=blankModel();m.settings.autoRefresh=false;
 m.providers.push(createProvider({id:'p',name:'Synthetic FIN-E2E01'}));
 for(const id of ['a','b','etf']){
  m.accounts.push(createAccount({id:'account-'+id,providerId:'p',name:'Synthetic '+id,type:id==='etf'?'securities':'checking'},m));
  m.positions.push(createPosition({id,providerId:'p',accountId:'account-'+id,name:'Synthetic '+id,kind:id==='etf'?'etf':'cash',quantity:id==='a'?'1000.000000000000000001':'0',price:id==='etf'?'100':'1'},m));
 }
 executeTransaction(m,{id:'SYN-MANUAL-BOOKING-01',positionId:'a',type:'deposit',date:'2026-01-01',quantity:'10',unitPrice:1});
 m.openingPositions.find(p=>p.positionId==='a').asOf='2025-12-31';
 return m;
}
export function previewFile(m,text){const parsed=parseCSV(text);return previewCSV(m,parsed,inferMapping(parsed.headers));}
export const imported=(m,externalId)=>m.bookings.find(b=>b.importSource?.externalId===externalId);
export const removeRequest=m=>({ids:[imported(m,'SYN-INTEREST').id],action:'remove',reason:'SYN-INTEREST verified synthetic receipt'});
export const correctRequest={ids:['SYN-MANUAL-BOOKING-01'],action:'edit',changes:{quantity:'12',date:'2026-01-05'},reason:'SYN-MANUAL corrected synthetic receipt'};
export function advance(m,step,receipt){
 let next=structuredClone(m),result=null;
 if(step==='import'){importCSV(next,previewFile(next,cashCSV));importCSV(next,previewFile(next,transferCSV));}
 else if(step==='correct'){result=prepareBookingChange(next,correctRequest,{expectedModel:JSON.stringify(next),confirmed:true});next=result.candidate;}
 else if(step==='match'){const out=imported(next,'SYN-OUT'),inc=imported(next,'SYN-IN');confirmTransferMatch(next,{...previewTransferMatch(next,out.id,[inc.id]),confirmed:true,reference:'SYN-TRANSFER own-account receipt'});}
 else if(step==='remove'||step==='remove-again'){result=prepareBookingChange(next,removeRequest(next),{expectedModel:JSON.stringify(next),confirmed:true});next=result.candidate;}
 else if(step==='undo')next=prepareBookingUndo(next,receipt);
 else if(step==='reimport'){importCSV(next,previewFile(next,cashCSV));}
 else if(step==='archive'||step==='restore-archive'){
  next=prepareBookingArchive(next,{ids:[imported(next,'SYN-INTEREST').id],archived:step==='archive'},{expectedModel:JSON.stringify(next),confirmed:true}).candidate;
  setPositionArchived(next,'a',step==='archive');
 }
 else if(step==='trade'){
  executeTransaction(next,{id:'buy',type:'buy',date:'2026-01-06',positionId:'etf',cashPositionId:'a',quantity:'2',unitPrice:'100',feeEUR:'2',taxEUR:'0'});
  executeTransaction(next,{id:'sell',type:'sell',date:'2026-01-07',positionId:'etf',cashPositionId:'a',quantity:'1',unitPrice:'120',feeEUR:'1',taxEUR:'3'});
 }
 else if(step==='history'){
  next.performanceFlowTrackingSince='2025-12-31';
  next.snapshots=[{id:'start',date:'2025-12-31',total:1000,totalEURExact:'1000.000000000000000001',valuationStatus:'manual',source:'manual'},
   {id:'end',date:'2026-01-07',total:1026,totalEURExact:'1026.000000000000000001',valuationStatus:'manual',source:'manual'}];
 }
 else throw Error('Unknown FIN-E2E step '+step);
 return {model:next,receipt:result?.receipt??receipt};
}
export function financialState(m){
 const sum=key=>exact(m.bookings.reduce((n,b)=>n+units(b[key]??0),0n));
 return {quantities:m.positions.map(p=>p.quantityExact),total:totalExactEUR(m),basis:m.positions.find(p=>p.id==='etf').costBasisExact??null,
  realized:m.positions.find(p=>p.id==='etf').realizedPnLExact??null,fees:sum('feeEUR'),taxes:sum('taxEUR'),
  flows:m.externalCashFlows.map(f=>[m.bookings.find(b=>b.id===f.id)?.type,f.amountExactEUR]).sort(),bookings:m.bookings.length,journals:m.journalEntries.length,
  archived:m.bookingPresentation?.archivedIds.length??0,positionArchived:m.positions[0].archived===true,ledger:ledgerQuantityAudit(m).ok};
}
// Independent hand-calculated oracle v1. Never populated from the engine under test.
const initial={quantities:['1010.000000000000000001','0','0'],total:'1010.000000000000000001',basis:null,realized:null,fees:'0',taxes:'0',flows:[['deposit','10']],bookings:1,journals:1,archived:0,positionArchived:false,ledger:true};
const importedState={...initial,quantities:['912.000000000000000001','100','0'],total:'1012.000000000000000001',flows:[['deposit','10'],['deposit','100'],['withdraw','-100']],bookings:4,journals:4};
const corrected={...importedState,quantities:['914.000000000000000001','100','0'],total:'1014.000000000000000001',flows:[['deposit','100'],['deposit','12'],['withdraw','-100']],journals:5};
const matched={...corrected,flows:[['deposit','12']]};
const removed={...matched,quantities:['912.000000000000000001','100','0'],total:'1012.000000000000000001',bookings:3,journals:5};
const traded={...matched,quantities:['828.000000000000000001','100','1'],total:'1028.000000000000000001',basis:'101',realized:'15',fees:'3',taxes:'3',bookings:6,journals:7};
export const oracle={seed:initial,import:importedState,correct:corrected,match:matched,remove:removed,undo:matched,reimport:matched,
 archive:{...matched,archived:1,positionArchived:true},'restore-archive':matched,trade:traded,
 'remove-again':{...traded,quantities:['826.000000000000000001','100','1'],total:'1026.000000000000000001',bookings:5},history:{...traded,quantities:['826.000000000000000001','100','1'],total:'1026.000000000000000001',bookings:5}};
