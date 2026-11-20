import {readArchivePin,readArchiveHandoff,finishArchivePin} from './sync-archive-pin.js';
import {readConflictSource,checkConflictSource,CONFLICT_ARCHIVE_LIMIT} from './sync-conflict-source.js';
import {describeConflictSuccessor} from './sync-conflict-successor.js';
import {archiveDigest,prepareRestore,inspectPinnedLocalRestore,previewPinnedLocalRollback,rollbackPinnedLocalCopy,reopenLocalRecoveryCase} from './sync-restore-status.js';
import {backup,safeImport} from '../../src/model.js';
import {prepareRecoveryFiles} from './sync-recovery-files.js';
import {encryptWithBackupPassword} from '../../src/backup-vault.js';
import {createSyncSnapshot,validateSyncSnapshot,compareSyncSnapshotSections,changedFinancialSections,previewSyncRestore} from './sync-snapshot.js';
import {SYNC_GRAPH_LIMIT} from './sync-revisions.js';
import {SYNC_FRAME_TEXT_LIMIT,readVerifiedSyncFrame} from './sync-frame-verifier.js';
import {readPortfolioSyncRecord,commitPortfolioSyncRecord,syncPreimageText} from '../../src/atomic-storage.js';
import {SYNC_OUTBOX_TEXT_LIMIT,verifySyncOutboxState,readSyncOutboxState,appendSyncOutboxState,advanceSyncOutboxState,syncOutboxHeadMatches,syncOutboxSummary,planSyncOutboxApply} from './sync-outbox-state.js';

// Canonical group frames are single-line ASCII. Keep exact ciphertext, including all local ancestors.
const archiveHeader=(revision,version)=>'FolioLabConflict/1 '+revision+' '+version;
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const positive=value=>Number.isSafeInteger(value)&&value>0;
function boundedFrameBatch(frameTexts){
 if(!Array.isArray(frameTexts)||frameTexts.length>SYNC_GRAPH_LIMIT)throw Error('sync-outbox-frame-batch-limit');
 const frames=[];let total=0;
 for(const text of frameTexts){
  if(typeof text!=='string'||text.length>SYNC_FRAME_TEXT_LIMIT||(total+=text.length)>SYNC_OUTBOX_TEXT_LIMIT)
   throw Error('sync-outbox-frame-batch-limit');
  frames.push(text);
 }
 return frames;
}
/** Isolated local adapter; NOT imported by the app. Metadata in the SAME IDB
 * store as the canonical portfolio. No upload, RemoteApply or key persistence.
 * Native IDB/crash/quota/multitab qualification remains required before use.
 */
export function createSyncOutboxStorage(db,verifyFrame) {
 async function verifySnapshotFrame(text) {
  const receipt=await verifyFrame(text);
  await validateSyncSnapshot(readVerifiedSyncFrame(receipt).plain);
  return receipt;
 }
 async function read(expectedLocalRevision,expectedSyncVersion) {
  const current=await readPortfolioSyncRecord(db,{forOutbox:true});
  if(!current.portfolio||current.portfolio.deleted||current.portfolio.revision!==expectedLocalRevision||
   (current.sync?.version??null)!==expectedSyncVersion)throw Error('sync-outbox-stale-preimage');
  if(current.portfolio.syncEnrollmentRequired)throw Error('sync-outbox-enrollment-required');
  const ticket=current.sync===null?null:await verifySyncOutboxState(current.sync,verifySnapshotFrame);
  return {...current,ticket};
 }
 // The state machine compares payload bytes. The transaction compares the complete original IDB record.
 async function snapshotPreimage(portfolio) {
  return {revision:portfolio.revision,deleted:portfolio.deleted,raw:await createSyncSnapshot(portfolio.raw)};
 }
 async function checkCurrentHead(portfolio,sync,ticket) {
  if(sync?.entries.at(-1)?.capturedLocalRevision!==portfolio.revision)return;
  const plain=await createSyncSnapshot(portfolio.raw);
  if(!syncOutboxHeadMatches(ticket,plain))throw Error('sync-outbox-local-snapshot-mismatch');
 }
 async function commit(current,nextState) {
  return commitPortfolioSyncRecord(db,{expectedLocalRevision:current.portfolio.revision,
   expectedPortfolio:current.portfolio,expectedState:current.sync,nextState});
 }
 async function verifiedHeadPlain(current,frames,id){
   const text=frames.get(id);
   const frame=readVerifiedSyncFrame(await verifyFrame(text));
   if(frame.frameText!==text||frame.descriptor.revisionId!==id||frame.epochId!==current.sync.epochId||
      frame.descriptor.portfolioId!==current.sync.portfolioId)throw Error('sync-outbox-frame-binding');
   return frame.plain;
 }
 // Called only on the closed, validated single-parent graph from planSyncOutboxApply.
 function commonAncestor(current,revisions,heads){
  const parents=new Map([...current.sync.entries.map(e=>e.revision),...revisions].map(r=>[r.revisionId,r.parentId]));
  let base=heads[0];
  for(const head of heads.slice(1)){
   const ancestors=new Set();
   for(let id=head;id!==null;id=parents.get(id))ancestors.add(id);
   while(base!==null&&!ancestors.has(base))base=parents.get(base);
   if(base===null)break;
  }
  return base;
 }
 async function conflictOverview(current,revisions,heads,frames){
  const baseId=commonAncestor(current,revisions,heads);
  if(baseId===null)return {status:'no-common-ancestor',baseId,heads:heads.map(id=>({id,changedSections:null}))};
  const readData=async id=>(await validateSyncSnapshot(await verifiedHeadPlain(current,frames,id))).data;
  const base=await readData(baseId),rows=[];
  for(const id of heads)rows.push({id,changedSections:changedFinancialSections(base,await readData(id))});
  return {status:'compared',baseId,heads:rows};
 }
 async function compareBranches(current,revisions,plan,frames,[leftId,rightId]){
  if(plan.status!=='conflict'||!plan.heads.includes(leftId)||!plan.heads.includes(rightId))
   throw Error('sync-outbox-comparison-needs-conflicting-heads');
  const baseId=commonAncestor(current,revisions,[leftId,rightId]);
  if(baseId===null)return {status:'no-common-ancestor',leftId,rightId};
  const plain=[];
  for(const id of [baseId,leftId,rightId]){
   plain.push(await verifiedHeadPlain(current,frames,id));
  }
  return {status:'compared',baseId,leftId,rightId,sections:await compareSyncSnapshotSections(...plain)};
 }
 async function finishPlan(current,revisions,observationComplete,frames,comparisonHeads,archive){
  if(current.ticket===null)return {status:'blocked',reason:'no-local-sync-preimage',applyAuthorized:false};
  const last=current.sync.entries.at(-1);
  const portfolio=last.capturedLocalRevision===current.portfolio.revision?await snapshotPreimage(current.portfolio):current.portfolio;
  const result=planSyncOutboxApply({ticket:current.ticket,portfolio,revisions,observationComplete});
  if(comparisonHeads)result.comparison=await compareBranches(current,revisions,result,frames,comparisonHeads);
  if(archive){
   if(archive.previous&&result.status==='blocked')throw Error('sync-archive-successor-'+result.reason);
   if(result.status!=='conflict')throw Error('sync-outbox-archive-needs-conflict');
   const ordered=[...frames.keys()].sort().map(id=>frames.get(id));
   if(ordered.reduce((size,text)=>size+text.length,0)>SYNC_OUTBOX_TEXT_LIMIT)throw Error('sync-outbox-frame-batch-limit');
   const binding=await archiveDigest(syncPreimageText(current.sync));
   const text=[archiveHeader(current.portfolio.revision,current.sync.version)+' '+binding,...ordered].join('\n');
   if(archive.previous){
    result.transition=await describeConflictSuccessor(archive.previous,current,revisions,frames,result.heads);
    if(archive.intermediate){
     result.preparedTransition=await describeConflictSuccessor({pin:archive.intermediate,header:archive.source.header,
      oldFrames:new Set(archive.source.frameTexts)},current,revisions,frames,result.heads);
    }
    if(archive.original!==undefined&&text!==archive.original)throw Error('sync-archive-successor-readback');
    result.archive={text,digest:archive.verifiedDigest??await archiveDigest(text)};
   }else if(archive.mode==='create')result.archive={text,digest:await archiveDigest(text)};
   else if(text!==archive.original)throw Error('sync-outbox-incomplete-or-noncanonical-archive');
  }
  if(archive?.pin){
   const binding={digest:result.archive?.digest??archive.pin.digest,localRevision:current.portfolio.revision,syncVersion:current.sync.version,
    portfolioDigest:await archiveDigest(syncPreimageText(current.portfolio))};
   if(archive.previous){
    if(binding.localRevision===archive.previous.pin.localRevision&&binding.portfolioDigest!==archive.previous.pin.portfolioDigest)
     throw Error('sync-archive-successor-portfolio-changed');
    result.successorPortfolioDigest=binding.portfolioDigest;
    if(archive.pin.write&&archive.expectedPortfolioDigest!==binding.portfolioDigest)
     throw Error('sync-archive-successor-portfolio-changed');
   }
   if(archive.pin.includeOverview)result.overview=await conflictOverview(current,revisions,result.heads,frames);
   let restore;
   if(archive.pin.selectedHead!==undefined){
    const id=archive.pin.selectedHead;
    if(!result.heads.includes(id))throw Error('sync-archive-preview-head');
    if(archive.pin.exportCopy==='restore'&&(result.heads.length!==2||
       !result.heads.includes(last.revision.revisionId)||id===last.revision.revisionId))
     throw Error('sync-restore-needs-local-and-selected-heads');
    const plain=await verifiedHeadPlain(current,frames,id);
    result.restorePreview={selectedHead:id,...await previewSyncRestore(current.portfolio.raw,plain)};
    // Only the explicit export returns financial values, after the final IDB check below.
    if(archive.pin.exportCopy){
     const financialCopy=JSON.stringify(JSON.parse(plain).data);
     if(archive.pin.exportCopy==='recovery'||archive.pin.exportCopy==='restore'){
      const localCopy=JSON.stringify(JSON.parse(portfolio.raw).data);
      Object.assign(result,await prepareRecoveryFiles(localCopy,financialCopy,archive.pin.readback));
      if(archive.pin.exportCopy==='restore'){
       if(!result.recoveryFilesVerified)throw Error('sync-restore-needs-file-readback');
       const raw=backup(safeImport(JSON.parse(financialCopy)),{includeHistory:true});
       restore=await prepareRestore(current,raw,{...binding,version:archive.pin.version,selectedHead:id},archive.pin.readback);
      }
     }else if(archive.pin.exportCopy==='encrypted')result.encryptedCopy=await encryptWithBackupPassword(financialCopy);
     else result.financialCopy=financialCopy;
    }
   }
   const {pin,status}=await finishArchivePin(db,current,binding,archive.pin,restore);
   if(status&&archive.pin.handoff.mode!=='prepare'){
    const resumed={status,pinVersion:pin.version,heads:result.heads,applyAuthorized:false};
    if(archive.pin.handoff.mode==='regenerate')resumed.archive=result.archive;
    return resumed;
   }
   if(restore)return {status:'restored-local-copy',selectedHead:pin.selectedHead,
    localRevision:current.portfolio.revision+1,applyAuthorized:false};
   return {...result,...(status?{handoffStatus:status}:{}),pinVersion:pin.version,applyAuthorized:false};
  }
  const after=await readPortfolioSyncRecord(db,{forOutbox:true});
  if(syncPreimageText(after.portfolio)!==syncPreimageText(current.portfolio)||syncPreimageText(after.sync)!==syncPreimageText(current.sync))
   throw Error('sync-outbox-apply-plan-race');
  return {...result,applyAuthorized:false}; // Actual Apply must repeat this preimage/CAS in its OWN tx.
 }
  // Read-only group-frame preview. The caller still supplies listing completeness.
  // Group authentication is insufficient for individual writer or transport authority.
 async function planFrames({expectedLocalRevision,expectedSyncVersion,frameTexts,observationComplete,comparisonHeads},archive) {
   let pair;
   if(comparisonHeads!==undefined){
    if(!Array.isArray(comparisonHeads)||comparisonHeads.length!==2||comparisonHeads[0]===comparisonHeads[1]||
       !comparisonHeads.every(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id)))
     throw Error('sync-outbox-invalid-comparison-heads');
    pair=[comparisonHeads[0],comparisonHeads[1]];
   }
   const frames=boundedFrameBatch(frameTexts);
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   if(archive&&!current.ticket)throw Error('sync-outbox-archive-needs-conflict');
   if(!current.ticket)return finishPlan(current,[],observationComplete);
   const known=new Map(current.sync.entries.map(e=>[e.revision.revisionId,e.frameText]));
   const verified=new Map(current.sync.entries.map(e=>[e.frameText,e.revision])),revisions=[];
   for(const text of frames){
    if(verified.has(text))continue;
    const frame=readVerifiedSyncFrame(await verifySnapshotFrame(text));
    if(frame.frameText!==text||frame.epochId!==current.sync.epochId||frame.descriptor.portfolioId!==current.sync.portfolioId)
     throw Error('sync-outbox-frame-binding');
    if(known.has(frame.descriptor.revisionId))throw Error('sync-outbox-frame-identity-collision');
    if(known.size>=SYNC_GRAPH_LIMIT)throw Error('sync-outbox-frame-batch-limit');
    known.set(frame.descriptor.revisionId,text);
    verified.set(text,frame.descriptor);revisions.push(frame.descriptor);
   }
   if(archive?.source)checkConflictSource(archive.source,current.sync.portfolioId,verified);
   return finishPlan(current,revisions,observationComplete,known,pair,archive);
  }
  async function reopenArchive({text,expectedDigest,expectedLocalRevision,expectedSyncVersion,comparisonHeads},pin){
   // The expected digest is retained separately by the caller; it is not writer authority.
   if(typeof text!=='string'||text.length>CONFLICT_ARCHIVE_LIMIT||
      typeof expectedDigest!=='string'||!/^[0-9a-f]{64}$/.test(expectedDigest))
    throw Error('sync-outbox-invalid-archive');
   const pair=comparisonHeads===undefined?undefined:structuredClone(comparisonHeads);
   if(await archiveDigest(text)!==expectedDigest)throw Error('sync-outbox-archive-digest');
   const [header,...frameTexts]=text.split('\n',SYNC_GRAPH_LIMIT+2);
   if(!header.startsWith(archiveHeader(expectedLocalRevision,expectedSyncVersion)+' '))throw Error('sync-outbox-archive-local-binding');
   return planFrames({expectedLocalRevision,expectedSyncVersion,frameTexts,observationComplete:true,comparisonHeads:pair},
    {mode:'reopen',original:text,pin});
  }
 async function successorArchive({previousText,frameTexts=[],sourceArchive,text,expectedPortfolioDigest,expectedPinVersion,expectedLocalRevision,expectedSyncVersion},mode){
  const write=mode==='pin',prepare=mode==='prepare';
  if(!positive(expectedPinVersion)||typeof previousText!=='string'||
     previousText.length>CONFLICT_ARCHIVE_LIMIT||
     (write&&(!hash(expectedPortfolioDigest)||typeof text!=='string'||text.length>CONFLICT_ARCHIVE_LIMIT)))
   throw Error('sync-archive-invalid-successor');
  const incoming=boundedFrameBatch(frameTexts);
  const sourceRead=sourceArchive===undefined?null:readConflictSource(sourceArchive);
  const [source,originalHandoff,pin]=await Promise.all([sourceRead,prepare?readArchiveHandoff(db):null,readArchivePin(db)]);
  if(pin?.version!==expectedPinVersion||pin.digest!==await archiveDigest(previousText))
   throw Error('sync-archive-successor-pin-changed');
  return planSuccessor(pin,{previousText,incoming,source,expectedLocalRevision,expectedSyncVersion,
   text:write?text:undefined,expectedPortfolioDigest},{previous:pin,version:expectedPinVersion,write,
   handoff:prepare?{mode:'prepare',expected:originalHandoff,sourceDigest:source?.digest??null}:null});
 }
 function planSuccessor(pin,{previousText,incoming,source,expectedLocalRevision,expectedSyncVersion,text,expectedPortfolioDigest,verifiedDigest,intermediate},options){
  const unchanged=expectedLocalRevision===pin.localRevision&&expectedSyncVersion===pin.syncVersion;
  if(!unchanged&&(!positive(expectedLocalRevision)||expectedLocalRevision<=pin.localRevision||
     !positive(expectedSyncVersion)||expectedSyncVersion<=pin.syncVersion))throw Error('sync-archive-successor-needs-capture');
  const [header,...previousFrames]=previousText.split('\n',SYNC_GRAPH_LIMIT+2);
  const oldFrames=new Set(previousFrames);
  const combined=[...new Set([...previousFrames,...incoming,...(source?.frameTexts??[])])];
  if(unchanged&&combined.length===oldFrames.size)throw Error('sync-archive-successor-no-new-frames');
  return planFrames({expectedLocalRevision,expectedSyncVersion,frameTexts:combined,observationComplete:true},
   {source,previous:{pin,header,oldFrames},original:text,expectedPortfolioDigest,verifiedDigest,intermediate,
    pin:options});
 }
 async function resumeSuccessor({previousText,text,sourceText,frameTexts=[]},mode){
  const regenerate=mode==='regenerate';
  const supplied=regenerate?boundedFrameBatch(frameTexts):null;
  const expected=await readArchiveHandoff(db);
  if(!expected)throw Error('sync-archive-handoff-missing');
  const {previous,target,sourceDigest}=expected;
  if(typeof previousText!=='string'||previousText.length>CONFLICT_ARCHIVE_LIMIT||
     (!regenerate&&(typeof text!=='string'||text.length>CONFLICT_ARCHIVE_LIMIT))||
     (sourceDigest===null&&sourceText!==undefined))throw Error('sync-archive-handoff-file');
  const [oldDigest,newDigest,source]=await Promise.all([archiveDigest(previousText),regenerate?null:archiveDigest(text),
   sourceDigest===null?null:readConflictSource({text:sourceText,expectedDigest:sourceDigest})]);
  if(oldDigest!==previous.digest||(!regenerate&&newDigest!==target.digest))throw Error('sync-archive-handoff-file');
  // Regeneration reconstructs the original file from its inputs. Inspection
  // and confirmation always require the exact target bytes read back from disk.
  const incoming=regenerate?supplied:text.split('\n',SYNC_GRAPH_LIMIT+2).slice(1);
  return planSuccessor(previous,{previousText,incoming,source,text:regenerate?undefined:text,
   verifiedDigest:newDigest,expectedLocalRevision:target.localRevision,expectedSyncVersion:target.syncVersion},
   {handoff:{mode,expected}});
 }
 async function refreshPreparedSuccessor({previousText,text}){
  if(typeof previousText!=='string'||previousText.length>CONFLICT_ARCHIVE_LIMIT)throw Error('sync-archive-handoff-file');
  const [expected,current]=await Promise.all([readArchiveHandoff(db),readPortfolioSyncRecord(db,{forOutbox:true})]);
  if(!expected)throw Error('sync-archive-handoff-missing');
  const {previous,target}=expected;
  if(!current.portfolio||!current.sync||current.portfolio.revision<=target.localRevision||
     current.sync.version<=target.syncVersion)throw Error('sync-archive-refresh-needs-capture');
  const [oldDigest,source]=await Promise.all([archiveDigest(previousText),readConflictSource({text,expectedDigest:target.digest})]);
  if(oldDigest!==previous.digest)throw Error('sync-archive-handoff-file');
  // The saved candidate now supplies all earlier deliveries, including raw
  // frames. Both its queue prefix and the still-pinned predecessor must match.
  return planSuccessor(previous,{previousText,incoming:[],source,intermediate:target,
   expectedLocalRevision:current.portfolio.revision,expectedSyncVersion:current.sync.version},
   {previous,version:previous.version,handoff:{mode:'prepare',expected,sourceDigest:source.digest}});
 }
 async function selectedRestore({text,selectedHead,expectedPinVersion},mode,readback){
  const pin=await readArchivePin(db);
  const exportCopy=mode==='export'||mode==='encrypted'||mode==='recovery'||mode==='restore';
  const readSelection=mode==='reopen'||exportCopy;
  if(readSelection){
   if(!pin?.selectedHead)throw Error('sync-archive-selection-missing');
   if(mode==='restore'&&selectedHead!==pin.selectedHead)throw Error('sync-restore-confirmed-head');
   selectedHead=pin.selectedHead;
   if(mode==='reopen')expectedPinVersion=pin.version;
  }
  if(typeof selectedHead!=='string'||!positive(expectedPinVersion))throw Error('sync-archive-preview-selection');
  const retry=mode==='record'&&pin?.selectedHead===selectedHead&&pin.version===expectedPinVersion+1;
  if(pin?.version!==expectedPinVersion&&!retry)throw Error('sync-archive-pin-version');
  return reopenArchive({text,expectedDigest:pin.digest,expectedLocalRevision:pin.localRevision,
   expectedSyncVersion:pin.syncVersion},{digest:pin.digest,version:expectedPinVersion,selectedHead,
   recordSelection:mode==='record',readSelection,readback,exportCopy:exportCopy?mode:null});
 }
 return Object.freeze({
  async recover() {
   const {portfolio,sync}=await readPortfolioSyncRecord(db,{forOutbox:true});
   if(!portfolio||portfolio.deleted)throw Error('sync-outbox-no-local-portfolio');
   if(portfolio.syncEnrollmentRequired)throw Error('sync-outbox-enrollment-required');
   if(sync===null)return {state:null,summary:null,localRevision:portfolio.revision};
   const ticket=await verifySyncOutboxState(sync,verifySnapshotFrame);
   await checkCurrentHead(portfolio,sync,ticket);
   const after=await readPortfolioSyncRecord(db,{forOutbox:true});
   if(syncPreimageText(after.portfolio)!==syncPreimageText(portfolio)||syncPreimageText(after.sync)!==syncPreimageText(sync))
    throw Error('sync-outbox-recovery-race');
   return {state:readSyncOutboxState(ticket),summary:syncOutboxSummary(ticket,portfolio.revision),localRevision:portfolio.revision};
  },
  async capture({expectedLocalRevision,expectedSyncVersion,receipt,expectedPortfolioId,expectedEpochId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   const local=await snapshotPreimage(current.portfolio);
   // A caller's receipt may originate from another verifier with the same IDs.
   const bound=await verifyFrame(readVerifiedSyncFrame(receipt).frameText);
   const next=appendSyncOutboxState({ticket:current.ticket,receipt:bound,portfolio:local,
    expectedPortfolioId,expectedEpochId});
   return commit(current,next);
  },
  async begin({expectedLocalRevision,expectedSyncVersion,revisionId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   await checkCurrentHead(current.portfolio,current.sync,current.ticket);
   const next=advanceSyncOutboxState({ticket:current.ticket,revisionId,currentLocalRevision:current.portfolio.revision});
   const entry=next.entries.find(e=>e.revision.revisionId===revisionId);
   if(entry.status!=='uncertain')throw Error('sync-outbox-not-publishable');
   await commit(current,next); // NEVER expose sendable bytes before commit
   return {state:next,frameText:entry.frameText};
  },
  async planApply({expectedLocalRevision,expectedSyncVersion,revisions,observationComplete}) {
   const remoteDescriptors=structuredClone(revisions); // detach before crypto awaits
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   return finishPlan(current,remoteDescriptors,observationComplete);
  },
  planFrameApply(request){return planFrames(request);},
  createSuccessorConflictArchive(request){return successorArchive(request,'preview');},
  async prepareSuccessorFromFiles({previousText,sourceText,sourceDigest}){
   const [local,pin]=await Promise.all([readPortfolioSyncRecord(db,{forOutbox:true}),readArchivePin(db)]);
   if(!pin||!local.portfolio||!local.sync)throw Error('sync-archive-handoff-missing');
   if(sourceText===undefined&&sourceDigest!==undefined)throw Error('sync-archive-handoff-file');
   const sourceArchive=sourceText===undefined?undefined:{text:sourceText,expectedDigest:sourceDigest};
   return successorArchive({previousText,sourceArchive,expectedLocalRevision:local.portfolio.revision,
    expectedSyncVersion:local.sync.version,expectedPinVersion:pin.version},'prepare');
  },
  prepareSuccessorConflictArchive(request){return successorArchive(request,'prepare');},
  refreshPreparedSuccessorArchive(files){return refreshPreparedSuccessor(files);},
  regenerateSuccessorArchive(files){return resumeSuccessor(files,'regenerate');},
  inspectSuccessorHandoff(files){return resumeSuccessor(files,'inspect');},
  confirmSuccessorHandoff(files){return resumeSuccessor(files,'confirm');},
  pinSuccessorConflictArchive(request){return successorArchive(request,'pin');},
  createConflictArchive(request){return planFrames(request,{mode:'create'});},
  reopenConflictArchive(request){return reopenArchive(request);},
  async archivePinVersion(){return (await readArchivePin(db))?.version??0;},
  async pinConflictArchive({expectedPinVersion:version,expectedDigest,...request}){
   if(!Number.isSafeInteger(version)||version<0)throw Error('sync-archive-pin-version');
   return reopenArchive({...request,expectedDigest},{digest:expectedDigest,version,write:true});
  },
  async reopenPinnedConflictArchive({text,comparisonHeads,includeOverview=false}){
   const pair=comparisonHeads===undefined?undefined:structuredClone(comparisonHeads);
   const pin=await readArchivePin(db);
   if(!pin)throw Error('sync-archive-pin-missing');
   return reopenArchive({text,expectedDigest:pin.digest,expectedLocalRevision:pin.localRevision,
    expectedSyncVersion:pin.syncVersion,comparisonHeads:pair},{digest:pin.digest,version:pin.version,write:false,includeOverview:includeOverview===true});
  },
  previewPinnedRestore(request){return selectedRestore(request,'preview');},
  recordPinnedSelection(request){return selectedRestore(request,'record');},
  reopenPinnedSelection({text}){return selectedRestore({text},'reopen');},
  exportPinnedFinancialCopy({text,expectedPinVersion}){return selectedRestore({text,expectedPinVersion},'export');},
  exportEncryptedPinnedFinancialCopy({text,expectedPinVersion}){return selectedRestore({text,expectedPinVersion},'encrypted');},
  exportPinnedRecoveryFiles({text,expectedPinVersion}){return selectedRestore({text,expectedPinVersion},'recovery');},
  verifyPinnedRecoveryFiles({text,expectedPinVersion,localFile,selectedFile,password}){
   return selectedRestore({text,expectedPinVersion},'recovery',{localFile,selectedFile,password});
  },
  async reopenLocalRecoveryCase({text,localFile,selectedFile,password}={}){
   const files={text,localFile,selectedFile};
   const committed=await reopenLocalRecoveryCase(db,files);
   if(committed.status!=='undetermined'||typeof password!=='string'||!password.length)return committed;
   // Before the first restore there is no receipt. Verify the two ordinary
   // backup files against the pinned conflict again, including its final CAS.
   try{
    const pin=await readArchivePin(db);
    if(!pin?.selectedHead)return committed;
    const result=await selectedRestore({text,expectedPinVersion:pin.version},'recovery',{localFile,selectedFile,password});
    if(!result.recoveryFilesVerified)return committed;
    return {status:'verified-pending-selection',selectedHead:result.restorePreview.selectedHead,
     expectedPinVersion:result.pinVersion,localRevision:pin.localRevision,rollbackAvailable:false,applyAuthorized:false};
   }catch{return committed;}
  },
  rollbackPinnedLocalCopy(request){return rollbackPinnedLocalCopy(db,request);},
  previewPinnedLocalRollback(request){return previewPinnedLocalRollback(db,request);},
  inspectPinnedLocalRestore(request){return inspectPinnedLocalRestore(db,request);},
  restorePinnedLocalCopy({text,expectedPinVersion,confirmedHead,localFile,selectedFile,password}){
   return selectedRestore({text,expectedPinVersion,selectedHead:confirmedHead},'restore',{localFile,selectedFile,password});
  },
  async confirm() {
   // A2: a verifier receipt authenticates bytes, NOT where they were obtained.
   // No remote transport/provenance issuer exists yet. Fail closed, including
   // caller-supplied URLs, object IDs, HTTP flags or a locally reverified frame.
   throw Error('sync-outbox-remote-provenance-unavailable');
  }
 });
}
