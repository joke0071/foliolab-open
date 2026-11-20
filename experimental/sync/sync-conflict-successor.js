import {syncPreimageText} from '../../src/atomic-storage.js';
import {archiveDigest} from './sync-restore-status.js';

// The old archive contains sibling frames as well as local frames. Its header
// commits to the original LOCAL queue. Only an exact prefix proves continuity.
export async function describeConflictSuccessor(previous,current,remote,frames,heads){
 const {pin,header,oldFrames}=previous;
 const entries=current.sync.entries.filter(entry=>entry.capturedLocalRevision<=pin.localRevision);
 if(entries.at(-1)?.capturedLocalRevision!==pin.localRevision||entries.length===current.sync.entries.length)
  throw Error('sync-archive-successor-lineage');
 const prefix={...current.sync,version:pin.syncVersion,entries};
 if(header!=='FolioLabConflict/1 '+pin.localRevision+' '+pin.syncVersion+' '+await archiveDigest(syncPreimageText(prefix)))
  throw Error('sync-archive-successor-lineage');

 const nodes=[...current.sync.entries.map(entry=>entry.revision),...remote];
 const parents=new Map(nodes.map(node=>[node.revisionId,node.parentId]));
 const oldIds=nodes.filter(node=>oldFrames.has(frames.get(node.revisionId))).map(node=>node.revisionId);
 const oldParents=new Set(oldIds.map(id=>parents.get(id)));
 const descendants=new Map(oldIds.filter(id=>!oldParents.has(id)).sort().map(id=>[id,[]]));
 const additionalHeads=[];
 for(const head of heads){
  let id=head;
  while(id!==null&&!descendants.has(id))id=parents.get(id);
  if(id===null)additionalHeads.push(head);
  else descendants.get(id).push(head);
 }
 return {previousSelection:pin.selectedHead??null,
  branches:[...descendants].map(([previousHead,currentHeads])=>({previousHead,currentHeads})),additionalHeads};
}
