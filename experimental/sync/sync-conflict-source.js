import {archiveDigest} from './sync-restore-status.js';
import {planSyncRevisions,SYNC_GRAPH_LIMIT} from './sync-revisions.js';
import {SYNC_OUTBOX_TEXT_LIMIT} from './sync-outbox-state.js';

export const CONFLICT_ARCHIVE_LIMIT=SYNC_OUTBOX_TEXT_LIMIT+SYNC_GRAPH_LIMIT+100;

// The sender retains the digest separately. The header describes the sender's
// local queue. Only the sender can compare that commitment with its own IDB.
export async function readConflictSource(source){
 const {text,expectedDigest}=source??{};
 if(typeof text!=='string'||text.length>CONFLICT_ARCHIVE_LIMIT||
    typeof expectedDigest!=='string'||!/^[a-f0-9]{64}$/.test(expectedDigest))throw Error('sync-archive-invalid-source');
 if(await archiveDigest(text)!==expectedDigest)throw Error('sync-archive-source-digest');
 const [header,...frameTexts]=text.split('\n',SYNC_GRAPH_LIMIT+2);
 const match=/^FolioLabConflict\/1 ([1-9][0-9]{0,15}) ([1-9][0-9]{0,15}) [0-9a-f]{64}$/.exec(header);
 if(!match||!Number.isSafeInteger(Number(match[1]))||!Number.isSafeInteger(Number(match[2]))||
    frameTexts.length<2||frameTexts.length>SYNC_GRAPH_LIMIT)throw Error('sync-archive-invalid-source');
 return {localRevision:Number(match[1]),header,frameTexts,digest:expectedDigest};
}

// Every descriptor comes from verification with the recipient's key, including
// overlapping frames. The file must be a complete conflict on its own.
export function checkConflictSource(source,portfolioId,verified){
 const revisions=source.frameTexts.map(text=>verified.get(text));
 for(let i=1;i<revisions.length;i++){
  if(revisions[i-1].revisionId>=revisions[i].revisionId)throw Error('sync-archive-source-order');
 }
 const graph=planSyncRevisions({portfolioId,localRevision:source.localRevision,localHead:null,
  revisions,observationComplete:true});
 if(graph.status==='blocked')throw Error('sync-archive-source-'+graph.reason);
 if(graph.heads.length<2)throw Error('sync-archive-source-needs-conflict');
}
