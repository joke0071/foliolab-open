import {readPortfolioSyncAnchorPreimage} from './atomic-storage.js';

// Isolated preparation ONLY. No app integration, enrollment, key export, frame
// verifier, encoder or unlock API. Stored keys never confer sender/Apply rights.
const ANCHOR_KEY='sync-local-anchor-v1';
const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
const randomId=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
const fail=reason=>{throw Error('sync-anchor-'+reason);};

// The binding must not collapse undefined, non-JSON metadata or extra fields.
// Preparation supports ordinary canonical records only; it never normalizes.
function portfolioPreimage(portfolio) {
 if(!portfolio)return JSON.stringify(portfolio);
 const fields=['schemaVersion','revision','raw','settings','deleted','updatedAt','syncEnrollmentRequired'];
 if(Object.keys(portfolio).some(k=>!fields.includes(k))||typeof portfolio.updatedAt!=='string')
  fail('unsupported-record');
 if(Object.hasOwn(portfolio,'settings')){
  const settings=portfolio.settings;
  if(settings!==null&&(!settings||Object.getPrototypeOf(settings)!==Object.prototype||
   Object.values(settings).some(v=>!['string','boolean','number'].includes(typeof v)||
    (typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0))))))fail('unsupported-settings');
 }
 return JSON.stringify(portfolio);
}

function assertEligible({portfolio,syncPresent,anchorPresent}) {
 if(!portfolio||portfolio.deleted)fail('no-live-portfolio');
 if(portfolio.syncEnrollmentRequired!==true)fail('fence-required');
 if(syncPresent)fail('existing-outbox');
 if(anchorPresent)fail('existing-anchor');
}

// Private writer: no exported caller-key or arbitrary prepared-record entry.
function commitPrepared(db,before,anchor) {
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');
  let portfolio,syncPresent,anchorPresent,reads=0,failure=null;
  const finish=()=>{
   if(++reads!==3)return;
   try {
    if(portfolioPreimage(portfolio)!==before)fail('stale-portfolio');
    assertEligible({portfolio,syncPresent,anchorPresent});
    store.put(anchor,ANCHOR_KEY);
   }catch(error){failure=error;tx.abort();}
  };
  const p=store.get('portfolio'),s=store.count('sync-outbox-v1'),a=store.count(ANCHOR_KEY);
  p.onsuccess=()=>{portfolio=p.result??null;finish();};
  s.onsuccess=()=>{syncPresent=s.result!==0;finish();};
  a.onsuccess=()=>{anchorPresent=a.result!==0;finish();};
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(failure||tx.error||Error('sync-anchor-write-aborted'));tx.onerror=()=>{};
 });
}

/** Reserve fresh LOCAL identities/keys against one complete fenced record.
 * This is not consent, enrollment, remote membership or writer authorization.
 * Existing material is never adopted, overwritten or unlocked, including retry
 * after a committed write whose response was lost. Explicit recovery is open.
 * Platform WebCrypto is trusted; hostile same-realm code/full clones are not
 * excluded by these local checks. Native CryptoKey IDB persistence is unproven.
 */
export async function prepareLocalSyncAnchor(db) {
 const current=await readPortfolioSyncAnchorPreimage(db);
 assertEligible(current);
 const before=portfolioPreimage(current.portfolio); // detached IDB result, pre-await
 const identity={lineId:randomId(),portfolioId:randomId(),epochId:randomId(),deviceId:randomId()};
 const raw=crypto.getRandomValues(new Uint8Array(32));
 let epochKey;
 try {epochKey=await crypto.subtle.importKey('raw',raw,'HKDF',false,['deriveKey']);}
 finally {raw.fill(0);}
 const writer=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
 const portfolioDigest=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(before)));
 const anchor={format:1,status:'prepared-locked',lifecycle:1,...identity,
  localRevision:current.portfolio.revision,portfolioDigest,
  epochKey,writerPrivateKey:writer.privateKey,writerPublicKey:writer.publicKey};
 await commitPrepared(db,before,anchor);
 // No keys, private binding digest, financial bytes or preferences leave here.
 return Object.freeze({format:1,status:'prepared-locked',lifecycle:1,...identity,
  localRevision:current.portfolio.revision,enrollmentAuthorized:false});
}
