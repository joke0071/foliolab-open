// Watch-only BIP32 public derivation for account-level xpub/ypub/zpub (mainnet).
// No private keys, signing or mnemonic handling. Uses browser WebCrypto SHA/HMAC.
const ABC='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const P=(1n<<256n)-(1n<<32n)-977n,N=BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const G=[BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'),BigInt('0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8')];
const mod=(a,m=P)=>(a%m+m)%m;
function pow(a,n,m=P){let r=1n,b=mod(a,m);for(;n>0n;n>>=1n,b=b*b%m)if(n&1n)r=r*b%m;return r;}
function inv(x){if(!x)throw Error('Ungültiger elliptischer Punkt.');return pow(x,P-2n);}
function add(a,b){
 if(!a)return b;if(!b)return a;
 if(a[0]===b[0]&&a[1]!==b[1])return null;
 const slope=a[0]===b[0]?mod(3n*a[0]*a[0]*inv(2n*a[1])):mod((b[1]-a[1])*inv(b[0]-a[0]));
 const x=mod(slope*slope-a[0]-b[0]),y=mod(slope*(a[0]-x)-a[1]);return [x,y];
}
function multiply(k){let q=null,p=G;for(let n=k;n>0n;n>>=1n,p=add(p,p))if(n&1n)q=add(q,p);return q;}
const int=bytes=>bytes.reduce((n,b)=>(n<<8n)+BigInt(b),0n);
const bytes=(n,size)=>{const out=new Uint8Array(size);for(let i=size-1;i>=0;i--,n>>=8n)out[i]=Number(n&255n);return out;};
const join=(...arrays)=>Uint8Array.from(arrays.flatMap(a=>Array.from(a)));
const sub=()=>{if(!globalThis.crypto?.subtle)throw Error('Für xpub wird WebCrypto benötigt (HTTPS).');return globalThis.crypto.subtle;};
const sha256=async data=>new Uint8Array(await sub().digest('SHA-256',data));
const double=async data=>sha256(await sha256(data));
const hmac=async(key,data)=>{const cryptoKey=await sub().importKey('raw',key,{name:'HMAC',hash:'SHA-512'},false,['sign']);return new Uint8Array(await sub().sign('HMAC',cryptoKey,data));};
function b58decode(s){
 if(!s||/[^1-9A-HJ-NP-Za-km-z]/.test(s))throw Error('Ungültiges xpub/ypub/zpub-Format.');
 let v=0n;for(const c of s)v=v*58n+BigInt(ABC.indexOf(c));
 let result=[];while(v>0n){result.unshift(Number(v&255n));v>>=8n;}
 for(const c of s){if(c!=='1')break;result.unshift(0);}
 return Uint8Array.from(result);
}
function b58encode(data){
 let n=int(data),value='';while(n>0n){value=ABC[Number(n%58n)]+value;n/=58n;}
 for(const b of data){if(b!==0)break;value='1'+value;}return value;
}
const r1=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
const r2=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
const s1=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
const s2=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
const rol=(v,n)=>(v<<n|v>>>(32-n))>>>0;
const f=(j,x,y,z)=>j<16?(x^y^z):j<32?((x&y)|(~x&z)):j<48?((x|~y)^z):j<64?((x&z)|(y&~z)):(x^(y|~z));
function ripemd160(input){
 const len=input.length,tail=new Uint8Array(Math.ceil((len+9)/64)*64);tail.set(input);tail[len]=128;
 const bits=BigInt(len)*8n;for(let i=0;i<8;i++)tail[tail.length-8+i]=Number((bits>>BigInt(8*i))&255n);
 let h0=0x67452301,h1=0xefcdab89,h2=0x98badcfe,h3=0x10325476,h4=0xc3d2e1f0;
 const kk=[0,0x5a827999,0x6ed9eba1,0x8f1bbcdc,0xa953fd4e],kr=[0x50a28be6,0x5c4dd124,0x6d703ef3,0x7a6d76e9,0];
 for(let start=0;start<tail.length;start+=64){
  const x=Array.from({length:16},(_,i)=>new DataView(tail.buffer,start+i*4,4).getUint32(0,true));
  let a=h0,b=h1,c=h2,d=h3,e=h4,A=h0,B=h1,C=h2,D=h3,E=h4;
  for(let i=0;i<80;i++){
   let q=(rol((a+f(i,b,c,d)+x[r1[i]]+kk[i>>4])>>>0,s1[i])+e)>>>0;
   a=e;e=d;d=rol(c,10);c=b;b=q;
   q=(rol((A+f(79-i,B,C,D)+x[r2[i]]+kr[i>>4])>>>0,s2[i])+E)>>>0;
   A=E;E=D;D=rol(C,10);C=B;B=q;
  }
  const t=(h1+c+D)>>>0;
  h1=(h2+d+E)>>>0;h2=(h3+e+A)>>>0;h3=(h4+a+B)>>>0;h4=(h0+b+C)>>>0;h0=t;
 }
 const result=new Uint8Array(20),view=new DataView(result.buffer);
 for(const [i,h] of [h0,h1,h2,h3,h4].entries())view.setUint32(i*4,h,true);
 return result;
}
const hash160=async data=>ripemd160(await sha256(data));
async function base58check(payload){return b58encode(join(payload,(await double(payload)).slice(0,4)));}
function encodePoint(point){return join(Uint8Array.of(point[1]&1n?3:2),bytes(point[0],32));}
function decodePoint(data){if(data.length!==33||![2,3].includes(data[0]))throw Error('Ungültiger komprimierter Bitcoin-Public-Key.');
 const x=int(data.slice(1));if(x>=P)throw Error('Bitcoin-Public-Key-Koordinate außerhalb des Kurvenfeldes.');
 const rhs=mod(x*x*x+7n),y0=pow(rhs,(P+1n)/4n);
 if(mod(y0*y0)!==rhs)throw Error('Public-Key nicht auf secp256k1.');
 return [x,Boolean(y0&1n)===Boolean(data[0]&1)?y0:P-y0];
}
async function decodeExtended(input){
 if(/^(xprv|yprv|zprv|vprv|tprv)/i.test(String(input)))throw Error('Private Schlüssel und Seeds dürfen nicht importiert werden.');
 const data=b58decode(String(input).trim());if(data.length!==82)throw Error('Ungültige Extended-Key-Länge.');
 const checksum=(await double(data.slice(0,78))).slice(0,4);
 if(!checksum.every((x,i)=>x===data[78+i]))throw Error('Extended-Key-Prüfsumme ungültig.');
 const version=Array.from(data.slice(0,4)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const formats={'0488b21e':'p2pkh','049d7cb2':'p2sh-p2wpkh','04b24746':'p2wpkh'};
 if(!formats[version])throw Error('Nur Mainnet-xpub, ypub und zpub werden unterstützt.');
 if(data[4]!==3)throw Error('Bitte einen Account-xpub (Tiefe 3, z. B. m/84\'/0\'/0\') eingeben.');
 decodePoint(data.slice(45,78));
 return {chain:data.slice(13,45),point:data.slice(45,78),format:formats[version]};
}
async function child(parent,index){
 if(!Number.isSafeInteger(index)||index<0||index>=2**31)throw Error('Nur öffentliche, nicht gehärtete Ableitung erlaubt.');
 const data=join(parent.point,Uint8Array.of(index>>>24,(index>>>16)&255,(index>>>8)&255,index&255));
 const i=await hmac(parent.chain,data),scalar=int(i.slice(0,32));
 if(scalar===0n||scalar>=N)throw Error('Ungültiger Child-Key; Index nicht verwendbar.');
 const point=add(decodePoint(parent.point),multiply(scalar));if(!point)throw Error('Ungültiger Child-Public-Key.');
 return {chain:i.slice(32),point:encodePoint(point),format:parent.format};
}
const B32='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function bech32(data){
 const words=[0];let acc=0,bits=0;
 for(const v of data){acc=(acc<<8)|v;bits+=8;while(bits>=5){bits-=5;words.push((acc>>bits)&31);}}
 if(bits)words.push((acc<<(5-bits))&31);
 const expand=[3,3,0,2,3,...words,0,0,0,0,0,0];let chk=1;
 for(const v of expand){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let j=0;j<5;j++)if(top>>j&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][j];}
 chk^=1;let suffix='';for(let i=0;i<6;i++)suffix+=B32[(chk>>>(5*(5-i)))&31];
 return 'bc1'+words.map(v=>B32[v]).join('')+suffix;
}
export const HD_ADDRESS_TYPES=Object.freeze([
 ['auto','Automatisch erkennen (Ledger: Native SegWit zuerst)'],
 ['p2wpkh','Native SegWit · bc1q… (BIP84)'],
 ['p2sh-p2wpkh','Nested SegWit · 3… (BIP49)'],
 ['p2pkh','Legacy · 1… (BIP44)']
]);
function supportedHdFormats(account,addressType='auto'){
 const names=HD_ADDRESS_TYPES.map(([value])=>value);
 if(!names.includes(addressType))throw Error('Unbekannter Bitcoin-HD-Adresstyp.');
 if(addressType!=='auto'){
  if(account.format!=='p2pkh'&&addressType!==account.format)throw Error('ypub/zpub-Adresstyp darf nicht überschrieben werden.');
  return [addressType];
 }
 // Ledger exports BIP84 native SegWit accounts as ordinary "xpub".
 // The xpub header alone cannot identify the BIP44/49/84 address type.
 return account.format==='p2pkh'?['p2wpkh','p2sh-p2wpkh','p2pkh']:[account.format];
}
async function addressFromBranch(branch,index,format){
 const target=await child(branch,index);
 const keyHash=await hash160(target.point);
 if(format==='p2wpkh')return bech32(keyHash);
 if(format==='p2sh-p2wpkh')return base58check(join(Uint8Array.of(5),await hash160(join(Uint8Array.of(0,20),keyHash))));
 if(format==='p2pkh')return base58check(join(Uint8Array.of(0),keyHash));
 throw Error('Bitcoin-HD-Adresstyp nicht unterstützt.');
}
export async function deriveBitcoinAddress(xpub,change=0,index=0,addressType=null){
 if(![0,1].includes(change)||!Number.isInteger(index)||index<0||index>100000)throw Error('Ungültiger HD-Wallet-Index.');
 const account=await decodeExtended(xpub);
 const format=addressType==null?account.format:supportedHdFormats(account,addressType)[0];
 return addressFromBranch(await child(account,change),index,format);
}
/**
 * Watch-only: scan both receiving/change branches until the 20-address gap.
 * Generic xpubs are ambiguous: detect BIP84, then BIP49, then BIP44.
 * If an xpub shows no history in any format, DO NOT treat that as a verified
 * zero balance: the user must explicitly choose the right format.
 */
export async function scanBitcoinAccount(xpub,{fetcher=globalThis.fetch,gapLimit=20,maxAddressesPerBranch=100,addressType='auto'}={}){
 if(!Number.isInteger(gapLimit)||gapLimit<1||gapLimit>20||!Number.isInteger(maxAddressesPerBranch)||maxAddressesPerBranch<gapLimit||maxAddressesPerBranch>200)throw Error('Ungültiges HD-Scanlimit.');
 const account=await decodeExtended(xpub);
 const formats=supportedHdFormats(account,addressType);
 const {requestJSON,TTL}=await import('./request-cache.js');
 for(const format of formats){
  const summaries=[];let total=0n,observed=0,checked=0;
  for(const branch of [0,1]){
   const branchKey=await child(account,branch);
   let gap=0;
   for(let index=0;index<maxAddressesPerBranch;index++){
    const address=await addressFromBranch(branchKey,index,format);
    const data=await requestJSON('https://blockstream.info/api/address/'+address,{fetcher,ttlMs:TTL.wallet});
    const c=data?.chain_stats,m=data?.mempool_stats;
    if(!c||!m||![c.funded_txo_count,m.funded_txo_count,c.funded_txo_sum,c.spent_txo_sum,m.funded_txo_sum,m.spent_txo_sum].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Bitcoin-Explorer-Antwort unvollständig; bisheriger Bestand bleibt erhalten.');
    const used=c.funded_txo_count>0||m.funded_txo_count>0;
    const delta=BigInt(c.funded_txo_sum)-BigInt(c.spent_txo_sum)+BigInt(m.funded_txo_sum)-BigInt(m.spent_txo_sum);
    if(delta<0n)throw Error('Unplausibler Bitcoin-Adresssaldo.');
    total+=delta;checked++;
    if(used){gap=0;observed++;}else gap++;
    if(used||delta>0n)summaries.push({address,branch,index,satoshis:delta.toString()});
    if(gap>=gapLimit)break;
    if(index===maxAddressesPerBranch-1)throw Error('Gap Limit nicht erreicht; HD-Scan unvollständig.');
   }
  }
  if(observed>0||formats.length===1){
   const p=total.toString().padStart(9,'0'),fraction=p.slice(-8).replace(/0+$/,'');
   return {quantityExact:p.slice(0,-8)+(fraction?'.'+fraction:''),satoshis:total.toString(),addressesChecked:checked,usedAddresses:observed,details:summaries,addressType:format,complete:true};
  }
 }
 throw Error('Für diesen xpub wurde in Legacy, Nested und Native SegWit kein Verlauf gefunden. Bitte den Adresstyp in der Position auswählen; Taproot (bc1p) wird noch nicht unterstützt. Bisheriger Bestand bleibt erhalten.');
}
