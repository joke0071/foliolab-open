import {createHash,createCipheriv,hkdfSync} from 'node:crypto';
import {createSyncFrameVerifier} from '../src/sync-frame-verifier.js';
export const portfolioId='P',epochId='12'.repeat(16),secret=Buffer.alloc(32,17),suite='HKDF-SHA256-A256GCM';
const key=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);
export const verify=createSyncFrameVerifier({portfolioId,epochId,key});
const hash=s=>createHash('sha256').update(s).digest('hex');
const fields=['format','portfolioId','revisionId','deviceId','parentId','generation','payloadDigest'];
// Independent OpenSSL oracle. Fixed secrets/nonces ONLY for synthetic tests.
export function frame(plain,revisionId='R',parentId=null,generation='1',salt='23'.repeat(32)) {
 const d={format:1,portfolioId,revisionId,deviceId:'D',parentId,generation,payloadDigest:hash(plain)},nonce='34'.repeat(12);
 const k=hkdfSync('sha256',secret,Buffer.from(salt,'hex'),Buffer.from(JSON.stringify(['foliolab-sync-key',1,suite,portfolioId,epochId])),32);
 const c=createCipheriv('aes-256-gcm',k,Buffer.from(nonce,'hex'));
 c.setAAD(Buffer.from(JSON.stringify(['foliolab-sync',1,suite,portfolioId,epochId,salt,nonce])));
 return JSON.stringify(['foliolab-sync',1,suite,epochId,salt,nonce,Buffer.concat([c.update(JSON.stringify(['foliolab-sync-content',1,fields.map(f=>d[f]),plain])),c.final(),c.getAuthTag()]).toString('hex')]);
}
