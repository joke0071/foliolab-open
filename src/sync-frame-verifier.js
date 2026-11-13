import {isSyncRevisionDescriptor} from './sync-revisions.js';
import {assertSyncPayloadDigest} from './sync-payload-integrity.js';

/** Decoder only. Trusted epoch enrollment/key provenance, financial validation,
 * replay/graph checks, durable outbox, rotation and all I/O remain separate gates.
 * Group-key authentication does not authenticate an individual device identity.
 */
export const SYNC_FRAME_TEXT_LIMIT = 15000000;
export const SYNC_FRAME_CIPHER_LIMIT = 7400000;
const DOMAIN = 'foliolab-sync';
const SUITE = 'HKDF-SHA256-A256GCM';
const fields = ['format','portfolioId','revisionId','deviceId','parentId','generation','payloadDigest'];
const encoder = new TextEncoder();
const proofs = new WeakMap();
const id = s => typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s);
const hex = (s,n) => typeof s === 'string' && s.length === n && /^[0-9a-f]+$/.test(s);
const bytes = s => {
 const result = new Uint8Array(s.length/2);
 for(let i=0;i<result.length;i++) result[i]=parseInt(s.slice(i*2,i*2+2),16);
 return result;
};
const toHex = b => Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const utf8 = a => encoder.encode(JSON.stringify(a));
const fail = reason => {throw Error('sync-frame-'+reason);};

/** Receipt is an ephemeral module-issued capability, not a serializable flag.
 * This guards accidental bypass, not hostile code executing in the same realm.
 */
export function readVerifiedSyncFrame(receipt) {
 const result = proofs.get(receipt);
 if(!result) fail('unverified-receipt');
 return result;
}

/** One verifier per independently trusted portfolio/epoch/key binding.
 * A remote header never chooses another key, epoch or portfolio.
 * Key entropy/provenance cannot be established by inspecting a CryptoKey.
 */
export function createSyncFrameVerifier({portfolioId,epochId,key} = {}) {
 if(!id(portfolioId) || !hex(epochId,32) || !(key instanceof globalThis.CryptoKey) ||
    key.type !== 'secret' || key.extractable || key.algorithm.name !== 'HKDF' ||
    key.usages.length !== 1 || key.usages[0] !== 'deriveKey') fail('invalid-binding');
 // Capture immutable primitives/key before any asynchronous operation.
 return async function verify(frameText) {
  if(typeof frameText !== 'string' || frameText.length > SYNC_FRAME_TEXT_LIMIT) fail('size-or-type');
  let outer;
  try {outer=JSON.parse(frameText);} catch {fail('outer-format');}
  if(!Array.isArray(outer) || outer.length !== 7 || outer[0] !== DOMAIN || outer[1] !== 1 ||
     outer[2] !== SUITE || !hex(outer[3],32) || !hex(outer[4],64) || !hex(outer[5],24) ||
     typeof outer[6] !== 'string' || outer[6].length < 32 ||
     outer[6].length > SYNC_FRAME_CIPHER_LIMIT*2 || outer[6].length%2 ||
     !/^[0-9a-f]+$/.test(outer[6]) || JSON.stringify(outer) !== frameText) fail('outer-format');
  if(outer[3] !== epochId) fail('epoch-mismatch');
  const [, , , ,saltHex,nonceHex,cipherHex] = outer;
  let raw;
  try {
   const derived = await globalThis.crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:bytes(saltHex),
    info:utf8(['foliolab-sync-key',1,SUITE,portfolioId,epochId])},key,
    {name:'AES-GCM',length:256},false,['decrypt']);
   raw = await globalThis.crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(nonceHex),tagLength:128,
    additionalData:utf8([DOMAIN,1,SUITE,portfolioId,epochId,saltHex,nonceHex])},derived,bytes(cipherHex));
  } catch {fail('authentication');}
  let text,inner;
  try {
   text = new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw);
   inner = JSON.parse(text);
  } catch {fail('content-encoding');}
  if(!Array.isArray(inner) || inner.length !== 4 || inner[0] !== 'foliolab-sync-content' || inner[1] !== 1 ||
     !Array.isArray(inner[2]) || inner[2].length !== fields.length || typeof inner[3] !== 'string' ||
     JSON.stringify(inner) !== text) fail('content-format');
  const descriptor = Object.fromEntries(fields.map((k,i)=>[k,inner[2][i]]));
  if(!isSyncRevisionDescriptor(descriptor) || descriptor.portfolioId !== portfolioId) fail('descriptor');
  await assertSyncPayloadDigest(inner[3],descriptor.payloadDigest);
  const frameDigest = toHex(await globalThis.crypto.subtle.digest('SHA-256',encoder.encode(frameText)));
  const receipt = Object.freeze({type:'verified-sync-frame'});
  proofs.set(receipt,Object.freeze({descriptor:Object.freeze(descriptor),plain:inner[3],epochId,frameText,frameDigest}));
  return receipt;
 };
}
