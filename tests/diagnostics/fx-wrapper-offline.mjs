import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const qa=process.env.QA_ROOT,out=path.resolve('../wrapper-evidence');mkdirSync(out,{recursive:true});
for(const name of ['browser-fx-age.mjs','browser-fx-age-release.mjs','verified-fx-release.mjs'])writeFileSync('tests/'+name,readFileSync(qa+'/tests/diagnostics/candidate-'+name));
const start=Date.now(),r=spawnSync(process.execPath,['tests/browser-fx-age-release.mjs'],{encoding:'utf8',timeout:185000,env:{...process.env,NODE_OPTIONS:'--import '+qa+'/tests/diagnostics/fx-wrapper-offline-observer.mjs',ETF_SOURCE_BASE:'https://foliolab.unperfekt.at/',ETF_SOURCE_ENGINES:'chromium',FX_AGE_OUTPUT_DIR:out,FX_AGE_VERIFIED_RELEASE:qa+'/tests/diagnostics/fx-original-live-report.json'}});
writeFileSync(out+'/wrapper.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0,r.stderr);const full=JSON.parse(readFileSync(out+'/chromium.json')),control=JSON.parse(readFileSync(out+'/production-domain/chromium.json'));assert.equal(full.results.length,8);assert.equal(control.results.length,2);assert.equal(full.transport.replayedRequests,3408);assert.equal(full.transport.productionRequests.length,0);writeFileSync(out+'/wrapper-result.json',JSON.stringify({status:'PASS',durationMs:Date.now()-start,fullCases:8,domainControlCases:2,actualProductionRequests:0,scope:'Exact final wrapper executed; direct-domain continuation is explicitly replaced by audited bytes for this offline wiring check only'},null,2));
