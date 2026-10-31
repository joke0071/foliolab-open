import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const helper=new URL('./browser-gate-deadline.mjs',import.meta.url).href;
test('a stalled browser phase fails explicitly instead of remaining pending forever',()=>{
 const r=spawnSync(process.execPath,['--input-type=module','-e',`import {browserGateDeadline} from ${JSON.stringify(helper)};browserGateDeadline('synthetic blocked phase',30);setInterval(()=>{},1000);`],{encoding:'utf8',timeout:5000});
 assert.equal(r.error,undefined);assert.equal(r.status,1);assert.match(r.stderr,/BROWSER_GATE_TIMEOUT synthetic blocked phase/);
});
test('completing a browser phase clears its deadline without hiding later errors',()=>{
 for(const status of [0,7]){const r=spawnSync(process.execPath,['--input-type=module','-e',`import {browserGateDeadline} from ${JSON.stringify(helper)};const finish=browserGateDeadline('synthetic complete',10);finish();setTimeout(()=>process.exit(${status}),30);`],{encoding:'utf8',timeout:5000});assert.equal(r.status,status);assert.doesNotMatch(r.stderr,/BROWSER_GATE_TIMEOUT/);}
});
