import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {manageList} from './browser-management-mode.mjs';
const product='82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69',base='http://127.0.0.1:4173',out='artifacts/k3-selection',head=process.env.FOLIOLAB_TEST_SHA;
assert.match(head||'',/^[0-9a-f]{40}$/);assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),head);assert.equal(execFileSync('git',['rev-parse','HEAD^'],{encoding:'utf8'}).trim(),product);
await mkdir(out,{recursive:true});
const report={product,qaHead:head,startedAt:new Date().toISOString(),result:'PENDING',cases:[],limits:['Synthetic Linux browser contexts; no Windows/Android hardware claim','Existing product code unchanged; fresh independent fixture per case','No permission expansion or financial cascade; archive is visibility only','Position metadata save normally records one current snapshot and lastAccountId; explicitly checked','Native IDB observer delegates to original put; no Save/CAS/handler substitution']};
const cats={
 positions:{page:'positions',list:'#positionList',row:'.position-entry',check:'data-position-select',view:'#positionArchiveFilter',status:'#positionSelectionStatus',more:'[data-action=more-positions]',archive:'[data-action=archive-selected]',confirm:'confirmArchive',finish:'[data-action=cancel-selection]',edit:id=>'[data-action=edit-position][data-id="'+id+'"]',note:'notes'},
 bookings:{page:'bookings',list:'#bookingList',row:'[data-booking-id]',check:'data-booking-select',view:'#bookingArchiveFilter',status:'#bookingSelectionStatus',more:'[data-action=more-bookings]',archive:'[data-booking-manage=archive]',confirm:'confirmBookingArchive',finish:'[data-booking-manage=cancel]',edit:id=>'[data-booking-row-action=edit][data-id="'+id+'"]',note:'notes'},
 references:{page:'history',list:'#snapshotList',row:'.reference-row',check:'data-reference-select',view:'#referenceArchiveFilter',status:'#referenceSelectionStatus',more:'[data-reference-manage=more]',archive:'[data-reference-manage=archive]',confirm:'confirmReferenceArchive',finish:'#manageReferences[aria-pressed=true]',edit:id=>'[data-action=edit-snapshot][data-id="'+id+'"]',note:'note'}
};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
const record=p=>p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('foliolab-open-portfolio');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readonly');let value;tx.objectStore('records').get('portfolio').onsuccess=e=>value=e.target.result;tx.oncomplete=()=>{db.close();resolve(value);};tx.onabort=()=>reject(tx.error);};}));
const writes=p=>p.evaluate(()=>({...window.__k3Writes}));
const reset=p=>p.evaluate(()=>Object.assign(window.__k3Writes,{puts:0,commits:0,aborts:0}));
const hash=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
report.assets=[];for(const path of ['src/app.js','src/model.js','src/booking-management.js','src/reference-management.js','src/position-selection.js','sw.js']){const b=await readFile(path);assert.equal(hash(b),hash(execFileSync('git',['show',product+':'+path])));report.assets.push({path,sha256:hash(b)});}
for(const engine of (process.env.K3_ENGINES||'chromium,firefox,webkit').split(',')){
 let browser;
 try{browser=await({chromium,firefox,webkit})[engine].launch({headless:true});
  for(const category of Object.keys(cats))for(const kind of ['hidden-archive','row-edit-with-other-selection']){
   const c={engine,category,kind,profile:randomUUID(),browserVersion:browser.version(),result:'PENDING',cleanup:'PENDING',stage:'start',checks:[],errors:[]};report.cases.push(c);await save();let context,p;
   const eq=(label,actual,expected)=>{c.checks.push({label,actual,expected});assert.deepEqual(actual,expected,label);};
   const stage=async name=>{c.stage=name;console.log(JSON.stringify({engine,category,kind,stage:name}));await save();};
   try{
    context=await browser.newContext({viewport:{width:390,height:850},acceptDownloads:true});await context.addInitScript({content:axe});await context.addInitScript(()=>{window.__k3Writes={puts:0,commits:0,aborts:0};const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const r=put.apply(this,args);if(this.name==='records'&&args[1]==='portfolio'){const o=window.__k3Writes;o.puts++;this.transaction.addEventListener('complete',()=>o.commits++,{once:true});this.transaction.addEventListener('abort',()=>o.aborts++,{once:true});}return r;};});
    await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());context.on('page',q=>q.on('pageerror',e=>c.errors.push(e.message)));p=await context.newPage();p.setDefaultTimeout(10000);await p.goto(base+'/');await controlledStorageFixture(p,()=>ready(p),()=>record(p));
    await stage('fixture');c.fixture=await p.evaluate(async category=>{const {k3SelectionFixture}=await import('/tests/k3-selection-fixture.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const f=k3SelectionFixture(category),s=new PortfolioStorage();try{await s.initialize();await s.save(f.model);}finally{s.close();}return f;},category);
    await p.reload();await ready(p);const cfg=cats[category],e=c.fixture.expected;
    await p.locator('#mobileNav [data-page="'+cfg.page+'"]').click();if(category==='references')await p.locator('#snapshotManager').evaluate(el=>el.open=true);
    if(category==='positions')await p.locator('#positionSort').selectOption('name');
    c.before=await record(p);c.storage=await p.evaluate(async()=>({origin:location.origin,controller:navigator.serviceWorker.controller?.scriptURL,caches:await caches.keys(),mode:localStorage.getItem('foliolab-open-storage-mode')}));eq('v316 cache',c.storage.caches,['foliolab-open-v316']);eq('IDB marker',c.storage.mode,'idb-v1');assert.ok(c.storage.controller?.endsWith('/sw.js'));await reset(p);
    const before=JSON.parse(c.before.raw);eq('fixed independent economic total',await p.evaluate(async raw=>(await import('/src/model.js')).totalExactEUR(JSON.parse(raw)),c.before.raw),e.total);
    await stage('select-pages-and-filter');await manageList(p,category);eq('first page size',await p.locator('['+cfg.check+']').count(),100);
    const select=id=>p.locator('['+cfg.check+'="'+id+'"]');
    // Positions name-sort ascending; booking/reference dates descending. Choose fixed far end only after expanding.
    const first=category==='positions'?e.selected[1]:e.selected[0],last=category==='positions'?e.selected[0]:e.selected[1];
    await select(first).check();await p.locator(cfg.more).click();await select(last).check();eq('expanded page exact selected IDs',await p.locator('['+cfg.check+']:checked').evaluateAll((els,a)=>els.map(el=>el.getAttribute(a)).sort(),cfg.check),[...e.selected].sort());
    await p.locator(cfg.view).selectOption('archived');eq('only pre-existing archive visible',await p.locator('['+cfg.check+']').count(),3);eq('selected IDs hidden from current rows',await p.locator('['+cfg.check+']:checked').count(),0);c.status=await p.locator(cfg.status).innerText();assert.match(c.status,/2 ausgewählt/);assert.match(c.status,/2 ausgeblendet/);eq('selection/filter exact record',await record(p),c.before);eq('selection/filter zero writes',await writes(p),{puts:0,commits:0,aborts:0});
    await select(e.rowTarget).check();eq('mixed archive states protected',await p.locator(cfg.archive).isDisabled(),true);await select(e.rowTarget).uncheck();eq('homogeneous hidden IDs actionable',await p.locator(cfg.archive).isEnabled(),true);
    if(kind==='hidden-archive'){
     await stage('preview-cancel');await p.locator(cfg.archive).click();await p.locator('[name="'+cfg.confirm+'"]').waitFor();c.preview=await p.locator('#dialogFields').innerText();c.previewItems=await p.locator('#dialogFields li').allTextContents();eq('exactly two affected preview rows',c.previewItems.length,2);
     if(category==='positions')for(const id of e.selected)assert.ok(c.previewItems.some(t=>t.includes(before.positions.find(x=>x.id===id).name)),id+' named in preview');
     if(category==='bookings')for(const id of e.selected)assert.ok(c.previewItems.some(t=>t.includes(before.bookings.find(x=>x.id===id).date)),id+' dated in preview');
     if(category==='references')for(const id of e.selected){const date=before.snapshots.find(x=>x.id===id).date,parts=date.split('-');assert.ok(c.previewItems.some(t=>t.includes(parts[2]+'.'+parts[1]+'.'+parts[0])),id+' dated in preview');}
     await p.locator('#editDialog').screenshot({path:out+'/'+engine+'-'+category+'-hidden-preview.png'});await p.locator('#cancelDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});eq('preview cancel exact record',await record(p),c.before);eq('preview cancel zero writes',await writes(p),{puts:0,commits:0,aborts:0});
     await stage('confirmed-exact-subset');await p.locator(cfg.archive).click();await p.locator('[name="'+cfg.confirm+'"]').check();await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});c.after=await record(p);const after=JSON.parse(c.after.raw),expected=structuredClone(before);
     if(category==='positions'){for(const pos of expected.positions)if(e.selected.includes(pos.id))pos.archived=true;}
     else if(category==='bookings')expected.bookingPresentation.archivedIds.push(...e.selected);
     if(category==='references')expected.bookingPresentation.referenceArchivedIds.push(...e.selected);
     eq('entire model exact only selected archive flags',after,expected);eq('settings unchanged',c.after.settings,c.before.settings);
    }else{
     await stage('row-editor-overrides-selection');await p.locator(cfg.edit(e.rowTarget)).click();await p.locator('[name="'+cfg.note+'"]').fill(e.newNote);if(category==='bookings')await p.locator('[name=reason]').fill('SYNTHETIC row identity receipt');await p.locator('#saveDialog').click();
     if(category==='bookings'){await p.locator('[name=confirmBookingChange]').waitFor();c.preview=await p.locator('#dialogFields').innerText();await p.locator('#bookingChangeTransactions>summary').click();const items=await p.locator('#bookingChangeTransactions li').allTextContents();eq('row preview only one ID',items.length,1);assert.ok(items[0].includes('ID: '+e.rowTarget));for(const id of e.selected)assert.ok(!items[0].includes('ID: '+id));await p.locator('[name=confirmBookingChange]').check();await p.locator('#saveDialog').click();}
     await p.locator('#editDialog').waitFor({state:'hidden'});c.after=await record(p);const after=JSON.parse(c.after.raw),normalized=structuredClone(after);
     if(category==='bookings'){const audit=normalized.journalEntries.pop();eq('single row audit IDs',audit.managementAudit.originals.map(x=>x.booking.id),[e.rowTarget]);eq('audit action notes',audit.managementAudit.action,'notes');eq('new row note',normalized.bookings.find(x=>x.id===e.rowTarget).notes,e.newNote);normalized.bookings.find(x=>x.id===e.rowTarget).notes=before.bookings.find(x=>x.id===e.rowTarget).notes;}
     if(category==='references'){const changed=normalized.snapshots.find(x=>x.id===e.rowTarget),original=before.snapshots.find(x=>x.id===e.rowTarget);eq('new row note',changed.note,e.newNote);eq('one old reference revision',changed.revisions.length,original.revisions.length+1);normalized.snapshots[normalized.snapshots.findIndex(x=>x.id===e.rowTarget)]=original;}
     if(category==='positions'){const changed=normalized.positions.find(x=>x.id===e.rowTarget),original=before.positions.find(x=>x.id===e.rowTarget);eq('new row note',changed.notes,e.newNote);changed.notes=original.notes;const added=normalized.snapshots.filter(x=>!before.snapshots.some(y=>y.id===x.id));eq('documented current snapshot count',added.length,1);eq('documented current snapshot exact total',added[0].totalEURExact,e.total);eq('documented current snapshot date',added[0].date,new Date().toISOString().slice(0,10));normalized.snapshots=before.snapshots;normalized.settings=before.settings;eq('only expected lastAccountId',c.after.settings,{...c.before.settings,lastAccountId:original.accountId});}
     eq('all protected IDs and economic/history fields unchanged',normalized,before);if(category!=='positions')eq('settings unchanged',c.after.settings,c.before.settings);
    }
    eq('exactly one revision',c.after.revision,c.before.revision+1);eq('exactly one actual native commit',await writes(p),{puts:1,commits:1,aborts:0});eq('economic total preserved',await p.evaluate(async raw=>(await import('/src/model.js')).totalExactEUR(JSON.parse(raw)),c.after.raw),e.total);
    await stage('finish-and-reopen');await manageList(p,category);await p.locator(cfg.finish).click();eq('finish hides checkboxes',await p.locator('['+cfg.check+']').count(),0);eq('finish hides row edits',await p.locator(cfg.list).locator(category==='bookings'?'[data-booking-row-action=edit]':category==='positions'?'[data-action=edit-position]':'[data-action=edit-snapshot]').count(),0);eq('no open row accordions after finish',await p.locator(cfg.list+' details[open]').count(),0);eq('finish preserves archive view',await p.locator(cfg.view).inputValue(),'archived');eq('finish exact record',await record(p),c.after);eq('finish zero additional writes',await writes(p),{puts:1,commits:1,aborts:0});
    await manageList(p,category);assert.match(await p.locator(cfg.status).innerText(),/0 ausgewählt/);await p.locator(cfg.finish).click();const peer=await context.newPage();await peer.goto(base+'/');await ready(peer);eq('independent reopen exact record',await record(peer),c.after);eq('reopen zero writes',await writes(peer),{puts:0,commits:0,aborts:0});await peer.close();eq('no page errors',c.errors,[]);c.result='PASS';await stage('complete');
   }catch(error){c.result='FAIL';c.failure={message:error.message,stack:error.stack};if(p&&!p.isClosed())try{c.failureRecord=await record(p);c.failureUI=await p.locator('body').innerText();await p.screenshot({path:out+'/'+engine+'-'+category+'-'+kind+'-failure.png',fullPage:true});}catch(e){c.captureError=String(e);}process.exitCode=1;}
   finally{try{await context?.close();c.cleanup='PASS';}catch(e){c.cleanup='FAIL';c.cleanupError=String(e);process.exitCode=1;}await save();}
  }
 }finally{await browser?.close();}
}
report.result=report.cases.length===18&&report.cases.every(c=>c.result==='PASS'&&c.cleanup==='PASS')?'PASS':'FAIL';report.finishedAt=new Date().toISOString();report.node=process.version;report.os=process.platform;await save();console.log(JSON.stringify({result:report.result,cases:report.cases.map(c=>({engine:c.engine,category:c.category,kind:c.kind,result:c.result,failure:c.failure?.message}))}));if(report.result!=='PASS')process.exitCode=1;
