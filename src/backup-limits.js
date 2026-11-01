/** Existing reader limits, shared by export preflight and restore. No limit is raised. */
export const LEGACY_BACKUP_DATA_CHARS=6000000;
export const PASSWORD_BACKUP_PLAIN_CHARS=10000000;
export const PASSWORD_BACKUP_CIPHER_BYTES=15000000;
export const DRIVE_BACKUP_FILE_CHARS=15000000;
export const LOCAL_BACKUP_FILE_BYTES=20000000;
const E=new TextEncoder();
const tooLarge=limit=>Error('Backup ist zu groß für die sichere Wiederherstellung ('+limit+'). Es wurde keine neue Sicherung erstellt; vorhandene Daten und Backups bleiben unverändert. Bitte vorhandene Sicherungen behalten und den Umfang prüfen.');
export function assertLocalBackupFileSize(bytes){
 if(bytes>LOCAL_BACKUP_FILE_BYTES)throw Error('Backup ist zu groß (max. 20 MB). Vorhandene Daten bleiben unverändert.');
}
/** Prepare already serialized portfolio JSON for the unchanged local reader.
 * Normal exports retain their readable formatting. At the size boundary only
 * JSON whitespace is removed; legacy revision/history metadata is never cut.
 * An unportable file throws before any download URL or success acknowledgement.
 */
export function localJSONBackupFile(json){
 if(typeof json!=='string')throw Error('Backup enthält ungültige Dateidaten.');
 const options={type:'application/json'};
 let file=new Blob([json],options);
 if(file.size>LOCAL_BACKUP_FILE_BYTES)file=new Blob([JSON.stringify(JSON.parse(json))],options);
 assertLocalBackupFileSize(file.size);
 return file;
}
export function assertDriveBackupTextSize(text){
 if(typeof text!=='string')throw Error('Backup enthält ungültige Dateidaten.');
 if(text.length>DRIVE_BACKUP_FILE_CHARS)throw Error('Drive-Backup ist zu groß (max. 15 Millionen Zeichen). Vorhandene Daten bleiben unverändert.');
}
/** Return exactly the bytes that will be encrypted; account for the GCM tag,
 * Base64 padding and the actual v2 envelope (characters AND UTF-8 bytes)
 * before allocating ciphertext. Unknown legacy wrap metadata is never stripped.
 * v2 is shared by local download and Drive, so every new file fits both readers.
 * Existing larger local-only v2 backups remain readable under their old limits.
 */
export function preflightBackup(plain,format,envelopeOverhead=0,envelopeBytes=envelopeOverhead){
 if(typeof plain!=='string')throw Error('Backup enthält ungültige Portfoliodaten.');
 if(!['v1','v2'].includes(format))throw Error('Unbekanntes Backupformat.');
 if(format==='v2'&&plain.length>PASSWORD_BACKUP_PLAIN_CHARS)throw tooLarge('max. 10 Millionen Textzeichen');
 const raw=E.encode(plain),cipherBytes=raw.byteLength+16,base64Chars=4*Math.ceil(cipherBytes/3);
 if(format==='v1'&&base64Chars>LEGACY_BACKUP_DATA_CHARS)throw tooLarge('Altformat: max. 6 Millionen Base64-Zeichen');
 if(format==='v2'){
  if(!Number.isSafeInteger(envelopeOverhead)||envelopeOverhead<0||!Number.isSafeInteger(envelopeBytes)||envelopeBytes<envelopeOverhead)throw Error('Backup-Dateigröße konnte nicht geprüft werden.');
  if(cipherBytes>PASSWORD_BACKUP_CIPHER_BYTES)throw tooLarge('max. 15 MB verschlüsselte Daten');
  if(base64Chars+envelopeOverhead>DRIVE_BACKUP_FILE_CHARS)throw tooLarge('max. 15 Millionen Zeichen einschließlich Verschlüsselung');
  if(base64Chars+envelopeBytes>LOCAL_BACKUP_FILE_BYTES)throw tooLarge('max. 20 MB Dateigröße einschließlich Verschlüsselung');
 }
 return raw;
}
