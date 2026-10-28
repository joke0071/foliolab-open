import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic native source identity/evidence and existing preview guards only; no dialog/economic integration',engines:[]};
const inputs={depot:csv(),cash:csv('account'),ordinal:csv('depot',[{0:'999'}]),changed:csv('depot',[{2:'05.01.1999'}]),missing:csv('depot',[{8:''}])};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const ctx=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
  const before=await read();ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  const run=()=>p.evaluate(async inputs=>{
   const {parseFlatexNativeCSV,FLATEX_NATIVE_COLUMNS}=await import('/src/flatex-native.js'),{inspectNativeFlatexSourceIdentities:inspect}=await import('/src/import-identity.js');
   const {blankModel,createProvider,createAccount,createPosition,backup,safeImport}=await import('/src/model.js'),{parseCSV,inferMapping,previewCSV,importCSV}=await import('/src/csv-import.js');
   const docs=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,parseFlatexNativeCSV(v)])),sourceBefore=JSON.stringify(docs),r=inspect([docs.depot,docs.cash]),identity=r.rows[0].identity;
   const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
   const expected=await hash(JSON.stringify(FLATEX_NATIVE_COLUMNS.depot.filter(c=>c.key!=='number').map(c=>[c.key,docs.depot.rows[0].values[c.key]])));
   const overlap=inspect([docs.depot,docs.ordinal]),conflict=inspect([docs.depot,docs.changed]),missing=inspect([docs.missing]);
   // Independent synthetic normalized DTO, not an economic adapter for native rows.
   const m=blankModel(),provider=createProvider({name:'Synthetic identity broker'});m.providers.push(provider);const account=createAccount({providerId:provider.id,name:'Synthetic identity account',type:'checking'},m);m.accounts.push(account);m.positions.push(createPosition({providerId:provider.id,accountId:account.id,name:'Synthetic cash',symbol:'SYN',kind:'cash',quantity:0,price:1},m));
   const project=(model,id)=>{const parsed=parseCSV('date;type;position;quantity;price;id\n2025-01-01;deposit;SYN;100;1;'+id.externalId);parsed.sourceIdentities={2:id};return previewCSV(model,parsed,inferMapping(parsed.headers));};
   const first=project(m,identity),existing=first.simulated,stateBefore=JSON.stringify(existing),again=project(existing,inspect([docs.ordinal]).rows[0].identity),changed=project(existing,inspect([docs.changed]).rows[0].identity);
   const manual=structuredClone(existing);manual.bookings[0].notes='Synthetic user correction';const correctedBefore=JSON.stringify(manual),manualReview=project(manual,identity);
   const restored=safeImport(JSON.parse(backup(existing))),restoredReplay=project(restored,identity);
   const bad=project(existing,{...identity,sourceEvidence:{version:2,payloadDigest:'a'.repeat(64)}});
   const legacy=project(m,{sourceId:'flatex-at',externalId:identity.externalId}).simulated,legacyReview=project(legacy,identity);
   const mixedBlocked=[[identity,{sourceId:'flatex-at',externalId:identity.externalId}],[{sourceId:'flatex-at',externalId:identity.externalId},identity]].map(origins=>{const parsed=parseCSV('date;type;position;quantity;price;id\n2025-01-01;deposit;SYN;100;1;'+identity.externalId+'\n2025-01-01;deposit;SYN;100;1;'+identity.externalId);parsed.sourceIdentities={2:origins[0],3:origins[1]};return previewCSV(m,parsed,inferMapping(parsed.headers)).issues.some(i=>i.code==='source-conflict');});
   const next=project(m,identity);m.settings.autoRefresh=false;const staleBefore=JSON.stringify(m);let staleBlocked=false;try{importCSV(m,next);}catch{staleBlocked=true;}
   const rejected=[null,[],Array(21).fill(docs.depot),[{...docs.depot}]].map(v=>{try{inspect(v);return false;}catch{return true;}});
   return {sourceRows:r.rows.length,statuses:r.rows.map(x=>x.status),separateSides:r.rows[0].sourceId!==r.rows[1].sourceId,separateRefs:r.rows[0].externalId!==r.rows[0].orderReference,leadingZeros:r.rows[0].externalId==='00070000000000000001',hashMatches:expected===r.rows[0].payloadDigest,ordinalStable:JSON.stringify(identity)===JSON.stringify(inspect([docs.ordinal]).rows[0].identity),overlap:overlap.rows.map(x=>x.status),conflict:conflict.rows.map(x=>x.status),missing:missing.rows[0].status,allRowsKept:overlap.rows.length===2&&conflict.rows.length===2,noOffersForReview:[...overlap.rows,...conflict.rows,...missing.rows].every(x=>x.identity===null),immutable:Object.isFrozen(r.rows[0].identity.sourceEvidence)&&!Reflect.set(r.rows[0].identity,'externalId','changed'),noWrite:r.ready===false&&r.writeEnabled===false&&!('commit' in r),sourceUnchanged:JSON.stringify(docs)===sourceBefore,firstReady:first.ready,replay:again.duplicates,changedConflict:changed.issues[0]?.code,manualConflict:manualReview.issues[0]?.code,restoredReplay:restoredReplay.duplicates,invalidEvidenceBlocked:bad.ready===0&&bad.issues.length===1,legacyConflict:legacyReview.issues[0]?.code,mixedBlocked:mixedBlocked.every(Boolean),modelUnchanged:JSON.stringify(existing)===stateBefore&&JSON.stringify(manual)===correctedBefore,staleBlocked:staleBlocked&&JSON.stringify(m)===staleBefore,rejected};
  },inputs);
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const r=await run();assert.equal(r.sourceRows,2);assert.deepEqual(r.statuses,['candidate-source','candidate-source']);assert.deepEqual(r.overlap,['overlap-review','overlap-review']);assert.deepEqual(r.conflict,['conflict','conflict']);assert.equal(r.missing,'source-review');assert.equal(r.firstReady,1);assert.equal(r.replay,1);assert.equal(r.restoredReplay,1);for(const k of ['changedConflict','manualConflict','legacyConflict'])assert.equal(r[k],'source-conflict',k);
   for(const k of ['separateSides','separateRefs','leadingZeros','hashMatches','ordinalStable','allRowsKept','noOffersForReview','immutable','noWrite','sourceUnchanged','invalidEvidenceBlocked','mixedBlocked','modelUnchanged','staleBlocked'])assert.equal(r[k],true,k);assert.ok(r.rejected.every(Boolean));assert.deepEqual(await read(),before);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report.engines.push({engine,version:browser.version(),result:'PASS',checks:['direct native parser/exact independent SHA256','side/scope/bank/order identity separation','ordinal-independent evidence/overlap/conflict/all locators kept','existing preview replay/source conflict/manual protection/legacy guard','pure backup restore/replay/stale preview guard','immutable input/output/no write API','actual SW offline reload/module import','exact IDB/revision/settings zero mutation','no external identity requests']});console.log(engine+': FLATEX NATIVE IDENTITY source evidence/replay/manual/legacy/bounds/offline/exact zero writes PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/flatex-native-identity-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
