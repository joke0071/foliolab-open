import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root=process.env.PERF_OUTPUT,base=process.env.PERF_BASE_SHA,candidate=process.env.PERF_CANDIDATE_SHA;
assert.ok(root);assert.match(base||'',/^[a-f0-9]{40}$/);assert.match(candidate||'',/^[a-f0-9]{40}$/);
const names=['A1','B1','B2','A2'],reports=Object.fromEntries(names.map(n=>[n,JSON.parse(readFileSync(join(root,n,'report.json'),'utf8'))]));
const median=a=>{const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const mean=a=>a.reduce((n,v)=>n+v,0)/a.length;
const spread=a=>{const s=[...a].sort((x,y)=>x-y),quantile=q=>{const n=(s.length-1)*q,i=Math.floor(n);return s[i]+(s[Math.min(i+1,s.length-1)]-s[i])*(n-i);};return {count:s.length,min:s[0],median:median(s),max:s.at(-1),p25:quantile(.25),p75:quantile(.75),sampleSD:Math.sqrt(s.reduce((n,v)=>n+(v-mean(s))**2,0)/(s.length-1))};};
const first=reports.A1;
for(const n of names){
 const r=reports[n];assert.equal(r.sha,n.startsWith('A')?base:candidate);assert.equal(r.runs,5);
 for(const k of ['scriptSha256','workerHelperSha256','node','playwright','chromium','platform','arch'])assert.equal(r[k],first[k],k);
 assert.deepEqual(r.host,first.host);assert.equal(r.cache,n.startsWith('A')?'foliolab-open-v245':'foliolab-open-v247');assert.notEqual(r.chromium,'unknown');
 assert.deepEqual(r.scenarios.map(s=>s.bookings),[0,10000]);assert.deepEqual(r.scenarios.map(s=>s.positions),[3,19]);assert.deepEqual(r.scenarios.map(s=>s.references),[30,1825]);
 for(const s of r.scenarios){
  assert.equal(s.cpuRate,4);assert.equal(s.exactRecordUnchanged,true);assert.deepEqual(s.errors,[]);assert.equal(s.samples.length,5);assert.equal(s.initialWorker.controlled,true);
  for(const sample of s.samples){
   for(const phase of ['cold','warm','offline']){
    assert.ok(Number.isFinite(sample[phase].interactiveMs)&&sample[phase].interactiveMs>0);
    const worker=sample.workers[phase];assert.equal(worker.controlled,true);assert.equal(worker.active,'activated');assert.deepEqual(worker.caches.filter(k=>k.startsWith('foliolab-open-')),[r.cache]);
   }
   assert.deepEqual(Object.keys(sample.navigation),['positions','bookings','history','dashboard','more']);assert.ok(Object.values(sample.navigation).every(x=>Number.isFinite(x)&&x>0));
  }
 }
}
const comparisons=[];
for(let index=0;index<2;index++){
 const scenarios=Object.fromEntries(names.map(n=>[n,reports[n].scenarios[index]])),reference=scenarios.A1;
 for(const n of names)for(const field of ['seedSha256','canonicalRawSha256','historicalSha256','totalExactEUR','dashboardLabel','bytes'])assert.equal(scenarios[n][field],reference[field],n+' exact '+field);
 const compare=get=>{
  const samples=Object.fromEntries(names.map(n=>[n,scenarios[n].samples.map(get)])),medians=Object.fromEntries(names.map(n=>[n,median(samples[n])]));
  const before=mean([medians.A1,medians.A2]),after=mean([medians.B1,medians.B2]);
  return {passMedians:medians,baselineMeanOfMedians:before,candidateMeanOfMedians:after,deltaMs:after-before,changePercent:before===0?null:(after/before-1)*100,baselineSpread:spread([...samples.A1,...samples.A2]),candidateSpread:spread([...samples.B1,...samples.B2])};
 };
 const result={positions:reference.positions,bookings:reference.bookings,journalEntries:reference.journalEntries,references:reference.references,bytes:reference.bytes,seedSha256:reference.seedSha256,canonicalRawSha256:reference.canonicalRawSha256,historicalSha256:reference.historicalSha256,totalExactEUR:reference.totalExactEUR,dashboardLabel:reference.dashboardLabel,startup:{},navigation:{},longTasks:{}};
 for(const phase of ['cold','warm','offline']){
  result.startup[phase]=compare(s=>s[phase].interactiveMs);
  result.longTasks[phase]={max:compare(s=>Math.max(0,...s[phase].longTasks.map(t=>t.duration))),total:compare(s=>s[phase].longTasks.reduce((n,t)=>n+t.duration,0))};
 }
 for(const tab of ['positions','bookings','history','dashboard','more'])result.navigation[tab]=compare(s=>s.navigation[tab]);
 const seedPath=join(root,'seed-'+reference.bookings+'.json'),raw=readFileSync(seedPath);assert.equal(createHash('sha256').update(raw).digest('hex'),reference.seedSha256);
 const packed=gzipSync(raw);writeFileSync(seedPath+'.gz',packed);unlinkSync(seedPath);result.compressedSeed={file:'seed-'+reference.bookings+'.json.gz',sha256:createHash('sha256').update(packed).digest('hex')};comparisons.push(result);
}
const summary={status:'MEASURED_VALID_SYNTHETIC_DATA',base,candidate,order:names,runsPerPass:5,runsPerVariantAndScenario:10,runner:'ubuntu-24.04',host:first.host,node:first.node,playwright:first.playwright,chromium:first.chromium,scriptSha256:first.scriptSha256,workerHelperSha256:first.workerHelperSha256,viewport:{width:390,height:844},cpuRate:4,comparisons,limitations:['Not physical Android, native Safari, native installed-PWA launch or constrained memory.','Startup measures navigation-to-validated-dashboard plus two frames; process-launch overhead excluded.','Tab navigation includes Playwright dispatch and two frames.','This is a measurement/data-integrity gate, not automatic performance or release approval.','No percentages may be added to earlier releases. Only synthetic generated portfolios; no credentials.']};
writeFileSync(join(root,'comparison.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({status:summary.status,base,candidate,comparisons:comparisons.map(s=>({bookings:s.bookings,startup:Object.fromEntries(Object.entries(s.startup).map(([phase,m])=>[phase,{baseline:m.baselineMeanOfMedians,candidate:m.candidateMeanOfMedians,changePercent:m.changePercent}]))}))},null,2));
