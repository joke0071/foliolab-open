import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [runtime,base,out]=process.argv.slice(2);
const {chromium}=await import(pathToFileURL(resolve(runtime)));
const {openApp,readAppState,saveTargetBackup,openBackupControls}=await import('../flh04-backup-app.mjs');
const browser=await chromium.launch();
try {
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const p=await openApp(context,base);
 await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,addBooking,snapshot}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const {validateHistorySession}=await import('/src/wallet-history-state.js');
  const {event,stream,NOW}=await import('/tests/wallet-history-fixtures.mjs');
  const m=blankModel();m.settings.autoRefresh='off';m.providers.push(createProvider({id:'demo',name:'Musterdepot',type:'broker'}));
  m.accounts.push(createAccount({id:'eur',providerId:'demo',name:'Demo-EUR',type:'checking'},m));
  m.positions.push(createPosition({id:'demo-cash',providerId:'demo',accountId:'eur',kind:'cash',name:'Synthetische EUR',quantity:10,price:1,currency:'EUR'},m));
  addBooking(m,{positionId:'demo-cash',type:'deposit',date:'2026-11-20',quantity:'12.34',unitPrice:1});
  snapshot(m,'2026-11-21','Synthetischer Stichtag',{manualTotalEUR:'22.34'});
  m.walletHistory={schema:1,sessions:[validateHistorySession({id:'qa-synthetic',chain:'eth',walletKey:'test-wallet',acceptedAt:NOW,events:[event({quantityBaseUnits:'90071992547409930001'})],streams:[stream()],quotes:[],issues:[]})],pending:[]};
  const s=new PortfolioStorage();try{await s.initialize();await s.save(m);}finally{s.close();}
 });
 await p.reload();await openBackupControls(p);
 const password='Synthetic native Safari QA fixture';
 await p.locator('#backupPassword').fill(password);await p.locator('#backupPasswordConfirm').fill(password);
 await p.locator('#saveBackupPassword').click();await p.locator('#backupPasswordForm').waitFor({state:'hidden'});
 const state=(await readAppState(p)).portfolio;const model=JSON.parse(state.raw);
 const fields=['providers','accounts','positions','bookings','journalEntries','externalCashFlows','snapshots','walletHistory'];
 const canonical=Object.fromEntries(fields.map(k=>[k,model[k]]));
 assert.equal(model.positions[0].quantityExact,'22.34');assert.equal(model.journalEntries.length,1);assert.equal(model.walletHistory.sessions.length,1);
 const backupPath=resolve(out,'synthetic-source.json');await saveTargetBackup(p,backupPath);
 const envelope=await readFile(backupPath);assert(!envelope.toString().includes('Musterdepot'));
 const sha=x=>createHash('sha256').update(x).digest('hex');
 const sort=x=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;
 await writeFile(resolve(out,'expected.json'),JSON.stringify({source:'Linux Chromium '+browser.version(),revision:state.revision,fields,dataSHA256:sha(JSON.stringify(sort(canonical))),envelopeSHA256:sha(envelope),cash:'22.34',bookings:1,journals:1,historySessions:1},null,2)+'\n');
}finally{await browser.close();}
