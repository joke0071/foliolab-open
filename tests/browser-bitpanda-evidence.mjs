import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {bitpandaCSV,bitpandaHeaders} from './bitpanda-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic pure Bitpanda parser only; no dialog or financial integration',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const ctx=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
  const before=await read();ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  const payload={text:bitpandaCSV([{'Transaction ID':'SYN-EXACT','Amount Asset':'9007199254740993.000000000000000001','Fee asset':'USD',Fee:'0.000000000000000001','Product ID':'<img src=x onerror=alert(1)>'},{'Transaction ID':'SYN-SHORT','Transaction Type':'reward',omitTax:true},{'Transaction ID':'SYN-SAME'},{'Transaction ID':'SYN-SAME'},{'Transaction ID':'SYN-CONFLICT'},{'Transaction ID':'SYN-CONFLICT',Fee:'2'},{'Transaction ID':'SYN-UNKNOWN','Transaction Type':'future','In/Out':'unknown',Timestamp:'1900-02-29T00:00:00+01:00','Tax Fiat':'-',Spread:'1e-3'}],{preamble:['SYNTHETIC PRIVATE PREAMBLE','Owner,SYNTHETIC PRIVATE OWNER']}),bad:[bitpandaCSV([{omitTax:true}]),bitpandaCSV([{}],{headers:bitpandaHeaders.slice(0,-1)}),bitpandaCSV([{}],{preamble:Array(21).fill('SYNTHETIC')})]};
  const run=()=>p.evaluate(async({text,bad})=>{
   const {parseBitpandaCSV}=await import('/src/bitpanda-preview.js');const {parseCSV}=await import('/src/csv-import.js');
   const d=parseBitpandaCSV(text),rejected=bad.map(input=>{try{parseBitpandaCSV(input);return false;}catch{return true;}});
   const mutationBlocked=!Reflect.set(d.rows[0].values,'Fee','0');
   let genericStrict=false;try{parseCSV('date,amount\n1999-01-02');}catch{genericStrict=true;}
   return {d,rejected,mutationBlocked,genericStrict,immutable:Object.isFrozen(d)&&Object.isFrozen(d.rows)&&d.rows.every(r=>Object.isFrozen(r)&&Object.isFrozen(r.values)&&Object.isFrozen(r.numbers)&&Object.isFrozen(r.issues))};
  },payload);
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const r=await run();assert.equal(r.d.rows.length,7);assert.equal(r.d.rows[0].numbers['Amount Asset'],'9007199254740993.000000000000000001');assert.equal(r.d.rows[0].numbers.Fee,'0.000000000000000001');assert.equal(r.d.rows[0].values['Fee asset'],'USD');assert.equal(r.d.rows[0].values['Product ID'],'<img src=x onerror=alert(1)>');
   assert.equal(r.d.rows[1].values['Tax Fiat'],null);assert.equal(r.d.rows[1].numbers['Tax Fiat'],null);assert.ok(r.d.rows.slice(2,4).every(row=>row.issues.some(i=>i.includes('Identische'))));assert.ok(r.d.rows.slice(4,6).every(row=>row.issues.some(i=>i.includes('Widersprüchliche'))));assert.match(r.d.rows[6].issues.join(' '),/Timestamp:/);assert.equal(r.d.rows[6].numbers.Spread,null);assert.equal(r.d.rows[6].numbers['Tax Fiat'],null);
   assert.ok(r.rejected.every(Boolean));assert.equal(r.mutationBlocked,true);assert.equal(r.genericStrict,true);assert.equal(r.immutable,true);assert.equal(r.d.writeEnabled,false);assert.equal(r.d.ready,false);assert.doesNotMatch(JSON.stringify(r.d),/PRIVATE|OWNER/);assert.deepEqual(await read(),before);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:['native preamble/18-17 schema','exact 18-digit amounts and declared fee asset','absent tax stays unknown','all duplicate/conflicting/unknown rows retained','hostile strings are data/preamble not exposed','negative schemas/generic strictness','deep immutability/no write API','actual SW offline reload/module import','exact IDB record/revision/settings zero mutation','no external parser requests']});
  console.log(engine+': BITPANDA pure native parser/preamble/18-17/exact decimals/unknown tax/guards/offline/exact zero writes PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/bitpanda-evidence-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
