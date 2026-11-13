/** FLH04 pure model. NOT a cryptographic verifier, transport or storage API.
 * Descriptors must come from authenticated, bounded envelope decoding. A digest
 * here is an opaque authenticated commitment, never a local checksum proof.
 * No financial payload is read, merged, normalized or written by this module.
 */
export const SYNC_GRAPH_LIMIT = 2048;
const fields = ['format','portfolioId','revisionId','deviceId','parentId','generation','payloadDigest'];
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const generation = value => typeof value === 'string' && /^[1-9][0-9]{0,127}$/.test(value);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const valid = r => r && typeof r === 'object' && !Array.isArray(r) &&
 Object.keys(r).length === fields.length && fields.every(k => Object.hasOwn(r,k)) &&
 r.format === 1 && id(r.portfolioId) && id(r.revisionId) && id(r.deviceId) &&
 (r.parentId === null || id(r.parentId)) && generation(r.generation) && digest(r.payloadDigest);
const same = (a,b) => fields.every(k => a[k] === b[k]);
const copy = r => Object.fromEntries(fields.map(k => [k,r[k]]));
const blocked = reason => ({status:'blocked',reason});

/** Full ancestor closure of the observed union of local and remote descriptors.
 * observationComplete means this listing finished, NOT global cloud freshness.
 * Single-parent MVP deliberately does not implement merge revisions/automerge.
 */
export function planSyncRevisions({portfolioId,localHead,localRevision,revisions,observationComplete} = {}) {
 const localHeadId = localHead === null ? null : localHead?.revisionId;
 if(!id(portfolioId) || !(localHead === null || (valid(localHead) && localHead.portfolioId === portfolioId)) ||
    !Number.isSafeInteger(localRevision) || localRevision < 1) return blocked('invalid-local-anchor');
 if(!Array.isArray(revisions) || revisions.length > SYNC_GRAPH_LIMIT) return blocked('graph-limit');
 if(revisions.some(r => !valid(r))) return blocked('invalid-descriptor');
 const nodes = new Map();
 for(const r of revisions) {
  if(r.portfolioId !== portfolioId) return blocked('foreign-portfolio');
  if(nodes.has(r.revisionId) && !same(nodes.get(r.revisionId),r)) return blocked('identity-collision');
  nodes.set(r.revisionId,r);
 }
 if(localHead !== null && nodes.has(localHeadId) && !same(localHead,nodes.get(localHeadId)))
  return blocked('identity-collision');
 if(observationComplete !== true) return blocked('incomplete-observation');
 if(!nodes.size) return blocked('empty-observation');
 for(const r of nodes.values()) {
  if(r.parentId === r.revisionId) return blocked('cycle');
  if(r.parentId !== null && !nodes.has(r.parentId)) return blocked('missing-parent');
 }
 // Iterative walk avoids call-stack failure at the configured graph bound.
 const visited = new Set();
 for(const start of nodes.keys()) {
  const path = new Set();
  let cursor = start;
  while(cursor !== null && !visited.has(cursor)) {
   if(path.has(cursor)) return blocked('cycle');
   path.add(cursor); cursor = nodes.get(cursor).parentId;
  }
  for(const key of path) visited.add(key);
 }
 for(const r of nodes.values()) {
  const expected = r.parentId === null ? 1n : BigInt(nodes.get(r.parentId).generation) + 1n;
  if(BigInt(r.generation) !== expected) return blocked('invalid-generation');
 }
 const parents = new Set([...nodes.values()].map(r => r.parentId));
 const heads = [...nodes.keys()].filter(key => !parents.has(key)).sort();
 const anchor = {expectedPortfolioId:portfolioId,expectedLocalRevision:localRevision,expectedHeadId:localHeadId};
 if(localHeadId === null) return {status:'enrollment-required',heads,...anchor};
 if(!nodes.has(localHeadId)) return blocked('missing-local-anchor');
 // Even differing amounts, devices or generation heights cannot pick a winner.
 if(heads.length !== 1) return {status:'conflict',heads,...anchor};
 const head = heads[0];
 if(head === localHeadId) return {status:'unchanged',...anchor};
 let cursor = head;
 while(cursor !== null && cursor !== localHeadId) cursor = nodes.get(cursor).parentId;
 if(cursor === null) return {status:'conflict',heads,...anchor};
 return {status:'apply-candidate',candidateId:head,...anchor};
}

/** Describe an already locally committed snapshot after a known accepted parent.
 * Does not allocate IDs, hash content, persist an outbox or increment IDB CAS.
 */
export function createSyncSuccessor({parent,expectedParentId,revisionId,deviceId,payloadDigest} = {}) {
 if(!valid(parent) || parent.revisionId !== expectedParentId) throw Error('sync-stale-parent');
 const next = {format:1,portfolioId:parent.portfolioId,revisionId,deviceId,
  parentId:parent.revisionId,generation:String(BigInt(parent.generation)+1n),payloadDigest};
 if(!valid(next) || revisionId === parent.revisionId) throw Error('sync-invalid-successor');
 return next;
}

/** Pure upload reconciliation, called only with authenticated readback descriptors.
 * A successful HTTP response is insufficient. Unknown completion preserves the
 * exact revision for retry; this function neither retries nor deletes anything.
 */
export function classifySyncPublication({revision,outcome,readback = null} = {}) {
 if(!valid(revision) || !['not-started','failed','unknown','uploaded'].includes(outcome))
  return blocked('invalid-publication');
 if(readback !== null) {
  if(!valid(readback) || !same(revision,readback)) return blocked('readback-mismatch');
  return {status:'confirmed',revision:copy(revision)};
 }
 return {status:outcome === 'not-started' || outcome === 'failed' ? 'pending' : 'uncertain',revision:copy(revision)};
}
