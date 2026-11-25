import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const moduleAt=name=>import(pathToFileURL(resolve(process.argv[2],'src',name)));
const {blankModel,createProvider,createAccount,createPosition,backup,safeImport}=await moduleAt('model.js');
const {parseCSV,inferMapping,previewCSV,importCSV}=await moduleAt('csv-import.js');
const {units,div,exact}=await moduleAt('decimal.js');
function opening(){
 const m=blankModel();m.settings.autoRefresh=false;
 m.providers.push(createProvider({id:'broker',name:'Public reference (test)',type:'broker'}));
 for(const [id,type] of [['custody','securities'],['bank','checking']])m.accounts.push(createAccount({id,name:id,providerId:'broker',type},m));
 for(const [id,accountId,kind,currency,quantity,price] of [['stock','custody','stock','JPY','0','5100'],['eur','bank','cash','EUR','100000','1']]){
  m.positions.push(createPosition({id,name:id,providerId:'broker',accountId,kind,currency,quantity,price,costBasisExact:kind==='stock'?'0':null},m));
 }
 return m;
}
const fx=exact(div(units(1),units('141.09')));
// Explicit exploratory normalization, not an original CSV. Preserve the foreign
// fee in the evidence; the generic form accepts fees in EUR only.
const venue=div(units(7760),units('141.09'));
const fees=[exact(venue+units('18.07')+units('49.95')),'135.55'];
const header='date;type;position;quantity;price;fee;tax;fx;cashPosition;id';
const rows=['200','1500'].map((q,i)=>['2022-07-01','buy','stock',q,'5100',fees[i],0,fx,'eur','238336487.00'+(i+1)].join(';'));
const preview=(m,lines)=>{const p=parseCSV([header,...lines].join('\n'));return previewCSV(m,p,inferMapping(p.headers));};
const run=lines=>{
 const m=opening(),image=JSON.stringify(m);const sim=preview(m,lines);assert.equal(sim.ready,2);assert.equal(JSON.stringify(m),image);importCSV(m,sim);
 assert.equal(m.positions[0].quantityExact,'1700');
 assert.equal(m.externalCashFlows.length,0);
 const cash=m.positions[1].quantityExact;
 const cases=m.journalEntries.map(j=>j.postings.find(p=>p.role==='cash').amountBookEURExact).sort();
 const duplicate=preview(m,lines);assert.equal(duplicate.ready,0);
 const restored=safeImport(JSON.parse(backup(m)));assert.deepEqual(restored.journalEntries,m.journalEntries);
 return {quantity:'1700',cash,executions:cases,reimportNew:duplicate.ready,restored:true};
};
const actual=run(rows);assert.deepEqual(run([...rows].reverse()),actual);
console.log(JSON.stringify({genericTranscription:true,feeConversionEUR:exact(venue),euroPerJPY:fx,actual,expectedDebits:['-7352.45','-54356.26'],expectedCash:'38291.29',exactCashMatch:actual.cash==='38291.29'},null,2));
