// All OAuth/Drive responses below are explicitly SYNTHETIC. Real Google consent is EXTERNAL.
import assert from 'node:assert/strict';
import {waitForAsyncReadiness} from './browser-async-readiness.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const out='artifacts/gates/header-status';mkdirSync(out,{recursive:true});
const report={scope:'DRIVE-HEADER01 / UI-HEADER-STATUS02',oauth:'SYNTHETIC ONLY; real Google/Android EXTERNAL',engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({ignoreHTTPSErrors:live,viewport:{width:390,height:560}});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[],transportFailures=[];p.on('requestfailed',r=>{const u=new URL(r.url());transportFailures.push({url:u.origin+u.pathname,error:r.failure()?.errorText});});p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.querySelector('[data-header-status=storage]')?.dataset.state==='saved');
 const button=kind=>p.locator('[data-header-status='+kind+']:visible');
 // Local IDB readiness does not imply the separate asynchronous vault init.
 const readyDriveAuth=()=>p.waitForFunction(()=>{const state=window.FolioDriveBackup?.getStatus();return state?.configured===true&&state.vaultConfigured===true&&[...document.querySelectorAll('[data-header-status=drive]')].every(b=>b.dataset.state==='auth');},null,{timeout:15000});
 const closeStatus=async()=>{
  await p.locator('#headerStatusDialog[open]').evaluate(d=>{d.dataset.closeObserved='false';d.addEventListener('close',()=>{d.dataset.closeObserved='true';},{once:true});});
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>document.getElementById('headerStatusDialog').dataset.closeObserved==='true',null,{timeout:2000});
 };
 const openStorage=async()=>{await button('storage').click();await p.locator('#headerStatusDialog[open]').waitFor();};
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const scan=async()=>{assert.deepEqual(await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);};
 const uploads=()=>p.evaluate(()=>window.__syntheticDrive.uploads);
 const unexpectedGoogleRequests=[];p.on('request',r=>{if(new URL(r.url()).origin==='https://www.googleapis.com')unexpectedGoogleRequests.push(r.url());});
 try{
  await p.goto(base);await ready();await waitForAsyncReadiness(p,async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated'&&navigator.serviceWorker.controller===r.active;});
  await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{blankModel,createProvider}=await import('/src/model.js');const s=new PortfolioStorage();await s.initialize();const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'synthetic-header',name:'SYNTHETIC header provider'}));await s.save(m);s.close();});
  await p.reload();await ready();let before=await record();
  for(const [width,height] of [[320,560],[360,560],[390,560],[412,560],[430,560],[768,560],[1440,900],[740,360]]){
   await p.setViewportSize({width,height});
   const g=await p.locator('[data-header-status]:visible').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,label:b.getAttribute('aria-label')};}));
   assert.equal(g.length,2);assert.ok(g.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height&&r.label));assert.ok(g[0].right<=g[1].left);
   if(width<=720){assert.ok(await p.locator('.mobile-header').evaluate(e=>e.querySelector('.logo').getBoundingClientRect().right<=e.querySelector('.header-status-actions').getBoundingClientRect().left));assert.equal(await p.locator('#mobilePortfolioStatus').evaluate(e=>e.getBoundingClientRect().height),1,'no persistent mobile text line');}
   await openStorage();assert.match(await p.locator('#headerStatusBody').innerText(),/IndexedDB gespeichert/);assert.ok(await p.locator('#headerStatusClose').evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'status close is also a44px touch target');await scan();if(width===390)await p.screenshot({path:out+'/'+engine+'-390-storage-dialog.png'});await closeStatus();assert.equal(await button('storage').evaluate(e=>e===document.activeElement),true,'Escape restores the invoking status button');
   await p.screenshot({path:out+'/'+engine+'-'+width+'.png'});
   assert.deepEqual(await record(),before,'status reads never write the portfolio');
  }
  await p.setViewportSize({width:320,height:560});
  await p.evaluate(()=>{for(const e of document.querySelectorAll('.mobile-header .logo *')){const s=getComputedStyle(e);e.style.fontSize=(parseFloat(s.fontSize)*1.25)+'px';}});
  assert.ok(await p.locator('.mobile-header').evaluate(e=>e.querySelector('.logo').getBoundingClientRect().right<=e.querySelector('.header-status-actions').getBoundingClientRect().left),'125% logo text remains separate from both touch targets');
  await p.evaluate(()=>document.querySelectorAll('.mobile-header .logo *').forEach(e=>e.style.removeProperty('font-size')));
  await button('drive').click();assert.equal(await p.locator('#googleDriveBackupSetup').evaluate(e=>e.open),true);assert.equal(await p.locator('#googleDriveBackupSetup>summary').evaluate(e=>e===document.activeElement),true);
  assert.deepEqual(await record(),before,'opening Drive settings does not change financial data');
  // Real local encryption and real application backend; only Google transport is stubbed.
  await p.evaluate(async()=>{const {configureBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('Synthetic header backup 2026!','Synthetic header backup 2026!');localStorage.setItem('foliolab-open-drive-backup-settings-v1',JSON.stringify({clientId:'123456789-synthetic.apps.googleusercontent.com',mode:'start',retention:3}));});
  await ctx.addInitScript(()=>{
   window.__syntheticOAuthRequests=0;window.__syntheticOAuthResult='success';window.__syntheticDrive={uploads:0,postBody:'',folder:false};
   window.google={accounts:{oauth2:{initTokenClient(){return {requestAccessToken(){window.__syntheticOAuthRequests++;if(window.__syntheticOAuthResult==='cancel'){this.error_callback({type:'popup_closed'});return;}this.callback({access_token:'SYNTHETIC-EPHEMERAL-HEADER-TOKEN',expires_in:3600});}};}}}};
   const originalFetch=window.fetch.bind(window);
   // Only the explicitly synthetic Google transport is isolated here. Native
   // app asset/SW/IndexedDB/offline behavior is untouched on every engine.
   window.fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.origin!=='https://www.googleapis.com')return originalFetch(input,options);
    const method=String(options.method||input.method||'GET').toUpperCase(),remote=window.__syntheticDrive,q=url.searchParams.get('q')||'';
    let data;
    if(method==='POST'&&url.pathname==='/upload/drive/v3/files'){remote.uploads++;remote.postBody=await options.body.text();data={id:'syntheticBackup123456'};}
    else if(method==='POST'&&url.pathname==='/drive/v3/files'){remote.folder=true;data={id:'syntheticFolder123456',name:'FolioLab Backups'};}
    else if(method==='GET'&&q.includes('mimeType'))data={files:remote.folder?[{id:'syntheticFolder123456',name:'FolioLab Backups',appProperties:{foliolabFolder:'foliolab-open-v1'}}]:[]};
    else if(method==='GET'&&q.includes('in parents'))data={files:remote.uploads?[{id:'syntheticBackup123456',name:'FolioLab-2026-10-31T08-00-00-000Z.encrypted.json',createdTime:'2026-10-31T08:00:00Z',appProperties:{foliolabBackup:'foliolab-open-v3'}}]:[]};
    else throw Error('Unmodeled SYNTHETIC Google request '+method+' '+url.pathname);
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
   };
  });
  await p.reload();await ready();await readyDriveAuth();assert.equal(await button('drive').getAttribute('data-state'),'auth');
  await p.evaluate(()=>{window.__syntheticOAuthResult='cancel';});await button('drive').click();await p.locator('#headerStatusDialog[open]').waitFor();assert.match(await p.locator('#headerStatusBody').innerText(),/Anmeldefenster geschlossen/);assert.equal(await uploads(),0);assert.equal(await p.evaluate(()=>window.FolioDriveBackup.getStatus().lastBackupAt),'');await scan();await p.screenshot({path:out+'/'+engine+'-320-oauth-cancel.png'});await closeStatus();
  // A real competing canonical revision without any visibility/storage event.
  // The backup itself must check freshness; a status click is not a prerequisite.
  await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.providers[0].name='SYNTHETIC concurrent revision';await s.save(m);s.close();});
  const concurrentRecord=await record();await p.evaluate(()=>{window.__syntheticOAuthResult='success';});await button('drive').click();await p.locator('#headerStatusDialog[open]').waitFor();
  assert.match(await p.locator('#headerStatusBody').innerText(),/anderen Tab|Datenkonflikt|Datenstand/);assert.equal(await uploads(),0,'stale canonical data never reaches Drive');assert.equal(await p.evaluate(()=>window.FolioDriveBackup.getStatus().lastBackupAt),'');assert.deepEqual(await record(),concurrentRecord,'a failed stale backup never rewrites the winning canonical record');assert.equal(await p.evaluate(()=>window.__syntheticOAuthRequests),2,'cancel and stale-state authorization were separate explicit requests');await closeStatus();
  await p.reload();await ready();await readyDriveAuth();before=await record();assert.deepEqual(before,concurrentRecord);
  await button('drive').click();await p.waitForFunction(()=>{const s=window.FolioDriveBackup.getStatus();return !s.connecting&&Boolean(s.lastBackupAt||s.error);});const connectedState=await p.evaluate(()=>window.FolioDriveBackup.getStatus());assert.equal(connectedState.error,false,JSON.stringify(connectedState));assert.ok(connectedState.lastBackupAt,'upload is explicitly confirmed');
  await p.locator('#headerStatusDialog[open]').waitFor();assert.match(await p.locator('#headerStatusBody').innerText(),/Letzte erfolgreiche Sicherung/);assert.equal(await p.evaluate(()=>window.__syntheticOAuthRequests),1,'one explicit successful request in the refreshed document');await closeStatus();assert.equal(await uploads(),1);const postBody=await p.evaluate(()=>window.__syntheticDrive.postBody);assert.match(postBody,/foliolab-open-encrypted-v2/);assert.ok(!postBody.includes('SYNTHETIC header provider')&&!postBody.includes('SYNTHETIC concurrent revision'),'Drive receives encrypted data');
  assert.deepEqual(await record(),before,'backup cannot mutate portfolio records or revision');
  await p.evaluate(()=>window.scrollTo({top:700,behavior:'instant'}));const beforeStatusScroll=await p.evaluate(()=>scrollY);assert.ok(beforeStatusScroll>100,'meaningful scrolled-page dialog test');await button('drive').click();assert.match(await p.locator('#headerStatusBody').innerText(),/Letzte erfolgreiche Sicherung/);await scan();await p.locator('#headerStatusFeedback>summary').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#headerStatusFeedback').evaluate(e=>e.open),true);await scan();await p.keyboard.press('Enter');assert.equal(await p.locator('#headerStatusFeedback').evaluate(e=>e.open),false);await p.screenshot({path:out+'/'+engine+'-320-drive-dialog.png'});assert.equal(await uploads(),1,'status click is not an upload');
  await closeStatus();assert.ok(Math.abs(await p.evaluate(()=>scrollY)-beforeStatusScroll)<=1,'ordinary status dialog close preserves scroll position');
  await button('drive').click();await p.locator('#headerStatusDialog[open]').waitFor();
  await p.setViewportSize({width:740,height:360});await scan();assert.ok(await p.locator('#headerStatusDialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),'Drive status remains within a short landscape viewport');await p.screenshot({path:out+'/'+engine+'-740-drive-dialog.png'});assert.ok(await p.locator('#headerStatusDialog button').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
  await closeStatus();assert.equal(await button('drive').evaluate(e=>e===document.activeElement),true,'rotation restores focus to the currently visible equivalent header action');assert.ok(await button('drive').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;}),'restored focus is truly visible and clickable after rotation');await p.setViewportSize({width:320,height:560});
  assert.equal(await p.evaluate(()=>document.documentElement.outerHTML.includes('SYNTHETIC-EPHEMERAL-HEADER-TOKEN')),false);assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage}).includes('SYNTHETIC-EPHEMERAL-HEADER-TOKEN')),false);
  await ctx.setOffline(true);await p.waitForFunction(()=>document.querySelector('[data-header-status=drive]')?.dataset.state==='offline');assert.equal(await button('drive').getAttribute('data-state'),'offline');await openStorage();assert.match(await p.locator('#headerStatusBody').innerText(),/IndexedDB gespeichert/);await closeStatus();await ctx.setOffline(false);
  assert.equal(await uploads(),1,'foreground/online does not repeat completed start backup');
  // Actual failed IndexedDB write: no successful local status after rollback.
  await p.locator('#addProvider').click();await p.locator('#editorForm [name=name]').fill('SYNTHETIC failed write');
  await p.evaluate(()=>{window.__headerPut=IDBObjectStore.prototype.put;window.__headerStates=[];new MutationObserver(()=>window.__headerStates.push(document.querySelector('[data-header-status=storage]').dataset.state)).observe(document.querySelector('[data-header-status=storage]'),{attributes:true,attributeFilter:['data-state']});IDBObjectStore.prototype.put=function(...args){if(this.name==='records')throw new DOMException('SYNTHETIC quota','QuotaExceededError');return window.__headerPut.apply(this,args);};});
  await p.locator('#saveDialog').click();await p.waitForFunction(()=>document.querySelector('[data-header-status=storage]').dataset.state==='error');
  assert.match(await button('storage').getAttribute('aria-label'),/nicht gespeichert/);assert.deepEqual(await record(),before);assert.ok(await p.evaluate(()=>window.__headerStates.includes('saving')&&!window.__headerStates.includes('saved')),'pending and failure never announce a completed save');
  await p.evaluate(()=>{IDBObjectStore.prototype.put=window.__headerPut;});p.once('dialog',d=>d.accept());await p.keyboard.press('Escape');await p.reload();await ready();await readyDriveAuth();assert.equal(await p.evaluate(()=>window.FolioDriveBackup.getStatus().connected),false,'a fresh document does not inherit an OAuth token');assert.ok(await p.evaluate(()=>window.FolioDriveBackup.getStatus().lastBackupAt),'successful backup metadata survives without claiming auth');assert.equal(await p.evaluate(()=>window.__syntheticOAuthRequests),0,'no silent popup or authorization on restart');
  // A peer commits a new revision: local conflict must not be confused with Drive auth.
  const peer=await ctx.newPage();await peer.goto(base);await peer.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await peer.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.providers[0].name='SYNTHETIC peer revision';await s.save(m);s.close();});
  await openStorage();await p.waitForFunction(()=>document.querySelector('[data-header-status=storage]')?.dataset.state==='conflict');assert.match(await p.locator('#headerStatusBody').innerText(),/Datenkonflikt/);assert.equal(await p.locator('#headerStatusActions').getByText('Neu laden',{exact:true}).isVisible(),true);await closeStatus();await peer.close();
  assert.deepEqual(unexpectedGoogleRequests,[],'synthetic credentials never reach the real Google network');assert.deepEqual(errors,[]);report.engines.push({engine,result:'PASS',widths:[320,360,390,412,430,768,1440],checks:['44x44/separate logo/no mobile status line','native modal Axe/Escape/focus','scrolled status close preserves position','landscape restores a truly visible focus target','125% text','setup navigation','synthetic OAuth cancellation is visibly explained','automatic result dialog after explicit reconnect','synthetic direct OAuth + real encryption + one due upload','no token in DOM/storage','exact portfolio/revision unchanged','failed IndexedDB put pending/error without false success','offline local versus remote status','stale canonical backup blocked before upload','real peer CAS conflict']});
 }catch(error){report.failure={engine,error:String(error),drive:await p.evaluate(()=>window.FolioDriveBackup?.getStatus?.()).catch(()=>null),dom:await p.evaluate(()=>({url:location.href,scrollY,height:document.documentElement.scrollHeight,active:document.activeElement?.outerHTML.slice(0,400),dialogOpen:document.getElementById('headerStatusDialog').open,targets:[...document.querySelectorAll('[data-header-status]')].map(e=>({kind:e.dataset.headerStatus,visible:e.checkVisibility(),top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))})).catch(()=>null),transportFailures};await p.screenshot({path:out+'/'+engine+'-failure.png'}).catch(()=>{});throw error;}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await ctx.close();await browser.close();}
}
