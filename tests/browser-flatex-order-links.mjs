import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic native Flatex order evidence only; no dialog/economic integration',engines:[]};
const cases=[
 {name:'single',files:[csv(),csv('account')],statuses:['possible-single']},
 {name:'cash-legs',files:[csv(),csv('account',[{5:'SYN-A'},{5:'SYN-B'}])],statuses:['multiple-cash-review']},
 {name:'partial-executions',files:[csv('depot',[{8:'SYN-A'},{8:'SYN-B'}]),csv('account')],statuses:['multiple-depot-review']},
 {name:'overlap',files:[csv(),csv('depot',[{0:'999'}]),csv('account')],statuses:['overlap-review']},
 {name:'conflict',files:[csv(),csv('depot',[{1:'03.01.1999'}]),csv('account')],statuses:['conflict']},
 {name:'storno',files:[csv(),csv('account'),csv('account',[{4:'Storno ABR ORDER Kauf IE00SYNTH001 0009007199254740993',5:'SYN-STORNO'}])],statuses:['cancelled-review']},
 {name:'currency',files:[csv(),csv('account',[{7:'CHF'}])],statuses:['source-review']},
 {name:'scope',files:[csv(),csv('account',[{5:'SYN-A'},{5:'SYN-B',9:'SYN-SECOND'}])],statuses:['scope-review']},
 {name:'missing',files:[csv()],statuses:['missing-cash']},
 {name:'unassigned',files:[csv('depot',[{7:'Thesaurierung'},{7:'Storno Fusion'}])],statuses:[]},
 {name:'tiny',files:[csv('depot',[{5:'0,000000000000000001'}]),csv('account',[{6:'-0,000000000000000001'}])],statuses:['possible-single']}
];
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const ctx=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
  const before=await read();ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  const run=()=>p.evaluate(async cases=>{
   const {parseFlatexNativeCSV}=await import('/src/flatex-native.js'),{inspectNativeFlatexOrderLinks,pairFlatexSettlements}=await import('/src/flatex-settlements.js');
   const results=cases.map(c=>{const docs=c.files.map(parseFlatexNativeCSV),before=JSON.stringify(docs),r=inspectNativeFlatexOrderLinks(docs);return {name:c.name,statuses:r.groups.map(g=>g.status),rows:r.rows.length,sourceRows:docs.reduce((n,d)=>n+d.rows.length,0),unassigned:r.unassigned.length,immutable:Object.isFrozen(r)&&Object.isFrozen(r.rows)&&r.rows.every(Object.isFrozen)&&Object.isFrozen(r.groups)&&r.groups.every(g=>Object.isFrozen(g)&&Object.isFrozen(g.reasons)&&Object.isFrozen(g.depot)&&Object.isFrozen(g.cash)),mutationBlocked:r.groups.length?!Reflect.set(r.groups[0],'status','confirmed'):true,noWrite:r.ready===false&&r.writeEnabled===false&&!('commit' in r),unchanged:before===JSON.stringify(docs),single:r.groups[0]};});
   const docs=cases[0].files.map(parseFlatexNativeCSV),rejected=[null,[],Array(21).fill(docs[0])].map(input=>{try{inspectNativeFlatexOrderLinks(input);return false;}catch{return true;}});let horizonRejected=false;try{inspectNativeFlatexOrderLinks(docs,{maxDays:31});}catch{horizonRejected=true;}
   const legacy=pairFlatexSettlements({sourceTrades:[{reference:'SYN-LEGACY',date:'1999-01-02',isin:'IE00SYNTH001',type:'buy'}],cashItems:[{reference:'SYN-LEGACY',date:'1999-01-02',amount:'-1',kind:'settlement',details:'ORDER Kauf IE00SYNTH001'}]});
   return {results,rejected,horizonRejected,legacyPossible:legacy.paired.length===1&&legacy.paired[0].status==='possible'};
  },cases);
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const r=await run();assert.ok(r.rejected.every(Boolean));assert.equal(r.horizonRejected,true);assert.equal(r.legacyPossible,true);
   for(const [i,result]of r.results.entries()){assert.deepEqual(result.statuses,cases[i].statuses);assert.equal(result.rows,result.sourceRows);assert.equal(result.immutable,true);assert.equal(result.mutationBlocked,true);assert.equal(result.noWrite,true);assert.equal(result.unchanged,true);}
   assert.equal(r.results[0].single.orderReference,'0009007199254740993');assert.notEqual(r.results[0].single.depot[0].bankReference,r.results[0].single.cash[0].bankReference);assert.equal(r.results[1].single.cash.length,2);assert.equal(r.results[9].unassigned,2);assert.deepEqual(await read(),before);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:['independent bank/order references','possible 1:1 reuses legacy matcher','multiple cash/depot legs stay review','overlap/conflict/storno/currency/scope/missing/unassigned guards','tiny exact decimal direction','all source rows retained/immutable/no writes','legacy and input/horizon bounds','actual SW offline reload/module import','exact IDB/revision/settings zero mutation','no external relationship requests']});
  console.log(engine+': FLATEX ORDER LINKS pure references/multiple legs/conflicts/storno/bounds/offline/exact zero writes PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/flatex-order-links-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
