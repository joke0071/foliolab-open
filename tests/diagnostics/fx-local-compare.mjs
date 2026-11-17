import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const qa=process.env.QA_ROOT,engine=process.env.FX_ENGINE,out=path.resolve('../comparison/'+engine);mkdirSync(out,{recursive:true});
const original=readFileSync('tests/browser-fx-age.mjs','utf8');
writeFileSync('tests/browser-fx-age-baseline.mjs',original);
for(const file of ['browser-fx-age.mjs','verified-fx-release.mjs'])writeFileSync('tests/'+file,readFileSync(qa+'/tests/diagnostics/candidate-'+file));
const candidate=readFileSync('tests/browser-fx-age.mjs','utf8');
// Retain the fixture table and the entire native UI/refresh/assertion/reopen body.
const region=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(region(candidate,'const cases=[','const replay='),region(original,'const cases=[','const deadline='));
assert.equal(region(candidate,"assert.equal(u.hostname,'api.frankfurter.dev')",' writeFileSync(dir+'),region(original,"assert.equal(u.hostname,'api.frankfurter.dev')",' writeFileSync(dir+'));
const report={engine,productSHA:process.env.RELEASE_SHA,scope:'Local-only baseline versus verified published-byte replay; no production network requests',assertionBodyIdentical:true,variants:[]};
try{
 for(const label of ['baseline','replay']){
  const dir=out+'/'+label,started=Date.now();mkdirSync(dir,{recursive:true});
  const env={...process.env,ETF_SOURCE_ENGINES:engine,ETF_SOURCE_BASE:label==='baseline'?'http://127.0.0.1:4173/':'https://foliolab.unperfekt.at/',FX_AGE_OUTPUT_DIR:dir,FX_AGE_VERIFIED_RELEASE:label==='baseline'?'':qa+'/tests/diagnostics/fx-original-live-report.json'};
  const r=spawnSync(process.execPath,['--import',qa+'/tests/diagnostics/fx-passive-observer.mjs','tests/browser-fx-age'+(label==='baseline'?'-baseline':'')+'.mjs'],{env,encoding:'utf8',timeout:190000});writeFileSync(dir+'/run.log',r.stdout+'\n'+r.stderr);report.variants.push({label,durationMs:Date.now()-started,exitCode:r.status});assert.equal(r.status,0,r.stderr);
 }
 const normalize=r=>r.results.map(x=>({...x,attempt:{...x.attempt,scope:'per-profile scope independently asserted by original test'}}));
 const baseline=JSON.parse(readFileSync(out+'/baseline/'+engine+'.json')),replay=JSON.parse(readFileSync(out+'/replay/'+engine+'.json'));assert.deepEqual(normalize(replay),normalize(baseline));assert.equal(replay.results.length,8);assert.equal(replay.transport.productionRequests.length,0);report.resultsEqual=true;report.status='PASS';
}catch(e){report.status='FAIL';report.failure=String(e);throw e;}finally{writeFileSync(out+'/comparison.json',JSON.stringify(report,null,2));writeFileSync('tests/browser-fx-age.mjs',original);}
