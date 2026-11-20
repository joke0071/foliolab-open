import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {snapshotFrame} from './sync-outbox-fixture.mjs';
import {appendBookings} from './flh04-source-restore-fixture.mjs';

// Continue on the previously verified profile. One branch arrived as raw
// ciphertext before the local booking. Only the saved candidate supplies it now.
export async function checkPendingBooking({profile,open,operation,directory,file,readback,saved,queue,version}){
 const page=profile.page;
 const remoteRaw=await appendBookings(page,saved.raw,'remote-followup',['3.125']);
 const raw=snapshotFrame(remoteRaw,'side','A2','4','c1'.repeat(32),undefined,'device-other');
 const middle=await page.evaluate(req=>window.syncTest.api.prepareSuccessorConflictArchive(req),{
  previousText:readback,expectedPinVersion:version,expectedLocalRevision:saved.revision,expectedSyncVersion:queue.version,frameTexts:[raw]});
 const intermediate=join(directory,'pending.flh');await writeFile(intermediate,middle.archive.text);
 const booked=await operation(page,'save',{revision:saved.revision,raw:await appendBookings(page,saved.raw,'local-followup',['0.50'])});
 const nextQueue=await operation(page,'capture',{expectedLocalRevision:booked.revision,expectedSyncVersion:queue.version,
  frameText:snapshotFrame(booked.raw,'A3','A2','4','c2'.repeat(32),undefined,'device-A')});
 await assert.rejects(async()=>page.evaluate(req=>window.syncTest.api.confirmSuccessorHandoff(req),
  {previousText:readback,text:await readFile(intermediate,'utf8')}),/stale-preimage/);
 await page.evaluate(async()=>{
  const {showArchiveHandoff}=await import('/experimental/sync/sync-archive-handoff-view.js');
  showArchiveHandoff(document.body,window.syncTest.api);
 });
 await page.getByLabel('Bisheriges Archiv').setInputFiles(file);
 await page.getByLabel('Gespeichertes Zielarchiv').setInputFiles(intermediate);
 await page.getByRole('button',{name:'Neue lokale Buchungen einbeziehen'}).click();
 const status=page.locator('output[role=status]');await status.filter({hasText:'als Quellarchiv'}).waitFor();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Zielarchiv speichern'}).click()]);
 assert.match(download.suggestedFilename(),/^FolioLab-Konfliktarchiv-[0-9a-f]{64}\.flh$/);
 const finalFile=join(directory,download.suggestedFilename());await download.saveAs(finalFile);
 await profile.context.close();await open(profile);
 const fresh=profile.page,files={previousText:await readFile(file,'utf8'),sourceText:await readFile(intermediate,'utf8'),
  text:await readFile(finalFile,'utf8')};
 const pending=await fresh.evaluate(files=>window.syncTest.api.inspectSuccessorHandoff(files),files);
 assert.equal(pending.status,'pending-confirmation');assert.equal(pending.pinVersion,version);
 const bound=await fresh.evaluate(files=>window.syncTest.api.confirmSuccessorHandoff(files),files);
 assert.deepEqual(bound.heads,['A3','B2','C','side']);assert.equal(bound.pinVersion,version+1);
 let pinVersion=bound.pinVersion;
 for(const [selectedHead,source,exact] of [['A3',booked.raw,'13.5'],['side',remoteRaw,'16.125']]){
  const selection=await fresh.evaluate(req=>window.syncTest.api.recordPinnedSelection(req),
   {text:files.text,selectedHead,expectedPinVersion:pinVersion});
  pinVersion=selection.pinVersion;
  const result=await fresh.evaluate(req=>window.syncTest.api.exportPinnedFinancialCopy(req),
   {text:files.text,expectedPinVersion:pinVersion});
  const data=JSON.parse(source);delete data.settings;
  assert.deepEqual(JSON.parse(result.financialCopy),data);assert.equal(data.positions[0].quantityExact,exact);
 }
 assert.deepEqual(await operation(fresh,'read'),{portfolio:booked,sync:nextQueue});
 console.log(JSON.stringify({kind:'FLH04PendingBooking',status:'PASS',engine:process.env.ENGINE,heads:bound.heads}));
}
