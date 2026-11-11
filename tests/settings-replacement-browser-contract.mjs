import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
/** Real delivered reset/file handlers + IndexedDB + encrypted UI file input.
 * Drive is deliberately covered by the source callback adapter, not OAuth.
 */
export async function settingsReplacementBrowserContract({p:parent,engine}){
 const context=await parent.context().browser().newContext({viewport:{width:320,height:800}}),p=await context.newPage();
 const base=new URL('./',parent.url()).href,origin=new URL(base).origin;let providerRequests=0;
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){providerRequests++;return route.abort();}return route.continue();});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const keys=['alphaVantageKey','marketstackKey','coinGeckoKey','etherscanKey','binplorerKey','eodhdWorkerAccessToken'];
 const formValues=()=>p.locator('#apiSettings').evaluate(f=>Object.fromEntries([...f.elements].filter(e=>e.name).map(e=>[e.name,e.value])));
 const field=name=>p.locator('#apiSettings').locator('[name='+name+']').or(p.locator('[form=apiSettings][name='+name+']'));
 const more=async()=>{await p.locator('#mobileNav [data-page=more]').click();await p.locator('#deleteAll').evaluate(el=>{for(let n=el.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});for(const name of ['coinGeckoKey','eodhdWorkerAccessToken'])await field(name).evaluate(el=>{for(let n=el.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});};
 const dialogAction=async(action,accept)=>{const pending=p.waitForEvent('dialog'),result=action();const d=await pending;if(accept)await d.accept();else await d.dismiss();await result;};
 const draft=async()=>{await field('coinGeckoKey').fill('SYNTHETIC_DRAFT');await field('coinGeckoKey').evaluate(el=>{if(el.type==='password')el.closest('.credential-control').querySelector('.credential-toggle').click();});};
 const assertMasked=async()=>{for(const key of keys){assert.equal(await field(key).getAttribute('type'),'password',key);assert.equal(await field(key).evaluate(el=>el.closest('.credential-control').querySelector('.credential-toggle').getAttribute('aria-pressed')),'false',key);}};
 const restore=async(file,{acceptSettings=true,cancelPassword=false,cancelRestore=false,password='SYNTHETIC backup password 308'}={})=>{
  const seen=[];
  const handler=async d=>{seen.push(d.type());if(d.type()==='prompt'){if(cancelPassword)await d.dismiss();else await d.accept(password);}else if(d.message().includes('möglicherweise API-Schlüssel')){if(acceptSettings)await d.accept();else await d.dismiss();}else if(cancelRestore)await d.dismiss();else await d.accept();};
  p.on('dialog',handler);
  try{await p.locator('#backupFile').setInputFiles({name:'SYNTHETIC-settings.json',mimeType:'application/json',buffer:Buffer.from(file)});await p.waitForFunction(()=>!document.getElementById('backupStatus').classList.contains('lab-loading'));}
  finally{p.off('dialog',handler);}
  return seen;
 };
 try{
  await p.goto(base);await ready();
  await p.evaluate(async()=>{const {blankModel}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;for(const key of ['alphaVantageKey','marketstackKey','coinGeckoKey','etherscanKey','binplorerKey','eodhdWorkerAccessToken'])m.settings[key]='SYNTHETIC_STORED';const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});
  await p.reload();await ready();await more();await draft();const before=await record(),values=await formValues();
  await dialogAction(()=>p.locator('#deleteAll').click(),false);assert.deepEqual(await record(),before);assert.deepEqual(await formValues(),values);
  // An actual failed IDB write must retain the entire draft/canonical record.
  await p.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){IDBObjectStore.prototype.put=original;throw new DOMException('SYNTHETIC reset failure','QuotaExceededError');};});
  await dialogAction(()=>p.locator('#deleteAll').click(),true);await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('nicht vollständig gelöscht'));assert.deepEqual(await record(),before);assert.deepEqual(await formValues(),values);
  await dialogAction(()=>p.locator('#deleteAll').click(),true);await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('einschließlich alter Migrationskopien gelöscht'));
  const tombstone=await record();assert.equal(tombstone.raw,null);assert.equal(tombstone.settings,null);assert.equal(tombstone.revision,before.revision+1);for(const key of keys)assert.equal(await field(key).inputValue(),'');await assertMasked();
  // Build a real encrypted complete backup using the app's existing vault.
  const files=await p.evaluate(async()=>{
   const {blankModel,backup}=await import('/src/model.js'),{createCompleteBackup}=await import('/src/complete-backup.js'),{configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');
   const password='SYNTHETIC backup password 308';await configureBackupPassword(password,password);const m=blankModel();m.settings.autoRefresh=false;for(const key of ['alphaVantageKey','marketstackKey','coinGeckoKey','etherscanKey','binplorerKey','eodhdWorkerAccessToken'])m.settings[key]='SYNTHETIC_IMPORTED';
   const config={settings:m.settings,drive:{clientId:'',mode:'off',retention:3}};
   return {encrypted:await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(backup(m)),config))),plain:backup(m)};
  });
  // Abort/password-error/missing/declined settings preserve drafts, bytes and visibility.
  await draft();const draftValues=await formValues();
  for(const options of [{cancelPassword:true},{cancelRestore:true},{password:'SYNTHETIC wrong password'}]){const before=await record();await restore(files.encrypted,options);assert.deepEqual(await record(),before);assert.deepEqual(await formValues(),draftValues);}
  await restore(files.plain);assert.deepEqual(await formValues(),draftValues);assert.equal((await record()).settings.coinGeckoKey,'');
  await restore(files.encrypted,{acceptSettings:false});assert.deepEqual(await formValues(),draftValues);assert.equal((await record()).settings.coinGeckoKey,'');
  const beforeFailure=await record();await p.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){IDBObjectStore.prototype.put=original;throw new DOMException('SYNTHETIC restore failure','QuotaExceededError');};});
  await restore(files.encrypted);assert.deepEqual(await record(),beforeFailure);assert.deepEqual(await formValues(),draftValues);
  const beforeSuccess=await record();const seen=await restore(files.encrypted);assert.deepEqual(seen,['prompt','confirm','confirm']);
  await p.waitForFunction(()=>document.getElementById('toast').textContent.startsWith('Backup wiederhergestellt.'));
  const imported=await record();assert.equal(imported.revision,beforeSuccess.revision+1);for(const key of keys){assert.equal(imported.settings[key],'SYNTHETIC_IMPORTED');assert.equal(await field(key).inputValue(),'SYNTHETIC_IMPORTED');}await assertMasked();
  const raw=JSON.parse(imported.raw);for(const key of ['positions','bookings','journalEntries','accounts','providers','snapshots'])assert.deepEqual(raw[key],[],key);
  await mkdir('artifacts/gates/settings-replacement',{recursive:true});await p.screenshot({path:`artifacts/gates/settings-replacement/${engine}.png`,fullPage:true});
  // Ordinary navigation/render keeps a new draft, then reload returns canonical settings.
  await draft();await p.locator('#mobileNav [data-page=dashboard]').click();await more();assert.equal(await field('coinGeckoKey').inputValue(),'SYNTHETIC_DRAFT');assert.deepEqual(await record(),imported);
  await p.reload();await ready();await more();assert.equal(await field('coinGeckoKey').inputValue(),'SYNTHETIC_IMPORTED');await assertMasked();assert.deepEqual(await record(),imported);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);assert.equal(providerRequests,0);
  await mkdir('artifacts/gates/settings-replacement',{recursive:true});await writeFile(`artifacts/gates/settings-replacement/${engine}.json`,JSON.stringify({engine,result:'PASS',base,actualIndexedDB:true,actualEncryptedUIFileRestore:true,driveOAuthClaim:false,providerRequests,checks:['reset cancel/failed actual IDB put preserve exact record and draft','reset success creates one revisioned tombstone and clears/masks every key','password cancel/wrong password/restore cancel preserve bytes and draft','missing/declined configuration preserve draft','accepted configuration with failed actual IDB put preserves exact record and draft','accepted encrypted file restore aligns canonical settings/form/masking in one revision','ordinary navigation/render preserve draft; reload returns canonical values; 320px reflow']},null,2));
 }finally{await context.close();}
}
