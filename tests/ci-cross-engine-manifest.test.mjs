import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../docs/ci/cross-engine-baseline.v1.json',import.meta.url),'utf8'));
// Preserve the historical 30-command evidence verbatim; require the new suite in addition.
const pchainCommand='PCHAIN_ENGINES=firefox,webkit node tests/browser-pchain-evidence.mjs';
const sonicCommand='SONIC_EVIDENCE_ENGINES=firefox,webkit node tests/browser-sonic-staking-evidence.mjs';
const pwaCommand='PWA_UPDATE_ENGINES=firefox,webkit node tests/browser-pwa-update.mjs';
const expectedShards={'1':manifest.shards['1'],'2':[pwaCommand,...manifest.shards['2'].flatMap(c=>c==='node tests/browser-cross-engine.mjs'?[c,pchainCommand,sonicCommand]:[c])]};
const command=/^(?:[A-Z][A-Z0-9_]*=\S+\s+)?node tests\/browser-[\w-]+\.mjs$/;
const commands=s=>s.split('\n').map(l=>l.trim()).filter(l=>command.test(l));
function validate(source){
 const begin=source.indexOf('  cross-engine:'),end=source.indexOf('\n  deploy:',begin);
 assert.ok(begin>=0&&end>begin);const cross=source.slice(begin,end),actual=commands(cross);
 assert.equal(manifest.commands.length,30);assert.equal(new Set(actual).size,actual.length);
 assert.deepEqual(actual.slice().sort(),[...manifest.commands,pchainCommand,sonicCommand,pwaCommand].sort());
 assert.match(cross,/fail-fast: false/);assert.match(cross,/shard: \[1, 2\]/);
 const branches=cross.match(/if \[\[ [^\n]+matrix\.shard[^\n]+ \]\]; then\n([\s\S]+?)\n {10}else\n([\s\S]+?)\n {10}fi/);
 assert.ok(branches);for(const key of ['1','2']){assert.ok(manifest.shards[key].length>0);assert.deepEqual(commands(branches[Number(key)]),expectedShards[key]);}
 assert.match(cross,/name: cross-engine-gates-.*matrix\.shard/);
 assert.match(source,/needs:\s*\[test,\s*cross-engine\]/);
}
test('CI preserves the independently recorded v188 cross-engine manifest in both required shards',()=>validate(workflow));
test('CI policy rejects a dropped suite, duplicate, reduced engine set or missing shard',()=>{
 const first=manifest.commands[0],line='            '+first+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('UI07_ENGINES=firefox,webkit','UI07_ENGINES=firefox'),workflow.replace('shard: [1, 2]','shard: [1]')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI requires the additional P-Chain suite in both engines without changing the historical manifest',()=>{
 const line='            '+pchainCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('PCHAIN_ENGINES=firefox,webkit','PCHAIN_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI requires the additional Sonic suite in both engines alongside all previous suites',()=>{
 const line='            '+sonicCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('SONIC_EVIDENCE_ENGINES=firefox,webkit','SONIC_EVIDENCE_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI requires warm-cache PWA update coverage in both engines without dropping any existing suite',()=>{
 const line='            '+pwaCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('PWA_UPDATE_ENGINES=firefox,webkit','PWA_UPDATE_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
 assert.match(workflow,/^ {10}node tests\/browser-pwa-update\.mjs$/m);
});
