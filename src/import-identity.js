/** Versioned provenance, not a second journal. Legacy bookings remain untouched. */
export function importSourceKey(source){
 return source?.externalId?JSON.stringify([source.sourceId,source.accountId,source.externalId]):null;
}
export function bookingOwnership(model,booking){
 const fields=['date','type','positionId','accountId','quantityExact','quantity','unitPrice','feeEUR','taxEUR','fxRate','amountExactEUR','amountEUR','targetPositionId','cashPositionId','notes'];
 const entry=model.journalEntries?.find(e=>e.id===booking.journalEntryId);
 return JSON.stringify([fields.map(k=>booking[k]??null),entry??null]);
}
export function validateImportSource(value,accountId){
 if(value==null)return undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||
    !['imported','manual'].includes(value.ownership))throw Error('Ungültige Importherkunft im Backup.');
 const limits={sourceId:120,accountId:120,externalId:200,sourcePayload:4000,ownedSnapshot:20000,fileId:200};
 for(const [key,max] of Object.entries(limits)){
  if(typeof value[key]!=='string'||value[key].length>max||/[\u0000-\u001f]/.test(value[key]))throw Error('Ungültige Importherkunft: '+key);
 }
 if(!value.sourceId||!value.accountId||value.accountId!==accountId||!value.sourcePayload||!value.ownedSnapshot||
    !Number.isSafeInteger(value.occurrence)||value.occurrence<1)throw Error('Importherkunft passt nicht zur Buchung.');
 return Object.fromEntries(['version','sourceId','accountId','externalId','sourcePayload','ownedSnapshot','fileId','occurrence','ownership'].map(k=>[k,value[k]]));
}
export function sourceUnmodified(model,booking){
 return booking.importSource?.ownership==='imported'&&booking.importSource.ownedSnapshot===bookingOwnership(model,booking);
}
