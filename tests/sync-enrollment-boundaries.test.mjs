import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';

// Executable constraints for the ENROLLMENT DESIGN, not an issuer or browser
// persistence qualification. No application imports, storage, network or unlock.
const {subtle}=webcrypto;
const writer=()=>subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
const epoch=()=>subtle.importKey('raw',webcrypto.getRandomValues(new Uint8Array(32)),
 'HKDF',false,['deriveKey']);
const transcript=new TextEncoder().encode('foliolab-enrollment-boundary-probe-v1');

test('prepared nonextractable HKDF material cannot be retroactively wrapped',async()=>{
 const key=await epoch();
 const wrappingKey=await subtle.generateKey({name:'AES-KW',length:256},false,['wrapKey','unwrapKey']);
 assert.equal(key.extractable,false);
 // HKDF has no export operation; Node24 rejects before its extractability
 // check. Assert the observed boundary precisely, not a guessed error name.
 await assert.rejects(subtle.exportKey('raw',key),{name:'NotSupportedError'});
 await assert.rejects(subtle.wrapKey('raw',key,wrappingKey,'AES-KW'),{name:'NotSupportedError'});
 // A later portable envelope must have been made from the initial random
 // material before erasure; neither changing a flag nor reimporting this key
 // is an export/transfer path.
});

test('JSON equality collapses distinct CryptoKeys and is not a full anchor CAS',async()=>{
 const a={epochKey:await epoch(),...(await writer())};
 const b={epochKey:await epoch(),...(await writer())};
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.notDeepEqual(new Uint8Array(await subtle.exportKey('spki',a.publicKey)),
  new Uint8Array(await subtle.exportKey('spki',b.publicKey)));
 const sig=await subtle.sign({name:'ECDSA',hash:'SHA-256'},a.privateKey,transcript);
 assert.equal(await subtle.verify({name:'ECDSA',hash:'SHA-256'},a.publicKey,sig,transcript),true);
 assert.equal(await subtle.verify({name:'ECDSA',hash:'SHA-256'},b.publicKey,sig,transcript),false);
});

test('fresh challenge binds a cloned private key to a pinned public key, not membership',async()=>{
 const keys=await writer();
 const pinned=new Uint8Array(await subtle.exportKey('spki',keys.publicKey));
 const loaded=structuredClone(keys);
 assert.equal(loaded.privateKey.extractable,false);
 assert.deepEqual(loaded.privateKey.usages,['sign']);
 assert.deepEqual(new Uint8Array(await subtle.exportKey('spki',loaded.publicKey)),pinned);
 const challenge=webcrypto.getRandomValues(new Uint8Array(32));
 const changed=challenge.slice();changed[0]^=1;
 const signature=await subtle.sign({name:'ECDSA',hash:'SHA-256'},loaded.privateKey,challenge);
 const publicKey=await subtle.importKey('spki',pinned,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 assert.equal(await subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,signature,challenge),true);
 assert.equal(await subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,signature,changed),false);
 // structuredClone is not native IDB/page-reopen. Local coherence alone says
 // nothing about consent, authorized enrollment, physical device or recovery.
});
