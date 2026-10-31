import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=process.cwd();
const {blankModel,createProvider,createAccount,createPosition,totalExactEUR,safeImport,backup}=await import(root+'/src/model.js');
const {parseCSV,inferMapping,previewCSV,importCSV}=await import(root+'/src/csv-import.js');
const {previewBookingChange}=await import(root+'/src/booking-management.js');
const {executeTransaction,ledgerQuantityAudit}=await import(root+'/src/transactions.js');
const {units,exact}=await import(root+'/src/decimal.js');
let state=20261031;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};const types=['deposit','withdraw','dividend','interest','fee','tax'];let cases=0;
for(const type of types)for(let sample=0;sample<60;sample++){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic oracle'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic oracle',type:'cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'Synthetic EUR',kind:'cash',quantity:10000,price:1},m));
 const quantity=sample===0?'0.000000000000000001':exact(BigInt(1+rand()%500)*10n**12n),csv=parseCSV(`date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId\n2026-01-02,${type},cash,${quantity},1,0,0,1,oracle-${type}-${sample}`);
 importCSV(m,previewCSV(m,csv,inferMapping(csv.headers)));const target=m.bookings[0];let expected=units('10000');
 for(let n=0;n<24;n++) {const kind=types[rand()%types.length],q=exact(BigInt(1+rand()%5000000)*10n**12n);executeTransaction(m,{id:`independent-${n}`,type:kind,date:'2026-01-03',positionId:'cash',quantity:q,unitPrice:1,fxRate:1});expected+=(['deposit','dividend','interest'].includes(kind)?1n:-1n)*units(q);}
 const before=JSON.stringify(m),p=previewBookingChange(m,{ids:[target.id],action:'remove',reason:'Synthetic independent arithmetic oracle'});assert.equal(p.ready,true);assert.equal(totalExactEUR(p.candidate),exact(expected));assert.equal(p.candidate.positions[0].quantityExact,exact(expected));assert.equal(p.candidate.bookings.length,24);assert.equal(ledgerQuantityAudit(p.candidate).ok,true);assert.equal(ledgerQuantityAudit(safeImport(JSON.parse(backup(p.candidate)))).ok,true);assert.equal(JSON.stringify(m),before);cases++;
}
const proof={status:'PASS',cases,types,subsequentEventsPerCase:24,seed:20261031,head:'5ac54b4dc0f77c48ef6ba4e0ce822c8216f08a67',oracle:'Independent signed BigInt sum excluding removed source; exact totals, holdings, surviving event count, ledger, backup/restore and preview immutability',tinyQuantity:'0.000000000000000001',hardwareAcceptance:false};fs.writeFileSync('/tmp/foliolab-v245-reversal-oracle.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
