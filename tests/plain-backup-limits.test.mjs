import test from 'node:test';
import assert from 'node:assert/strict';
import {localJSONBackupFile,assertLocalBackupFileSize,LOCAL_BACKUP_FILE_BYTES} from '../src/backup-limits.js';
import {safeImport} from '../src/model.js';
import {plainBackupBoundaryFixture} from './plain-backup-fixture.mjs';

test('normal plain portfolio JSON keeps its exact readable bytes and MIME type',async()=>{
 const json=JSON.stringify({version:3,quantityExact:'1.000000000000000001',history:{note:'ä 😀'}},null,2);
 const file=localJSONBackupFile(json);assert.equal(file.type,'application/json');assert.equal(await file.text(),json);
 assert.throws(()=>localJSONBackupFile(null),/ungültige/);
});
test('accepted legacy revision metadata survives whitespace-only compaction at the actual file boundary',async()=>{
 const f=plainBackupBoundaryFixture(),before=JSON.stringify(f.model);
 assertLocalBackupFileSize(f.compactBytes);safeImport(JSON.parse(f.compact));assert.throws(()=>assertLocalBackupFileSize(f.prettyBytes));
 const file=localJSONBackupFile(f.pretty),text=await file.text();assertLocalBackupFileSize(file.size);
 assert.deepEqual(JSON.parse(text),JSON.parse(f.pretty));assert.equal(JSON.stringify(f.model),before);
 assert.equal(JSON.parse(text).snapshots[0].revisions[0].note.length,f.model.snapshots[0].revisions[0].note.length);
});
test('plain JSON checks UTF-8 bytes at the exact reader boundary and never cuts oversized metadata',async()=>{
 const overhead=new Blob([JSON.stringify({note:''})]).size;
 const available=LOCAL_BACKUP_FILE_BYTES-overhead;
 const note='😀'.repeat(Math.floor(available/4))+'x'.repeat(available%4),json=JSON.stringify({note});
 assert.ok(json.length<LOCAL_BACKUP_FILE_BYTES);assert.equal(localJSONBackupFile(json).size,LOCAL_BACKUP_FILE_BYTES);
 assert.throws(()=>localJSONBackupFile(JSON.stringify({note:note+'x'})),/20 MB.*unverändert/);
 const oversized=JSON.stringify({note:'😀'.repeat(5000000)});assert.throws(()=>localJSONBackupFile(oversized),/20 MB/);
 assert.equal(JSON.parse(oversized).note.length,10000000);
});
