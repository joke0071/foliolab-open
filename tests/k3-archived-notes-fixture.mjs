// The existing booking-unknown-costs fixture, with the existing archive API.
// Synthetic data only; independent expected values are stated below.
import {blankModel,createProvider,createAccount,createPosition,safeImport,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';
import {prepareBookingArchive} from '../src/booking-management.js';

export function k3ArchivedNotesFixture(){
 const model=blankModel();model.settings.autoRefresh='off';
 model.providers.push(createProvider({id:'p',name:'SYNTHETIC K3 broker'}));
 model.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC K3 cash'},model));
 model.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'SYNTHETIC K3 cash',kind:'cash',quantity:100,price:1},model));
 const booking=executeTransaction(model,{id:'booking-a',positionId:'cash',type:'deposit',quantity:20,date:'2026-01-02',unitPrice:1,fxRate:1,notes:'SYNTHETIC original note'});
 model.openingPositions[0].asOf='2026-01-01';
 booking.feeEUR=null;booking.taxEUR=null;
 const {candidate}=prepareBookingArchive(model,{ids:[booking.id],archived:true},{expectedModel:JSON.stringify(model),confirmed:true});
 const fixture=safeImport(candidate);
 if(totalExactEUR(fixture)!=='120'||!ledgerQuantityAudit(fixture).ok)throw Error('Invalid K3 fixture');
 return {model:fixture,expected:{bookingId:'booking-a',positionId:'cash',quantityExact:'120',totalEURExact:'120',externalFlowExact:'20',feeEUR:null,taxEUR:null,archivedIds:['booking-a'],originalNote:'SYNTHETIC original note',newNote:'SYNTHETIC receipt checked'}};
}
