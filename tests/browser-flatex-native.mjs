import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeFlatexCSV as csv,syntheticCP1252,depotHeaders} from './flatex-native-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic pure native Flatex source projection only; no dialog or economic integration',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const ctx=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
  const before=await read();ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  const text=csv('depot',[{4:'Öl, Größe und € <img src=x onerror=alert(1)>',5:'-9.007.199.254.740.993,000000000000000001'},{5:'-',9:'',7:'Thesaurierung'},{5:'0',9:'0',7:'Storno Fusion'},{5:'1,0000000000000000001',1:'29.02.1900',7:'Future'}]);
  const payload={bytes:[...syntheticCP1252(text)],utf8:[...new TextEncoder().encode(text)],account:csv('account',[{7:'CHF'}]),bad:[csv('depot',[{}],{headers:depotHeaders.map((v,i)=>i===6?'Unit':v)}),csv()+';extra',csv()+'\n'+csv()]};
  const run=()=>p.evaluate(async({bytes,utf8,account,bad})=>{
   const {readFlatexNativeBytes,parseFlatexNativeCSV}=await import('/src/flatex-native.js'),{parseCSV}=await import('/src/csv-import.js');
   const d=readFlatexNativeBytes(new Uint8Array(bytes)),u=readFlatexNativeBytes(new Uint8Array(utf8)),c=parseFlatexNativeCSV(account);
   const rejected=bad.map(text=>{try{parseFlatexNativeCSV(text);return false;}catch{return true;}});
   let genericStrict=false;try{parseCSV(account);}catch{genericStrict=true;}
   return {d,u,c,rejected,genericStrict,immutable:Object.isFrozen(d)&&Object.isFrozen(d.rows)&&d.rows.every(r=>Object.isFrozen(r)&&Object.isFrozen(r.values)&&Object.isFrozen(r.numbers)&&Object.isFrozen(r.dates)&&Object.isFrozen(r.fields)&&Object.isFrozen(r.issues)),mutationBlocked:!Reflect.set(d.rows[0].values,'nominal','0')};
  },payload);
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const r=await run();assert.equal(r.d.encoding,'windows-1252');assert.equal(r.u.encoding,'utf-8');assert.deepEqual(r.d.rows,r.u.rows);assert.equal(r.d.rows.length,4);assert.equal(r.d.columns[6].header,'');assert.equal(r.d.columns[10].header,'');assert.equal(r.c.columns[7].header,'');
   assert.equal(r.d.rows[0].values.description,'Öl, Größe und € <img src=x onerror=alert(1)>');assert.equal(r.d.rows[0].numbers.nominal,'-9007199254740993.000000000000000001');assert.equal(r.d.rows[0].order.reference,'0009007199254740993');assert.equal(r.d.rows[0].values.transactionReference,'00070000000000000001');
   assert.deepEqual(r.d.rows[1].numbers,{nominal:null,rate:null});assert.deepEqual(r.d.rows[2].numbers,{nominal:'0',rate:'0'});assert.equal(r.d.rows[2].kind,'fusion-cancellation');assert.equal(r.d.rows[3].dates.bookingDate,null);assert.equal(r.d.rows[3].numbers.nominal,null);assert.equal(r.d.rows[3].kind,'unclassified');assert.ok(r.d.rows.every(row=>row.issues.some(i=>i.includes('Bankreferenz'))));
   assert.equal(r.c.rows[0].values.amountCurrency,'CHF');assert.equal(r.c.rows[0].numbers.amount,'-3086.25');assert.equal('amountEUR' in r.c.rows[0],false);assert.ok(r.rejected.every(Boolean));assert.equal(r.genericStrict,true);assert.equal(r.immutable,true);assert.equal(r.mutationBlocked,true);assert.equal(r.d.ready,false);assert.equal(r.d.writeEnabled,false);assert.deepEqual(await read(),before);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:['native 12/10 positional blank headers','actual UTF8/Windows1252 byte decoding/euro/umlauts','exact signed 18-digit quantities/unknown versus zero','separate bank/order/account references','documentary cancellation/unknown/date guards','no generic header relaxation','deep immutable result/no import API','actual SW offline reload/module import','exact IDB/revision/settings zero mutation','no external projection requests']});
  console.log(engine+': FLATEX NATIVE pure 12/10/CP1252/exact decimals/references/guards/offline/exact zero writes PASS');
 }finally{await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/flatex-native-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
