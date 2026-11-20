import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium, firefox, webkit} from 'playwright';
import {openApp, readAppState, openBackupControls, saveTargetBackup, restoreDownload} from './flh04-backup-app.mjs';
import {checkConcurrentImport, checkReturnAndBook, checkInterruptedImports, checkPostCommitDeposits} from './flh04-regular-import.mjs';
import {blankModel,createProvider,createPosition,backup} from '../src/model.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';

function commonPortfolio(){
 const model=blankModel();
 model.providers.push(createProvider({id:'broker',name:'Synthetic broker',type:'broker'}));
 model.positions.push(createPosition({id:'cash',providerId:'broker',kind:'cash',name:'EUR',quantity:10,price:1,currency:'EUR'},model));
 const session=validateHistorySession({id:'accepted',chain:'eth',walletKey:'test-wallet',acceptedAt:NOW,
  events:[event({quantityBaseUnits:'90071992547409930001'})],streams:[stream()],quotes:[],issues:[]});
 model.walletHistory={schema:1,sessions:[session],pending:[]};
 return backup(model,{includeHistory:true});
}

const origin = process.env.RESTORE_TEST_ORIGIN || 'http://127.0.0.1:4173';
const sourcePassword = 'Synthetic source backup password';
const targetPassword = 'Synthetic target backup password';

async function exercise(browserType, directory) {
 const target = join(directory, 'target');
 const source = await browserType.launchPersistentContext(join(directory, 'source'));
 const original = JSON.parse(commonPortfolio());
 const expected = structuredClone(original);
 original.providers[0].name = 'Private branch B';
 expected.performanceFlowTrackingSince = '2026-11-01';
 delete original.settings;
 delete expected.settings;
 const beforeFile = join(directory, 'target-before.json');
 const headFile = join(directory, 'source-C.json');
 const sourceB = join(directory, 'source-B.json');
 try {
  const page = await openApp(source, origin);
  const files = await page.evaluate(async ({models, password}) => {
   const vault = await import('/src/backup-vault.js');
   const {createCompleteBackup} = await import('/src/complete-backup.js');
   await vault.configureBackupPassword(password, password);
   return Promise.all(models.map(model => vault.encryptWithBackupPassword(
    JSON.stringify(createCompleteBackup(model, null, model.walletHistory)))));
  }, {models: [original, expected], password: sourcePassword});
  await writeFile(sourceB, files[0]);
  await writeFile(headFile, files[1]);
 } finally { await source.close(); }
 const before = await restoreDownload({browserType, target, origin, file: sourceB,
  password: sourcePassword, expected: original, label: 'B', initialPassword: targetPassword});
 const context = await browserType.launchPersistentContext(target);
 const probe = {browserType, target, origin, beforeFile, original, headFile, password: sourcePassword,
  targetPassword, expected, directory};
 try {
  const page = await openApp(context, origin);
  assert.deepEqual(await readAppState(page), before);
  await openBackupControls(page);
  await saveTargetBackup(page, beforeFile);
  await checkConcurrentImport({...probe, page, before});
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 } finally { await context.close(); }
 if (browserType === chromium) await checkInterruptedImports(probe);
 await checkPostCommitDeposits(probe);
 const reopened = await browserType.launchPersistentContext(target);
 try {
  await checkReturnAndBook({...probe, page: await openApp(reopened, origin)});
 } finally { await reopened.close(); }
}

for (const engine of (process.env.RESTORE_ENGINES || 'chromium').split(',')) {
 const browserType = {chromium, firefox, webkit}[engine];
 assert.ok(browserType, engine);
 const directory = await mkdtemp(join(tmpdir(), 'foliolab-restore-'));
 try { await exercise(browserType, directory); }
 finally { await rm(directory, {recursive: true, force: true}); }
}
