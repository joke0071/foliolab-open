/** Versioned provenance, not a second journal. Legacy bookings remain untouched. */
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
 return Object.fromEntries(['version','sourceId','accountId','externalId','sourcePayload','ownedSnapshot','fileId','occurrence','ownership'].map(k=>[k,value[k]]));
}
export function sourceUnmodified(model,booking){
 return booking.importSource?.ownership==='imported'&&booking.importSource.ownedSnapshot===bookingOwnership(model,booking);
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
