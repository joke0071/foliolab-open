import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const qa=process.env.QA_ROOT,engine=process.env.FX_ENGINE,out=path.resolve('../domain/'+engine);mkdirSync(out,{recursive:true});
for(const file of ['browser-fx-age.mjs','verified-fx-release.mjs'])writeFileSync('tests/'+file,readFileSync(qa+'/tests/diagnostics/candidate-'+file));
const started=Date.now(),env={...process.env,ETF_SOURCE_ENGINES:engine,ETF_SOURCE_BASE:'https://foliolab.unperfekt.at/',FX_AGE_OUTPUT_DIR:out,FX_AGE_VERIFIED_RELEASE:'',FX_AGE_DOMAIN_CONTROL:'1'};
const r=spawnSync(process.execPath,['--import',qa+'/tests/diagnostics/fx-domain-observer.mjs','tests/browser-fx-age.mjs'],{env,encoding:'utf8',timeout:185000});writeFileSync(out+'/run.log',r.stdout+'\n'+r.stderr);writeFileSync(out+'/timing.json',JSON.stringify({engine,startedAt:started,finishedAt:Date.now(),durationMs:Date.now()-started,exitCode:r.status,productSHA:process.env.RELEASE_SHA,scope:'Two original full domain cases, standard TLS, blocked SW retained; no hash-request preload, retries or added pauses'},null,2));assert.equal(r.status,0,r.stderr);
