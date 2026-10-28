/** Bounded P-Chain address / observation identity checks; no wallet integration.
 * Contract: docs/FLH03_PCHAIN_IDENTITY_CONTRACT.md. No RPC, keys or persistence.
 */
const ALPHABET='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATORS=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
const PLATFORM_CHAIN='0'.repeat(64);
const fail=message=>{throw Error('P-Chain-Identität: '+message);};
function networkHRP(networkID){
 if(networkID==='1')return 'avax';
 if(networkID==='5')return 'fuji';
 fail('Netzwerk-ID ausdrücklich als 1 oder 5 angeben.');
}
function hexID(value,label){
 if(typeof value!=='string'||!/^[0-9a-f]{64}$/.test(value))fail(label+' muss eine kanonische 32-Byte-Hex-ID sein.');
 return value;
}
function checksum(words){
 let state=1;
 for(const word of words){
  const high=state>>>25;state=((state&0x1ffffff)<<5)^word;
  for(let bit=0;bit<5;bit++)if((high>>>bit)&1)state^=GENERATORS[bit];
 }
 return state;
}
/** Deliberately accepts only P-avax/P-fuji canonical lowercase payloads.
 * A decoded owner is a declared reference, never proof of keys or ownership.
 */
export function decodePchainAddress(address,{networkID}={}){
 const hrp=networkHRP(networkID);
 if(typeof address!=='string'||address.length!==45||!address.startsWith('P-'+hrp+'1'))fail('Kanonische P-Adresse für das erklärte Netzwerk erforderlich.');
 const tail=address.slice(7),words=[];
 for(const char of tail){const word=ALPHABET.indexOf(char);if(word<0)fail('Adressalphabet ungültig.');words.push(word);}
 const codes=Array.from(hrp,c=>c.charCodeAt(0));
 if(checksum([...codes.map(c=>c>>>5),0,...codes.map(c=>c&31),...words])!==1)fail('Bech32-Prüfsumme stimmt nicht.');
 // Exactly 32 data words = 160 bits. No SegWit version or leftover padding.
 let accumulator=0,bits=0,ownerId='';
 for(const word of words.slice(0,-6)){
  accumulator=((accumulator<<5)|word)&0xffff;bits+=5;
  if(bits>=8){bits-=8;ownerId+=((accumulator>>>bits)&255).toString(16).padStart(2,'0');}
 }
 return Object.freeze({address,networkID,chainId:PLATFORM_CHAIN,ownerId,
  ownerKey:JSON.stringify(['avalanche-owner-v1',networkID,PLATFORM_CHAIN,ownerId])});
}
/** Identifies an observation at the P destination, not a global economic event.
 * Both native and atomic contexts must be explicit; no defaults or chain aliases.
 */
export function pchainUTXOIdentity(utxo,{networkID,sourceChainId,destinationChainId}={}){
 networkHRP(networkID);
 hexID(sourceChainId,'Quellchain');hexID(destinationChainId,'Zielchain');
 if(destinationChainId!==PLATFORM_CHAIN)fail('Nur die P-Zielchain wird unterstützt.');
 if(!utxo||typeof utxo!=='object'||Array.isArray(utxo))fail('Decodierter UTXO-Outpoint fehlt.');
 const transactionId=hexID(utxo.transactionId,'Transaktion'),outputIndex=utxo.outputIndex;
 if(!Number.isSafeInteger(outputIndex)||Object.is(outputIndex,-0)||outputIndex<0||outputIndex>0xffffffff)fail('Outputindex muss eine kanonische uint32-Zahl sein.');
 const kind=sourceChainId===destinationChainId?'native':'atomic';
 return Object.freeze({networkID,sourceChainId,destinationChainId,kind,transactionId,outputIndex,
  key:JSON.stringify(['avalanche-utxo-observation-v1',networkID,destinationChainId,sourceChainId,transactionId,outputIndex])});
}
