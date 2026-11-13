import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {observeBrowser} from './kraken-observer.mjs';
const main='a27cde2f802c26bfec41190911d88bd1d7d8e325';
assert.equal(process.env.UH03_BASE,'https://foliolab.unperfekt.at/');
assert.equal(process.env.HISTORY_ENGINES,'chromium');
assert.equal(Object.hasOwn(process.env,'UH03_SCENARIOS'),false);
assert.match(process.env.DIAGNOSTIC_CANDIDATE_SHA||'',/^[a-f0-9]{40}$/);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),process.env.DIAGNOSTIC_CANDIDATE_SHA);
git('diff','--exit-code','HEAD','--','src','icons','index.html','styles.css','manifest.webmanifest','sw.js','tests','.github','package.json','package-lock.json');
for(const [path,sha] of [['tests/browser-kraken-import.mjs','5cd2025e30423997b5d99660a98e96cb22154b3f'],['tests/browser-controlled-storage-fixture.mjs','7ee6568522425c1a4bcb7549d3be68abda96c09f']])assert.equal(git('hash-object',path),sha);
// Compare ALL original inputs; only observer files and the diagnostic workflow may differ.
const delta=git('diff','--name-only',main,'HEAD').split('\n').filter(Boolean).sort();
assert.deepEqual(delta,['.github/workflows/live-initialization-diagnostics.yml','tests/kraken-observer.mjs','tests/kraken-preload.mjs'].sort());
const out='artifacts/gates/kraken-diagnostic';fs.mkdirSync(out,{recursive:true});
const fd=fs.openSync(out+'/events.ndjson','wx');let bytes=0,observerFailed=false;
const emit=data=>{
  const row=JSON.stringify({time:Date.now(),...data})+'\n';bytes+=Buffer.byteLength(row);
  if(bytes>16*1024*1024){observerFailed=true;throw Error('Diagnostic budget exceeded; evidence incomplete');}
  fs.writeSync(fd,row);
  if(data.type==='observer-error')observerFailed=true;
};
const require=createRequire(import.meta.url);
emit({type:'identity',main,candidate:process.env.DIAGNOSTIC_CANDIDATE_SHA,node:process.version,playwright:require('playwright/package.json').version,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,image:process.env.ImageOS,imageVersion:process.env.ImageVersion});
assert.equal(require('playwright/package.json').version,'1.56.1');
// HTTP byte comparison uses ordinary TLS, no retries, caches or certificate exception.
// Includes every deployed src/icon file and all four root assets.
const entries=execFileSync('git',['ls-tree','-r','-z',main,'--','src','icons','index.html','styles.css','manifest.webmanifest','sw.js'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const entry of entries){
  const match=entry.match(/^100644 blob ([a-f0-9]{40})\t(.+)$/);assert.ok(match,'regular public asset');
  const [,blob,path]=match,expected=fs.readFileSync(path);
  const response=await fetch(new URL(path,process.env.UH03_BASE),{redirect:'error',signal:AbortSignal.timeout(20000),cache:'no-store'});
  assert.equal(response.status,200,path);
  const actual=Buffer.from(await response.arrayBuffer());assert.deepEqual(actual,expected,path);
  emit({type:'asset-match',path,blob,sha256:createHash('sha256').update(actual).digest('hex')});
}
const launch=chromium.launch.bind(chromium);
let browserId=0;
chromium.launch=async(...args)=>{
  const id=++browserId,browser=await launch(...args);emit({type:'browser',browser:id,version:browser.version()});
  await observeBrowser(browser,data=>emit({browser:id,...data}));return browser;
};
// Import runs the complete unchanged test, preserving scenario order and contexts.
// No successful summary on crash/missing exit. The outer command retains test failure.
process.on('exit',code=>{
  if(observerFailed&&code===0)process.exitCode=1;
  fs.writeSync(fd,JSON.stringify({type:'process-exit',code:process.exitCode||code,observerFailed,complete:!observerFailed})+'\n');fs.closeSync(fd);
});
