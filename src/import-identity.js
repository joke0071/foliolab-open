/** Versioned provenance, not a second journal. Legacy bookings remain untouched. */
import {units} from './decimal.js';
import {FLATEX_NATIVE_COLUMNS} from './flatex-native.js';
const nativeReference=v=>typeof v==='string'&&v.trim()!==''&&v.trim()!=='-'&&v.length<=200&&!/[\u0000-\u001f\u007f-\u009f]/.test(v);
/** Reserved optional evidence inside the existing sourcePayload, not a new schema. */
export function validateNativeSourceEvidence(source){
 const native=typeof source?.sourceId==='string'&&source.sourceId.startsWith('flatex-native-'),v=source?.sourceEvidence;
 if(!native){if(v!==undefined)throw Error('Native Quellevidenz benötigt ihren eigenen Namespace.');return undefined;}
 if(!/^flatex-native-v1:(depot|account):[a-f0-9]{64}$/.test(source.sourceId)||!nativeReference(source.externalId)||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='payloadDigest,version'||v.version!==1||typeof v.payloadDigest!=='string'||!/^[a-f0-9]{64}$/.test(v.payloadDigest))throw Error('Native Quellidentität oder Quellevidenz ungültig.');
 return {version:1,payloadDigest:v.payloadDigest};
}
export function importSourceKey(source){
 return source?.externalId?JSON.stringify([source.sourceId,source.accountId,source.externalId]):null;
}
export function bookingOwnership(model,booking){
 const fields=['date','type','positionId','accountId','quantityExact','quantity','unitPrice','feeEUR','taxEUR','fxRate','amountExactEUR','amountEUR','targetPositionId','cashPositionId','notes','costsVerified'];
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
 let sourceEvidence;try{sourceEvidence=JSON.parse(value.sourcePayload)?.sourceEvidence;}catch{}
 validateNativeSourceEvidence({...value,sourceEvidence});
 return Object.fromEntries(['version','sourceId','accountId','externalId','sourcePayload','ownedSnapshot','fileId','occurrence','ownership'].map(k=>[k,value[k]]));
}
export function sourceUnmodified(model,booking){
 return booking.importSource?.ownership==='imported'&&booking.importSource.ownedSnapshot===bookingOwnership(model,booking);
}

/** Pure native source offers. No account binding, deduplication or financial rows. */
export function inspectNativeFlatexSourceIdentities(documents){
 if(!Array.isArray(documents)||!documents.length||documents.length>20||documents.some(d=>d?.kind!=='flatex-native-document-preview'||d.version!==1||!Object.isFrozen(d)||d.ready!==false||d.writeEnabled!==false||!Array.isArray(d.rows)||!Object.isFrozen(d.rows)||!FLATEX_NATIVE_COLUMNS[d.type]))throw Error('Native Flatex-Quelldokumente fehlen oder sind ungeprüft.');
 const total=documents.reduce((n,d)=>n+d.rows.length,0);if(!total||total>5000)throw Error('Native Quellidentität benötigt 1 bis maximal 5.000 Zeilen.');
 const rows=[],keys=new Map();
 for(const [sourceIndex,d]of documents.entries()){
  const columns=FLATEX_NATIVE_COLUMNS[d.type],lines=new Set();
  if(!Array.isArray(d.columns)||d.columns.length!==columns.length||columns.some((c,i)=>d.columns[i]?.key!==c.key||d.columns[i]?.header!==c.header||d.columns[i]?.index!==i))throw Error('Native Flatex-Quellspalten ungeprüft.');
  for(const r of d.rows){
   if(!Number.isSafeInteger(r?.line)||r.line<2||lines.has(r.line)||!Object.isFrozen(r)||!Object.isFrozen(r.values)||!Array.isArray(r.fields)||!Object.isFrozen(r.fields)||r.fields.length!==columns.length||!Array.isArray(r.issues)||!Object.isFrozen(r.issues)||r.issues.some(i=>typeof i!=='string')||Object.keys(r.values).length!==columns.length||columns.some((c,i)=>typeof r.values[c.key]!=='string'||r.values[c.key]!==r.fields[i])||(r.order!==null&&typeof r.order?.reference!=='string'))throw Error('Native Flatex-Quellzeile nicht eindeutig prüfbar.');
   lines.add(r.line);const v=r.values,sourceScope=d.type==='depot'?v.depot:v.account,bankReference=v.transactionReference;
   const sourceId=nativeReference(sourceScope)?'flatex-native-v1:'+d.type+':'+sourceDigest(JSON.stringify(sourceScope)):null;
   const externalId=nativeReference(bankReference)?bankReference:null;
   const payloadDigest=sourceDigest(JSON.stringify(columns.filter(c=>c.key!=='number').map(c=>[c.key,v[c.key]])));
   const entry={sourceIndex,line:r.line,sourceType:d.type,sourceScope,bankReference,orderReference:r.order?.reference??null,sourceId,externalId,payloadDigest,status:'source-review',identity:null,reasons:[...r.issues]};rows.push(entry);
   if(!sourceId||!externalId)entry.reasons.push('Quellkontext oder Bankreferenz fehlt oder ist ungeklärt; kein Ersatzschlüssel.');
   else{const key=JSON.stringify([sourceId,externalId]),list=keys.get(key)||[];list.push(entry);keys.set(key,list);}
  }
 }
 for(const list of keys.values()){
  const conflict=new Set(list.map(r=>r.payloadDigest)).size>1;
  for(const r of list){
   if(conflict){r.status='conflict';r.reasons.unshift('Dieselbe Quellidentität enthält geänderte Originalfelder.');}
   else if(list.length>1){r.status='overlap-review';r.reasons.unshift('Mehrere Vorkommen derselben Quelle; alle Zeilen bleiben erhalten.');}
   else if(!r.reasons.length){r.status='candidate-source';r.identity={sourceId:r.sourceId,externalId:r.externalId,sourceEvidence:{version:1,payloadDigest:r.payloadDigest},costsVerified:false};}
  }
 }
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
 return freeze({kind:'flatex-native-source-identities',version:1,ready:false,writeEnabled:false,rows,note:'Quellenidentitäten ohne Kontobindung, Authentizitätsnachweis, Finanzmapping, Deduplizierung oder Importfreigabe.'});
}

// SHA-256 of canonical parsed source data. Synchronous to preserve the existing
// side-effect-free preview API. No source document is persisted or uploaded.
const primes=[];
for(let n=2;primes.length<64;n++)if(!primes.some(p=>p*p<=n&&n%p===0))primes.push(n);
const initial=primes.slice(0,8).map(p=>(Math.sqrt(p)*2**32)>>>0);
const constants=primes.map(p=>(Math.cbrt(p)*2**32)>>>0);
const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
export function sourceDigest(text){
 const bytes=new TextEncoder().encode(text),length=Math.ceil((bytes.length+9)/64)*64;
 const padded=new Uint8Array(length);padded.set(bytes);padded[bytes.length]=128;
 const data=new DataView(padded.buffer);data.setUint32(length-4,bytes.length*8);data.setUint32(length-8,Math.floor(bytes.length/2**29));
 const hash=[...initial],w=new Uint32Array(64);
 for(let offset=0;offset<length;offset+=64){
  for(let i=0;i<16;i++)w[i]=data.getUint32(offset+4*i);
  for(let i=16;i<64;i++){
   const a=w[i-15],b=w[i-2];
   w[i]=(w[i-16]+(rotate(a,7)^rotate(a,18)^(a>>>3))+w[i-7]+(rotate(b,17)^rotate(b,19)^(b>>>10)))>>>0;
  }
  let [a,b,c,d,e,f,g,h]=hash;
  for(let i=0;i<64;i++){
   const t1=(h+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+constants[i]+w[i])>>>0;
   const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
   h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  [a,b,c,d,e,f,g,h].forEach((v,i)=>hash[i]=(hash[i]+v)>>>0);
 }
 return hash.map(n=>n.toString(16).padStart(8,'0')).join('');
}

/** Narrow provenance proof for removal, never permission to edit or import.
 * Native/broker/wallet and legacy identities require their own evidence contract.
 */
export function provenCashImport(booking,journal){
 try{
  const s=validateImportSource(booking.importSource,booking.accountId);
  if(!s||Object.keys(booking.importSource).some(k=>!Object.hasOwn(s,k))||s.sourceId!=='generic-csv'||!s.externalId||!s.fileId||s.occurrence!==1||journal.source!=='csv'||
   !sourceUnmodified({journalEntries:[journal]},booking)||
   !['deposit','withdraw','dividend','interest','fee','tax'].includes(booking.type))return false;
  const r=JSON.parse(s.sourcePayload),keys='type date positionId quantity unitPrice feeEUR taxEUR fxRate cashPositionId notes externalId'.split(' ');
  if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k))||r.externalId!==s.externalId||
   r.type!==booking.type||r.date!==booking.date||r.positionId!==booking.positionId||r.notes!==(booking.notes||'')||r.cashPositionId||booking.cashPositionId||
   units(r.quantity)<=0n||units(r.quantity)!==units(booking.quantityExact)||units(r.unitPrice)!==units(1)||units(booking.unitPrice)!==units(1)||
   units(r.feeEUR)!==0n||units(r.taxEUR)!==0n||units(r.fxRate)!==units(1))return false;
  const q=units(r.quantity),sign=['deposit','dividend','interest'].includes(booking.type)?1n:-1n;
  const own=journal.postings?.filter(p=>p.positionId===booking.positionId),other=journal.postings?.filter(p=>p.positionId==null);
  const role=['deposit','withdraw'].includes(booking.type)?'external-clearing':['fee','tax'].includes(booking.type)?booking.type:'income';
  if(journal.id!==booking.journalEntryId||journal.type!==booking.type||journal.date!==booking.date||journal.status!=='recorded'||journal.cashPositionId||
   booking.external!==['deposit','withdraw'].includes(booking.type)||booking.targetPositionId||booking.transferMatch||
   units(booking.quantity)!==q||units(booking.amountExactEUR)!==q||units(booking.amountEUR)!==q||units(booking.feeEUR)!==0n||units(booking.taxEUR)!==0n||units(booking.fxRate)!==units(1)||
   journal.postings.length!==2||own.length!==1||other.length!==1||own[0].role!=='cash'||own[0].accountId!==booking.accountId||
   units(own[0].quantityDeltaExact)!==sign*q||units(own[0].amountBookEURExact)!==sign*q||other[0].role!==role||other[0].quantityDeltaExact!=null||other[0].accountId!=null||units(other[0].amountBookEURExact)!==-sign*q)return false;
  const fingerprint=JSON.stringify([r.date,r.type,r.positionId,r.quantity,r.unitPrice,r.feeEUR,r.taxEUR,r.fxRate,r.externalId]);
  return booking.importFingerprint===fingerprint;
 }catch{return false;}
}
/** Retained removal evidence prevents a later CSV from silently resurrecting it. */
export function removedImportSources(model){
 return (model.journalEntries||[]).filter(j=>j.type==='booking-management-audit'&&j.managementAudit?.version===2&&j.managementAudit.action==='remove')
  .flatMap(j=>j.managementAudit.originals.filter(o=>provenCashImport(o.booking,o.journal)).map(o=>o.booking.importSource));
}
