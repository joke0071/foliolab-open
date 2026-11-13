import {PASSWORD_BACKUP_PLAIN_CHARS,PASSWORD_BACKUP_CIPHER_BYTES} from './backup-limits.js';

/** Commitment to exact plaintext bytes, NOT authentication or model validation.
 * No parsing/reserialization: decimal strings, UNKNOWN/null and journal IDs
 * remain byte-for-byte inputs. Call only inside the future authenticated decoder.
 * Shared upper limits do not establish sync-envelope/transport size suitability.
 */
export async function syncPayloadDigest(plain) {
 if(typeof plain !== 'string' || plain.length > PASSWORD_BACKUP_PLAIN_CHARS)
  throw Error('sync-payload-size-or-type');
 // TextEncoder replaces lone surrogates. Reject them instead of making distinct
 // JS strings share a commitment through a silent Unicode replacement.
 for(let i=0;i<plain.length;i++) {
  const c=plain.charCodeAt(i);
  if(c>=0xd800 && c<=0xdbff) {
   const next=plain.charCodeAt(++i);
   if(!(next>=0xdc00 && next<=0xdfff)) throw Error('sync-payload-unicode');
  } else if(c>=0xdc00 && c<=0xdfff) throw Error('sync-payload-unicode');
 }
 const bytes=new TextEncoder().encode(plain);
 if(bytes.byteLength+16 > PASSWORD_BACKUP_CIPHER_BYTES) throw Error('sync-payload-size-or-type');
 const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}

export async function assertSyncPayloadDigest(plain,expectedDigest) {
 if(typeof expectedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(expectedDigest))
  throw Error('sync-invalid-payload-digest');
 const actual=await syncPayloadDigest(plain);
 if(actual !== expectedDigest) throw Error('sync-payload-digest-mismatch');
 // Return no mutable replacement, parsed model, financial data or secret.
}
