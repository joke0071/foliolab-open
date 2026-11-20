// Both files use the ordinary password-backup reader. The caller checks the
// portfolio, queue and selection again after this asynchronous work completes.
import {encryptWithBackupPassword,decryptPasswordBackup} from '../../src/backup-vault.js';
import {assertLocalBackupFileSize} from '../../src/backup-limits.js';

function envelope(text){
 if(typeof text!=='string')throw Error('sync-recovery-file-missing');
 assertLocalBackupFileSize(text.length);
 assertLocalBackupFileSize(new Blob([text]).size);
 return JSON.parse(text);
}

export async function prepareRecoveryFiles(local,selected,readback){
 const files=readback??{localFile:await encryptWithBackupPassword(local),
  selectedFile:await encryptWithBackupPassword(selected)};
 const first=envelope(files.localFile),second=envelope(files.selectedFile);
 if(first.keyId!==second.keyId||first.iv===second.iv||
    JSON.stringify(first.wrap)!==JSON.stringify(second.wrap))throw Error('sync-recovery-file-pair');
 if(!readback)return {recoveryFiles:files};
 if(await decryptPasswordBackup(first,readback.password)!==local||
    await decryptPasswordBackup(second,readback.password)!==selected)throw Error('sync-recovery-file-content');
 return {recoveryFilesVerified:true};
}
