import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {snapshotFrame} from './sync-outbox-fixture.mjs';
import {appendBookings} from './flh04-source-restore-fixture.mjs';

// CI serves the actual #393 modules alongside the current client on the same
// synthetic origin. The old client writes the pin and both files before restart.
export async function checkPreviousArchiveClient({profile,open,operation,request,directory}){
 const page=profile.page;
 await page.evaluate(async()=>{
  const {createSyncFrameVerifier}=await import('/flh04-previous/experimental/sync/sync-frame-verifier.js');
  const {createSyncOutboxStorage}=await import('/flh04-previous/experimental/sync/sync-outbox-storage.js');
  const key=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(17),'HKDF',false,['deriveKey']);
  window.previousClient=createSyncOutboxStorage(window.syncTest.db,createSyncFrameVerifier({portfolioId:'P',epochId:'12'.repeat(16),key}));
  if('prepareSuccessorConflictArchive' in window.previousClient)throw Error('expected the pre-handoff client');
 });
 const firstRaw=await appendBookings(page,profile.before.portfolio.raw,'legacy',['1.25']);
 const laterRaw=await appendBookings(page,firstRaw,'legacy-next',['0.125']);
 const firstRequest={...profile.cas,previousText:request.text,expectedPinVersion:request.expectedPinVersion,
  frameTexts:[snapshotFrame(firstRaw,'C2','C','3','da'.repeat(32),undefined,'device-old')]};
 const first=await page.evaluate(req=>window.previousClient.createSuccessorConflictArchive(req),firstRequest);
 const currentFile=join(directory,'old-current.flh');await writeFile(currentFile,first.archive.text);
 const currentText=await readFile(currentFile,'utf8');
 const pinned=await page.evaluate(req=>window.previousClient.pinSuccessorConflictArchive(req),
  {...firstRequest,text:currentText,expectedPortfolioDigest:first.successorPortfolioDigest});
 const next=await page.evaluate(req=>window.previousClient.createSuccessorConflictArchive(req),{
  ...profile.cas,previousText:currentText,expectedPinVersion:pinned.pinVersion,
  frameTexts:[snapshotFrame(laterRaw,'C3','C2','4','db'.repeat(32),undefined,'device-old')]});
 const savedFile=join(directory,'old-pending.flh');await writeFile(savedFile,next.archive.text);
 await profile.context.close();await open(profile);
 const fresh=profile.page;
 await fresh.evaluate(async()=>{
  const {showArchiveHandoff}=await import('/experimental/sync/sync-archive-handoff-view.js');
  showArchiveHandoff(document.body,window.syncTest.api);
 });
 const status=fresh.locator('output[role=status]'),target=fresh.getByLabel('Gespeichertes Zielarchiv');
 const inspect=fresh.getByRole('button',{name:'Dateien prüfen'}),confirm=fresh.getByRole('button',{name:'Übernahme bestätigen'});
 await target.setInputFiles(currentFile);await inspect.click();
 await status.filter({hasText:'kein Vorbereitungsnachweis'}).waitFor();assert.equal(await confirm.isDisabled(),true);
 await fresh.getByLabel('Bisheriges Archiv').setInputFiles(currentFile);await target.setInputFiles(savedFile);
 await fresh.getByText('Neue Übernahme vorbereiten',{exact:true}).click();
 const checksum=fresh.getByLabel('Frühere Prüfsumme der Zieldatei (falls vorhanden)');
 const adopt=fresh.getByRole('button',{name:'Vorhandene Zieldatei neu vorbereiten'});
 await checksum.fill(first.archive.digest);await adopt.click();await status.filter({hasText:'fehlgeschlagen'}).waitFor();
 assert.equal(await fresh.evaluate(()=>window.syncTest.api.archivePinVersion()),pinned.pinVersion);
 await checksum.fill(next.archive.digest);await adopt.click();await status.filter({hasText:'neu vorbereitet'}).waitFor();
 assert.equal(await confirm.isDisabled(),true);await inspect.click();await status.filter({hasText:'Bestätigung steht aus'}).waitFor();
 await confirm.click();await status.filter({hasText:'Zielarchiv ist bestätigt'}).waitFor();
 const savedText=await readFile(savedFile,'utf8');
 const opened=await fresh.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text}),savedText);
 assert.equal(opened.pinVersion,pinned.pinVersion+1);assert.deepEqual(opened.heads,['A','B','C3']);
 const selected=await fresh.evaluate(req=>window.syncTest.api.recordPinnedSelection(req),
  {text:savedText,selectedHead:'C3',expectedPinVersion:opened.pinVersion});
 const copy=await fresh.evaluate(req=>window.syncTest.api.exportPinnedFinancialCopy(req),
  {text:savedText,expectedPinVersion:selected.pinVersion});
 const data=JSON.parse(laterRaw);delete data.settings;
 assert.deepEqual(JSON.parse(copy.financialCopy),data);assert.equal(data.positions[0].quantityExact,'11.375');
 assert.deepEqual(await operation(fresh,'read'),profile.before);
 console.log(JSON.stringify({kind:'FLH04PreviousArchiveClient',status:'PASS',engine:process.env.ENGINE,previous:'b6b5678a'}));
}
