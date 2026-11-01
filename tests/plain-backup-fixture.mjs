import {blankModel,safeImport,backup} from '../src/model.js';
import {LOCAL_BACKUP_FILE_BYTES} from '../src/backup-limits.js';

// Legacy revision metadata is preserved by the current reader. Keep it intact;
// only serialization whitespace may change when preparing a readable download.
export function plainBackupBoundaryFixture({tooLarge=false}={}){
 const m=blankModel();m.settings.autoRefresh=false;
 m.snapshots=[{id:'SYN-LEGACY-REVISION',date:'2025-01-01',total:100,totalEURExact:'100',source:'manual',valuationStatus:'manual',revisions:[{date:'2024-12-31',totalEURExact:'100',note:'',source:'manual',valuationStatus:'manual'}]}];
 const model=safeImport(m),base=JSON.stringify(model);
 const overhead=new Blob([backup(model)]).size-new Blob([base]).size;
 const target=LOCAL_BACKUP_FILE_BYTES-Math.floor(overhead/2);
 model.snapshots[0].revisions[0].note=tooLarge?'😀'.repeat(LOCAL_BACKUP_FILE_BYTES/4):'x'.repeat(target-new Blob([base]).size);
 const compact=JSON.stringify(model),pretty=backup(model);
 return {model,compact,pretty,compactBytes:new Blob([compact]).size,prettyBytes:new Blob([pretty]).size};
}
