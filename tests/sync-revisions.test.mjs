import test from 'node:test';
import assert from 'node:assert/strict';
import {planSyncRevisions,createSyncSuccessor,classifySyncPublication,SYNC_GRAPH_LIMIT} from '../src/sync-revisions.js';
const root = {format:1,portfolioId:'portfolio-A',revisionId:'root',deviceId:'device-A',parentId:null,generation:'1',payloadDigest:'a'.repeat(64)};
const child = {...root,revisionId:'child',parentId:'root',generation:'2',payloadDigest:'b'.repeat(64)};
const sibling = {...child,revisionId:'sibling',deviceId:'device-B',payloadDigest:'c'.repeat(64)};
const grandchild = {...child,revisionId:'grandchild',parentId:'child',generation:'3'};
const plan = (revisions,extra={}) => planSyncRevisions({portfolioId:'portfolio-A',localHead:root,localRevision:42,revisions,observationComplete:true,...extra});
const reason = (revisions,expected,extra) => assert.deepEqual(plan(revisions,extra),{status:'blocked',reason:expected});

test('duplicate delivery is idempotent; input order is irrelevant',()=>{
 assert.deepEqual(plan([root,root]),{status:'unchanged',expectedPortfolioId:'portfolio-A',expectedLocalRevision:42,expectedHeadId:'root'});
 for(const rows of [[root,child,grandchild],[grandchild,root,child],[child,grandchild,root]])
  assert.deepEqual(plan(rows),{status:'apply-candidate',candidateId:'grandchild',expectedPortfolioId:'portfolio-A',expectedLocalRevision:42,expectedHeadId:'root'});
});
test('authenticated identity collision fails closed, including device/parent/commitment changes',()=>{
 for(const change of [{payloadDigest:'f'.repeat(64)},{deviceId:'device-C'},{parentId:'child'},{generation:'2'}])
  reason([root,{...root,...change}],'identity-collision');
});
test('concurrent devices conflict: higher generation never wins over sibling',()=>{
 for(const rows of [[root,child,sibling,grandchild],[grandchild,sibling,child,root]])
  assert.deepEqual(plan(rows),{status:'conflict',heads:['grandchild','sibling'],expectedPortfolioId:'portfolio-A',expectedLocalRevision:42,expectedHeadId:'root'});
});
test('same financial commitment on siblings still requires explicit conflict resolution',()=>{
 assert.equal(plan([root,child,{...sibling,payloadDigest:child.payloadDigest}]).status,'conflict');
});
test('another independently created root cannot silently replace local portfolio lineage',()=>{
 assert.equal(plan([root,{...root,revisionId:'second-root',deviceId:'device-B'}]).status,'conflict');
});
test('old ancestor delivery does not roll back known local successor',()=>{
 assert.deepEqual(plan([root,child],{localHead:child}),{status:'unchanged',expectedPortfolioId:'portfolio-A',expectedLocalRevision:42,expectedHeadId:'child'});
 reason([root],'missing-local-anchor',{localHead:child});
});
test('missing parents, partial pages and empty listings never become replacement roots',()=>{
 reason([child],'missing-parent');
 reason([root],'incomplete-observation',{observationComplete:false});
 reason([root],'incomplete-observation',{observationComplete:undefined});
 reason([],'empty-observation');
});
test('new device needs explicit enrollment even when only one valid root exists',()=>{
 assert.deepEqual(plan([root],{localHead:null}),{status:'enrollment-required',heads:['root'],expectedPortfolioId:'portfolio-A',expectedLocalRevision:42,expectedHeadId:null});
});
test('foreign portfolios, self parents and multi-node cycles fail closed',()=>{
 reason([{...root,portfolioId:'portfolio-B'}],'foreign-portfolio');
 reason([{...root,parentId:'root'}],'cycle',{localHead:null});
 reason([{...root,parentId:'child'},child],'cycle',{localHead:null});
});
test('generation is exact parent plus one, never a floating-point or clock comparison',()=>{
 for(const value of ['0','01','2.0','1e3','-1',2,Number.MAX_SAFE_INTEGER,'9'.repeat(129)])
  reason([{...root,generation:value}],'invalid-descriptor');
 reason([{...root,generation:'2'}],'invalid-generation',{localHead:null});
 reason([root,{...child,generation:'3'}],'invalid-generation');
});
test('unknown formats, extra fields, invalid IDs and malformed commitments are rejected',()=>{
 for(const change of [{format:2},{installationId:'local-only'},{revisionId:''},{deviceId:'x'.repeat(129)},
  {payloadDigest:'abc'},{parentId:undefined},{portfolioId:'private/name'}])
  reason([{...root,...change}],'invalid-descriptor');
 reason([null],'invalid-descriptor');
});
test('local CAS token is a positive safe integer and never adopted from remote',()=>{
 for(const value of [null,0,-1,'42',1.5,Number.MAX_SAFE_INTEGER+1]) reason([root],'invalid-local-anchor',{localRevision:value});
 const p=plan([root,child],{localRevision:73});
 assert.equal(p.expectedLocalRevision,73);assert.equal(p.expectedHeadId,'root');
 assert.notEqual(p.expectedLocalRevision,Number(child.generation));
});
test('graph bound rejects oversize before traversal; longest allowed chain is iterative',()=>{
 reason(Array(SYNC_GRAPH_LIMIT+1).fill(root),'graph-limit');
 const rows=[root];
 for(let i=1;i<SYNC_GRAPH_LIMIT;i++)rows.push({...root,revisionId:'r'+i,parentId:rows[i-1].revisionId,generation:String(i+1)});
 assert.equal(plan(rows).candidateId,'r2047');
});
test('planning cannot mutate frozen financial-independent inputs',()=>{
 const rows=Object.freeze([Object.freeze({...root}),Object.freeze({...child})]);
 const before=JSON.stringify(rows);plan(rows);assert.equal(JSON.stringify(rows),before);
});
test('local offline successor keeps portfolio and exact parent, uses independent device identity',()=>{
 assert.deepEqual(createSyncSuccessor({parent:root,expectedParentId:'root',revisionId:'child',deviceId:'device-A',payloadDigest:'b'.repeat(64)}),child);
 const next=createSyncSuccessor({parent:child,expectedParentId:'child',revisionId:'offline-B',deviceId:'device-B',payloadDigest:'d'.repeat(64)});
 assert.equal(next.portfolioId,root.portfolioId);assert.equal(next.generation,'3');assert.equal(next.parentId,'child');
 assert.equal(plan([root,child,next]).status,'apply-candidate');
});
test('offline successor rejects stale parent, reused identity and numeric overflow of generation limit',()=>{
 const args={parent:root,expectedParentId:'root',revisionId:'next',deviceId:'device-A',payloadDigest:'a'.repeat(64)};
 assert.throws(()=>createSyncSuccessor({...args,expectedParentId:'stale'}),/stale-parent/);
 assert.throws(()=>createSyncSuccessor({...args,revisionId:'root'}),/invalid-successor/);
 assert.throws(()=>createSyncSuccessor({...args,parent:{...root,generation:'9'.repeat(128)}}),/invalid-successor/);
});
test('part upload, lost response and HTTP success alone never acknowledge publication',()=>{
 for(const [outcome,status] of [['not-started','pending'],['failed','pending'],['unknown','uncertain'],['uploaded','uncertain']]) {
  const result=classifySyncPublication({revision:child,outcome});
  assert.deepEqual(result,{status,revision:child});assert.notEqual(result.revision,child);
 }
});
test('exact authenticated readback resolves a lost response without a new revision',()=>{
 for(const outcome of ['failed','unknown','uploaded'])
  assert.deepEqual(classifySyncPublication({revision:child,outcome,readback:{...child}}),{status:'confirmed',revision:child});
 for(const change of [{revisionId:'other'},{payloadDigest:'f'.repeat(64)},{deviceId:'device-B'},{parentId:null}])
  assert.deepEqual(classifySyncPublication({revision:child,outcome:'uploaded',readback:{...child,...change}}),{status:'blocked',reason:'readback-mismatch'});
});
test('two offline branches remain conflicts after upload retries and duplicate readbacks',()=>{
 const a=classifySyncPublication({revision:child,outcome:'unknown'}).revision;
 const retry=classifySyncPublication({revision:a,outcome:'uploaded',readback:child}).revision;
 assert.equal(plan([root,child,sibling,retry]).status,'conflict');
});
test('trusted local descriptor catches remote equivocation even without duplicate original in listing',()=>{
 reason([{...root,payloadDigest:'f'.repeat(64)}],'identity-collision');
 reason([root],'invalid-local-anchor',{localHead:{...root,portfolioId:'portfolio-B'}});
 reason([root],'invalid-local-anchor',{localHead:undefined});
});
test('publication rejects malformed, unknown and incomplete readback descriptors',()=>{
 assert.deepEqual(classifySyncPublication({revision:child,outcome:'future'}),{status:'blocked',reason:'invalid-publication'});
 assert.deepEqual(classifySyncPublication({revision:null,outcome:'uploaded'}),{status:'blocked',reason:'invalid-publication'});
 assert.deepEqual(classifySyncPublication({revision:child,outcome:'uploaded',readback:{revisionId:'child'}}),{status:'blocked',reason:'readback-mismatch'});
});
