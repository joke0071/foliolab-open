import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic documentary native 1:1 amounts only; no economic import or UI integration',engines:[]};
const D=(c={})=>csv('depot',[{5:'2',9:'3,25',...c}]),C=(c={})=>csv('account',[{6:'-6,5',...c}]);
const sell='ABR ORDER Verkauf IE00SYNTH001 0009007199254740993';
const cases=[
 {files:[D(),C()],expected:['gross-equal','6.5','-6.5','0','EUR']},
 {files:[D(),C({6:'-6,75'})],expected:['unexplained-difference','6.5','-6.75','-0.25','EUR']},
 {files:[D({5:'-2',7:sell}),C({4:sell,6:'6,25'})],expected:['unexplained-difference','6.5','6.25','-0.25','EUR']},
 {files:[D({10:'CHF'}),C({7:'CHF'})],expected:['gross-equal','6.5','-6.5','0','CHF']},
 {files:[D({5:'9007199254740993,125',9:'2'}),C({6:'-18014398509481986,25'})],expected:['gross-equal','18014398509481986.25','-18014398509481986.25','0','EUR']},
 {files:[D({5:'0,000000000000000001',9:'1'}),C({6:'-0,000000000000000001'})],expected:['gross-equal','0.000000000000000001','-0.000000000000000001','0','EUR']},
 ...[[D({5:'0,000000000000000001',9:'0,9'}),C({6:'-0,000000000000000001'})],[D({6:'%'}),C()],
  [D({5:'-2'}),C()],[D(),C({7:'CHF'})],[D({4:'x'.repeat(301)}),C()],
  [D(),csv('account',[{5:'SYN-A'},{5:'SYN-B'}])],[D(),D({0:'999'}),C()],
  [D(),D({1:'03.01.1999'}),C()],[D({7:'Storno ABR ORDER Kauf IE00SYNTH001 0009007199254740993'}),C()],
  [D()]].map(files=>({files,expected:['review',null,null,null,null]}))
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
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const results=await p.evaluate(async cases=>{
    const {parseFlatexNativeCSV}=await import('/src/flatex-native.js'),{auditNativeFlatexSettlementAmounts:audit}=await import('/src/flatex-settlement-audit.js');
    const frozen=v=>!v||typeof v!=='object'||Object.isFrozen(v)&&Object.values(v).every(frozen);
    return cases.map(c=>{const docs=c.files.map(parseFlatexNativeCSV),before=JSON.stringify(docs),r=audit(docs),e=r.entries[0];return {amounts:[e.status,e.grossExact,e.cashExact,e.differenceExact,e.currency],rows:r.rows.length,sourceRows:docs.reduce((n,d)=>n+d.rows.length,0),immutable:frozen(r),unchanged:JSON.stringify(docs)===before,noWrite:r.ready===false&&r.writeEnabled===false&&r.costsVerified===false&&!('commit' in r)};});
   },cases);
   results.forEach((r,i)=>{assert.deepEqual(r.amounts,cases[i].expected);assert.equal(r.rows,r.sourceRows);assert.ok(r.immutable&&r.unchanged&&r.noWrite);});
   assert.deepEqual(await read(),before);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:['exact buy/sell/large/tiny/foreign-currency reference values','product precision/units/direction/source/currency guards','multi-leg/overlap/conflict/storno/missing guards','all locators/immutability/no financial DTO or writes','actual SW offline reload/module import','exact IDB/revision/settings zero mutation','no external requests']});
  console.log(engine+': FLATEX NATIVE AMOUNTS exact documentary comparison/precision/review/offline/exact zero writes PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/flatex-native-amounts-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
